import { Prisma } from '@prisma/client';
import { prisma } from './db';
import type { ActivityData, ActivityListItem, ProgramData, RunData, SessionData } from './programs';

/** All program, run and activity queries. Input is already checked by lib/programs.ts. */

const activityCard = {
  id: true,
  name: true,
  summary: true,
  category: true,
  goals: true,
  age_min: true,
  age_max: true,
  duration_minutes: true,
} satisfies Prisma.ActivitySelect;

export type ActivityCard = Prisma.ActivityGetPayload<{ select: typeof activityCard }>;

// ---------- Programs ----------

export function listPrograms() {
  return prisma.program.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { runs: true, activities: true } },
      runs: { orderBy: [{ start_date: 'desc' }, { id: 'desc' }], take: 1, select: { start_date: true, status: true } },
    },
  });
}

export function getProgram(id: number) {
  return prisma.program.findUnique({
    where: { id },
    include: {
      activities: { orderBy: { sort_order: 'asc' }, include: { activity: { select: activityCard } } },
      runs: {
        orderBy: [{ start_date: 'desc' }, { id: 'desc' }],
        include: { partner: { select: { id: true, org_name: true } }, sessions: { orderBy: { date: 'asc' }, select: { date: true } } },
      },
    },
  });
}

export function createProgram(data: ProgramData) {
  return prisma.program.create({ data: data as Prisma.ProgramCreateInput });
}

export async function updateProgram(id: number, data: ProgramData) {
  try {
    return await prisma.program.update({ where: { id }, data });
  } catch (e) {
    if (isNotFound(e)) return null;
    throw e;
  }
}

/** Deletes the program with its runs and their sessions; the activity library stays. */
export async function deleteProgram(id: number) {
  try {
    await prisma.program.delete({ where: { id } });
    return true;
  } catch (e) {
    if (isNotFound(e)) return false;
    throw e;
  }
}

/** Replaces a program's usual activity plan with this ordered list. */
export async function setProgramActivities(programId: number, items: ActivityListItem[]) {
  return prisma.$transaction(async (tx) => {
    if (!(await tx.program.findUnique({ where: { id: programId }, select: { id: true } }))) return 'not_found';
    if (!(await allActivitiesExist(tx, items))) return 'unknown_activity';
    await tx.programActivity.deleteMany({ where: { program_id: programId } });
    await tx.programActivity.createMany({
      data: items.map((it, i) => ({ program_id: programId, activity_id: it.activity_id, sort_order: i })),
    });
    return 'ok';
  });
}

// ---------- Runs ----------

const runListing = {
  program: { select: { id: true, name: true } },
  partner: { select: { id: true, org_name: true } },
  sessions: { orderBy: { date: 'asc' as const }, select: { date: true } },
} satisfies Prisma.ProgramRunInclude;

export type RunListing = Prisma.ProgramRunGetPayload<{ include: typeof runListing }>;

/** Every run with its program, partner and session dates, for the grouped Programs page. */
export function listRuns() {
  return prisma.programRun.findMany({ orderBy: [{ start_date: 'desc' }, { id: 'desc' }], include: runListing });
}

export function listRunsForPartner(partnerId: number) {
  return prisma.programRun.findMany({
    where: { partner_id: partnerId },
    orderBy: [{ start_date: 'desc' }, { id: 'desc' }],
    include: runListing,
  });
}

export function getRun(id: number) {
  return prisma.programRun.findUnique({
    where: { id },
    include: {
      program: { select: { id: true, name: true, goals: true, age_min: true, age_max: true } },
      partner: { select: { id: true, org_name: true, youth_ages: true } },
      sessions: {
        orderBy: [{ date: 'asc' }, { start_time: 'asc' }],
        include: { activities: { orderBy: { sort_order: 'asc' }, include: { activity: { select: { id: true, name: true } } } } },
      },
    },
  });
}

/** Creates a run. Ages default to the program's until the run says otherwise. */
export async function createRun(data: RunData) {
  const program = await prisma.program.findUnique({ where: { id: data.program_id! } });
  if (!program) return { ok: false, error: 'Program not found' } as const;
  if (data.partner_id && !(await prisma.partner.findUnique({ where: { id: data.partner_id }, select: { id: true } }))) {
    return { ok: false, error: 'Partner not found' } as const;
  }
  const run = await prisma.programRun.create({
    data: {
      ...(data as Prisma.ProgramRunUncheckedCreateInput),
      age_min: data.age_min !== undefined ? data.age_min : program.age_min,
      age_max: data.age_max !== undefined ? data.age_max : program.age_max,
    },
  });
  return { ok: true, run } as const;
}

export async function updateRun(id: number, data: RunData) {
  if (data.partner_id && !(await prisma.partner.findUnique({ where: { id: data.partner_id }, select: { id: true } }))) {
    return { ok: false, error: 'Partner not found' } as const;
  }
  try {
    return { ok: true, run: await prisma.programRun.update({ where: { id }, data: data as Prisma.ProgramRunUncheckedUpdateInput }) } as const;
  } catch (e) {
    if (isNotFound(e)) return null;
    throw e;
  }
}

/** Deletes the run and its sessions. */
export async function deleteRun(id: number) {
  try {
    await prisma.programRun.delete({ where: { id } });
    return true;
  } catch (e) {
    if (isNotFound(e)) return false;
    throw e;
  }
}

// ---------- Sessions ----------

export function getSession(id: number) {
  return prisma.programSession.findUnique({
    where: { id },
    include: {
      run: {
        select: {
          id: true,
          name: true,
          age_min: true,
          age_max: true,
          program: { select: { id: true, name: true, goals: true } },
          partner: { select: { id: true, org_name: true } },
        },
      },
      activities: { orderBy: { sort_order: 'asc' }, include: { activity: { select: activityCard } } },
    },
  });
}

/** The run's latest session, used to prefill the next one. */
export function previousSession(runId: number) {
  return prisma.programSession.findFirst({ where: { run_id: runId }, orderBy: [{ date: 'desc' }, { id: 'desc' }] });
}

/**
 * Creates a session. It starts with the program's usual activities, so the team only
 * changes what is different this time.
 */
export async function createSession(data: SessionData) {
  return prisma.$transaction(async (tx) => {
    const run = await tx.programRun.findUnique({
      where: { id: data.run_id! },
      select: { program: { select: { activities: { orderBy: { sort_order: 'asc' }, select: { activity_id: true } } } } },
    });
    if (!run) return { ok: false, error: 'Run not found' } as const;
    const session = await tx.programSession.create({
      data: { ...(data as Prisma.ProgramSessionUncheckedCreateInput), tasks: (data.tasks ?? []) as Prisma.InputJsonValue },
    });
    await tx.sessionActivity.createMany({
      data: run.program.activities.map((pa, i) => ({ session_id: session.id, activity_id: pa.activity_id, sort_order: i })),
    });
    return { ok: true, session } as const;
  });
}

export async function updateSession(id: number, data: SessionData) {
  try {
    return await prisma.programSession.update({
      where: { id },
      data: { ...(data as Prisma.ProgramSessionUncheckedUpdateInput), tasks: data.tasks as Prisma.InputJsonValue | undefined },
    });
  } catch (e) {
    if (isNotFound(e)) return null;
    throw e;
  }
}

/** Deletes a session; returns its run id, or null if it was already gone. */
export async function deleteSession(id: number) {
  try {
    const s = await prisma.programSession.delete({ where: { id }, select: { run_id: true } });
    return s.run_id;
  } catch (e) {
    if (isNotFound(e)) return null;
    throw e;
  }
}

/** Replaces what this session did with this ordered list, each with how it was adapted. */
export async function setSessionActivities(sessionId: number, items: ActivityListItem[]) {
  return prisma.$transaction(async (tx) => {
    if (!(await tx.programSession.findUnique({ where: { id: sessionId }, select: { id: true } }))) return 'not_found';
    if (!(await allActivitiesExist(tx, items))) return 'unknown_activity';
    await tx.sessionActivity.deleteMany({ where: { session_id: sessionId } });
    await tx.sessionActivity.createMany({
      data: items.map((it, i) => ({ session_id: sessionId, activity_id: it.activity_id, sort_order: i, notes: it.notes })),
    });
    return 'ok';
  });
}

/** Names already used on teams, plus account display names, for typing hints. */
export async function teamNames() {
  const [sessions, users] = await Promise.all([
    prisma.programSession.findMany({ select: { development_team: true, facilitation_team: true }, take: 500, orderBy: { date: 'desc' } }),
    prisma.user.findMany({ select: { display_name: true } }),
  ]);
  const names = new Map<string, string>();
  for (const n of [...users.map((u) => u.display_name), ...sessions.flatMap((s) => [...s.development_team, ...s.facilitation_team])]) {
    if (n && !names.has(n.toLowerCase())) names.set(n.toLowerCase(), n);
  }
  return [...names.values()].sort((a, b) => a.localeCompare(b));
}

// ---------- Activities ----------

export type ActivityFilter = { q?: string; age?: number; goal?: string; category?: string };

export function listActivities(filter: ActivityFilter = {}) {
  const and: Prisma.ActivityWhereInput[] = [];
  if (filter.q) {
    and.push({
      OR: [
        { name: { contains: filter.q, mode: 'insensitive' } },
        { summary: { contains: filter.q, mode: 'insensitive' } },
      ],
    });
  }
  if (filter.age != null) {
    and.push({ OR: [{ age_min: null }, { age_min: { lte: filter.age } }] });
    and.push({ OR: [{ age_max: null }, { age_max: { gte: filter.age } }] });
  }
  if (filter.goal) and.push({ goals: { has: filter.goal } });
  if (filter.category) and.push({ category: { equals: filter.category, mode: 'insensitive' } });

  return prisma.activity.findMany({
    where: and.length ? { AND: and } : undefined,
    orderBy: { name: 'asc' },
    select: {
      ...activityCard,
      based_on: { select: { id: true, name: true } },
      _count: { select: { variants: true, sessions: true } },
    },
  });
}

/** Every activity, small, for pickers and suggestions. */
export function listActivityCards() {
  return prisma.activity.findMany({ orderBy: { name: 'asc' }, select: activityCard });
}

/** Distinct goals and categories already in use, for filters and typing hints. */
export async function activityVocabulary() {
  const [activities, programs] = await Promise.all([
    prisma.activity.findMany({ select: { goals: true, category: true } }),
    prisma.program.findMany({ select: { goals: true } }),
  ]);
  const goals = new Map<string, string>();
  for (const g of [...activities, ...programs].flatMap((r) => r.goals)) {
    if (!goals.has(g.toLowerCase())) goals.set(g.toLowerCase(), g);
  }
  const categories = new Set(activities.map((a) => a.category).filter((c): c is string => Boolean(c)));
  return {
    goals: [...goals.values()].sort((a, b) => a.localeCompare(b)),
    categories: [...categories].sort((a, b) => a.localeCompare(b)),
  };
}

export function getActivity(id: number) {
  return prisma.activity.findUnique({
    where: { id },
    include: {
      based_on: { select: { id: true, name: true } },
      variants: { orderBy: { name: 'asc' }, select: { id: true, name: true, summary: true } },
      programs: { include: { program: { select: { id: true, name: true } } } },
      sessions: {
        orderBy: { session: { date: 'desc' } },
        take: 100,
        include: {
          session: {
            select: {
              id: true,
              date: true,
              title: true,
              run: { select: { name: true, program: { select: { name: true } }, partner: { select: { org_name: true } } } },
            },
          },
        },
      },
    },
  });
}

export async function createActivity(data: ActivityData) {
  if (data.based_on_id && !(await prisma.activity.findUnique({ where: { id: data.based_on_id }, select: { id: true } }))) {
    return { ok: false, error: 'The activity this is based on no longer exists' } as const;
  }
  return { ok: true, activity: await prisma.activity.create({ data: data as Prisma.ActivityUncheckedCreateInput }) } as const;
}

export async function updateActivity(id: number, data: ActivityData) {
  try {
    return await prisma.activity.update({ where: { id }, data: data as Prisma.ActivityUncheckedUpdateInput });
  } catch (e) {
    if (isNotFound(e)) return null;
    throw e;
  }
}

/**
 * Deletes an activity unless a session used it (that session's record would lose a step).
 * Its twists stay in the library; they just no longer point back to it.
 */
export async function deleteActivity(id: number) {
  const used = await prisma.sessionActivity.count({ where: { activity_id: id } });
  if (used > 0) return 'in_use' as const;
  try {
    await prisma.activity.delete({ where: { id } });
    return 'ok' as const;
  } catch (e) {
    if (isNotFound(e)) return 'not_found' as const;
    throw e;
  }
}

// ---------- helpers ----------

async function allActivitiesExist(tx: Prisma.TransactionClient, items: ActivityListItem[]) {
  if (items.length === 0) return true;
  const count = await tx.activity.count({ where: { id: { in: items.map((i) => i.activity_id) } } });
  return count === items.length;
}

function isNotFound(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025';
}
