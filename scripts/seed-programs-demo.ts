/**
 * Demo data for the Programs pages: Launchpad Philly, with three past summers (Game Dev and
 * 3D Design CAD tracks), last year's fall clubs (3D Design Club, 3D Geospatial Club), this
 * year's clubs in progress, and the 4th summer planned. Everything is fake except the shape.
 *
 *   npm run db:seed-programs-demo            add (or refresh) the demo data
 *   npm run db:seed-programs-demo -- --remove   take it all out again
 *
 * Only for a test database: it refuses to run on Vercel or with NODE_ENV=production. Re-running
 * replaces the previous demo data; nothing that isn't demo data is touched. Demo runs are
 * recognized by their DEMO_NOTE, demo programs and activities by their exact name and
 * description/summary (so nothing visible is added just to find them again), and the
 * partner by source "demo".
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DEMO_NOTE = 'Demo data — safe to delete.';
const LEGACY_MARK = '[demo data]';
type ActivityDef = { name: string; category: string; summary: string; goals: string[]; age_min?: number; age_max?: number; duration_minutes: number; materials?: string };
type ProgramDef = { name: string; description: string; goals: string[]; age_min: number; age_max: number };

const ACTIVITY_DEFS = {
  icebreaker: { name: 'Name + superpower circle', category: 'Icebreaker', summary: 'Say your name and the superpower you would 3D print.', goals: ['Community', 'Confidence'], duration_minutes: 10 },
  gallery: { name: 'Gallery walk', category: 'Showcase', summary: 'Creators set up their work; everyone walks and leaves sticky-note feedback.', goals: ['Communication', 'Confidence'], duration_minutes: 30 },
  familyShowcase: { name: 'Family showcase night', category: 'Showcase', summary: 'Gallery walk for families and Launchpad staff, with short creator talks.', goals: ['Communication', 'Confidence'], duration_minutes: 60 },
  pitch: { name: 'Game idea pitch', category: 'Design challenge', summary: 'Teams pitch a one-sentence game idea and vote on what to build.', goals: ['Game design', 'Teamwork'], age_min: 12, age_max: 18, duration_minutes: 30 },
  firstLevel: { name: 'First playable level', category: 'Hands-on build', summary: 'Build a moving character and one level in the game engine.', goals: ['Game design', 'Coding'], age_min: 12, age_max: 18, duration_minutes: 90, materials: 'Laptops with the game engine installed' },
  paperLevels: { name: 'Paper level design', category: 'Design challenge', summary: 'Sketch levels on paper before building them.', goals: ['Game design', 'Problem solving'], age_min: 10, duration_minutes: 30, materials: 'Graph paper, markers' },
  playtest: { name: 'Playtest & feedback circle', category: 'Reflection', summary: 'Swap games, play for five minutes, give one glow and one grow.', goals: ['Communication', 'Game design'], duration_minutes: 40 },
  keychain: { name: 'Tinkercad keychain', category: 'Hands-on build', summary: 'Design a name keychain and send it to the printer.', goals: ['3D design', 'Confidence'], age_min: 9, duration_minutes: 45 },
  clubKeychain: { name: 'Tinkercad keychain (club speed round)', category: 'Hands-on build', summary: 'The keychain in 20 minutes, as a warm-up for returning creators.', goals: ['3D design'], age_min: 12, duration_minutes: 20 },
  phoneStand: { name: 'CAD phone stand', category: 'Hands-on build', summary: 'Measure a phone and model a stand that fits it in CAD.', goals: ['3D design', 'Engineering'], age_min: 13, duration_minutes: 90, materials: 'Calipers, laptops' },
  printIterate: { name: 'Print, test, iterate', category: 'Hands-on build', summary: 'Print a part, test the fit, change one thing, print again.', goals: ['Engineering', 'Problem solving'], age_min: 12, duration_minutes: 60, materials: '3D printers, PLA' },
  mapWalk: { name: 'Neighborhood map walk', category: 'Hands-on build', summary: 'Walk the block and mark landmarks to model later.', goals: ['3D mapping', 'Community'], age_min: 12, duration_minutes: 40 },
  photogrammetry: { name: 'Photogrammetry capture', category: 'Hands-on build', summary: 'Photograph an object from every angle and turn it into a 3D model.', goals: ['3D mapping', '3D design'], age_min: 12, duration_minutes: 60, materials: 'Phones or tablets, turntable' },
  modelBlock: { name: 'Model your block', category: 'Group project', summary: 'Teams model one street of the neighborhood for a shared map.', goals: ['3D mapping', 'Teamwork'], age_min: 13, duration_minutes: 90 },
} satisfies Record<string, ActivityDef>;

const PROGRAM_DEFS = {
  gameDev: { name: 'Summer Program — Game Dev', ...{ description: 'Summer track: teams design, build and playtest their own game.', goals: ['Game design', 'Coding', 'Teamwork'], age_min: 13, age_max: 18 } },
  cad: { name: 'Summer Program — 3D Design (CAD)', ...{ description: 'Summer track: from first Tinkercad model to a printed, tested design.', goals: ['3D design', 'Engineering', 'Confidence'], age_min: 13, age_max: 18 } },
  designClub: { name: '3D Design Club', ...{ description: 'After-school club continuing CAD and 3D printing through the school year.', goals: ['3D design', 'Engineering', 'Community'], age_min: 13, age_max: 18 } },
  geoClub: { name: '3D Geospatial Club', ...{ description: 'After-school club mapping and modeling the neighborhood in 3D.', goals: ['3D mapping', 'Teamwork', 'Community'], age_min: 13, age_max: 18 } },
} satisfies Record<string, ProgramDef>;

const DEMO_ACTIVITY_DEFS: ActivityDef[] = Object.values(ACTIVITY_DEFS);
const DEMO_PROGRAM_DEFS: ProgramDef[] = Object.values(PROGRAM_DEFS);
const PARTNER_NAME = 'Launchpad Philly';
const TODAY = new Date();

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const isPast = (d: Date) => iso(d) < iso(TODAY);

const TEAM = ['Liz', 'Jordan', 'Amara', 'Marcus', 'Priya', 'Devon'];
const pick = (i: number, n: number) => Array.from({ length: n }, (_, k) => TEAM[(i + k) % TEAM.length]);

async function removeDemo() {
  // Runs cascade to their sessions, session activities and debriefs.
  // `contains` and LEGACY_MARK also catch demo data from before the marker was dropped.
  const runs = await prisma.programRun.deleteMany({ where: { notes: { contains: DEMO_NOTE } } });
  const activities = await prisma.activity.deleteMany({
    where: {
      OR: [...DEMO_ACTIVITY_DEFS.map((a) => ({ name: a.name, summary: a.summary })), { instructions: { contains: LEGACY_MARK } }],
      sessions: { none: {} },
    },
  });
  const programs = await prisma.program.deleteMany({
    where: {
      OR: [...DEMO_PROGRAM_DEFS.map((p) => ({ name: p.name, description: p.description })), { description: { contains: LEGACY_MARK } }],
      runs: { none: {} },
    },
  });
  const partners = await prisma.partner.deleteMany({ where: { source: 'demo', runs: { none: {} } } });
  console.log(`Removed demo data: ${runs.count} runs, ${programs.count} programs, ${activities.count} activities, ${partners.count} partner.`);
}

async function main() {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to add demo data on a production environment.');
  }
  const applied = await prisma.$queryRawUnsafe<{ n: number }[]>(
    `SELECT COUNT(*)::int AS n FROM _prisma_migrations WHERE migration_name = '20261111120000_session_debriefs' AND finished_at IS NOT NULL`
  );
  if (!applied[0]?.n) {
    throw new Error('This database has no Programs tables yet. Point .env.local at your test branch and run npm run db:deploy first.');
  }

  await removeDemo();
  if (process.argv.includes('--remove')) return;

  // ---------- Partner ----------
  const partner =
    (await prisma.partner.findFirst({ where: { org_name: { equals: PARTNER_NAME, mode: 'insensitive' } } })) ??
    (await prisma.partner.create({
      data: {
        org_name: PARTNER_NAME,
        status: 'Active Partner',
        org_city: 'Philadelphia',
        org_state: 'PA',
        youth_ages: '13–18',
        desired_program_type: '3D Printing',
        source: 'demo',
        contact_name: 'Demo Contact',
      },
    }));

  // ---------- Activity library ----------
  const act = (def: ActivityDef, based_on_id?: number) =>
    prisma.activity.create({ data: { ...def, based_on_id, group_size: '12–24', instructions: def.summary } });

  const icebreaker = await act(ACTIVITY_DEFS.icebreaker);
  const gallery = await act(ACTIVITY_DEFS.gallery);
  const familyShowcase = await act(ACTIVITY_DEFS.familyShowcase, gallery.id);
  const pitch = await act(ACTIVITY_DEFS.pitch);
  const firstLevel = await act(ACTIVITY_DEFS.firstLevel);
  const paperLevels = await act(ACTIVITY_DEFS.paperLevels);
  const playtest = await act(ACTIVITY_DEFS.playtest);
  const keychain = await act(ACTIVITY_DEFS.keychain);
  const clubKeychain = await act(ACTIVITY_DEFS.clubKeychain, keychain.id);
  const phoneStand = await act(ACTIVITY_DEFS.phoneStand);
  const printIterate = await act(ACTIVITY_DEFS.printIterate);
  const mapWalk = await act(ACTIVITY_DEFS.mapWalk);
  const photogrammetry = await act(ACTIVITY_DEFS.photogrammetry);
  const modelBlock = await act(ACTIVITY_DEFS.modelBlock);

  // ---------- Program library ----------
  const program = async (def: ProgramDef, plan: { id: number }[]) => {
    const existing = await prisma.program.findFirst({ where: { name: def.name } });
    const p =
      existing ??
      (await prisma.program.create({ data: def }));
    if (!existing) {
      await prisma.programActivity.createMany({ data: plan.map((a, i) => ({ program_id: p.id, activity_id: a.id, sort_order: i })) });
    }
    return p;
  };
  const gameDev = await program(PROGRAM_DEFS.gameDev, [icebreaker, pitch, firstLevel]);
  const cad = await program(PROGRAM_DEFS.cad, [icebreaker, keychain, phoneStand]);
  const designClub = await program(PROGRAM_DEFS.designClub, [clubKeychain, printIterate]);
  const geoClub = await program(PROGRAM_DEFS.geoClub, [mapWalk, photogrammetry]);

  // ---------- Runs, sessions and debriefs ----------
  type SessionPlan = { date: Date; title: string; activities: { id: number }[]; adapted?: string };
  const debriefs = [
    { went_well: 'Creators jumped in fast; the pairs worked well together.', to_improve: 'Laptop logins ate the first 15 minutes.', changes_next_time: 'Log laptops in before creators arrive.', highlights: '"Can I keep working on this at home?"', follow_ups: 'Liz: send the slides to Launchpad Philly' },
    { went_well: 'The build time was the right length.', to_improve: 'Two printers jammed; we fell behind on prints.', changes_next_time: 'Start prints in the first half hour.', highlights: 'A team helped another debug their model unprompted.', follow_ups: 'Jordan: check printer nozzles' },
    { went_well: 'Showcase energy was high; families stayed late.', to_improve: 'Not every creator got to present.', changes_next_time: 'Time-box talks to two minutes each.', highlights: 'Three creators asked about joining the fall clubs.', follow_ups: 'Amara: share club sign-up link' },
  ];

  const run = async (
    p: { id: number; name: string },
    name: string,
    status: string,
    start: string,
    end: string,
    sessions: SessionPlan[],
    opts: { location: string; arrival: string; startTime: string; endTime: string; creators: number; what_changed?: string; leaveLastDue?: boolean; jira_epic?: string }
  ) => {
    const r = await prisma.programRun.create({
      data: {
        program_id: p.id,
        partner_id: partner.id,
        name,
        status,
        start_date: day(start),
        end_date: day(end),
        location: opts.location,
        age_min: 13,
        age_max: 18,
        participant_count: opts.creators,
        what_changed: opts.what_changed ?? null,
        notes: DEMO_NOTE,
        jira_epic: opts.jira_epic ?? null,
      },
    });
    const pastSessions = sessions.filter((s) => isPast(s.date));
    for (const [i, s] of sessions.entries()) {
      const session = await prisma.programSession.create({
        data: {
          run_id: r.id,
          date: s.date,
          title: s.title,
          start_time: opts.startTime,
          end_time: opts.endTime,
          arrival_time: opts.arrival,
          location: opts.location,
          description: `${p.name}: ${s.title.toLowerCase()}.`,
          creator_count: opts.creators,
          audience_notes: 'Ages 13–18, Launchpad Philly creators',
          development_team: pick(i, 2),
          facilitation_team: pick(i + 2, 3),
          equipment: 'Laptops, 3D printers, handout prints, swag',
          planning_doc_url: 'https://drive.google.com/drive/folders/demo-planning',
          slides_url: isPast(s.date) ? `https://docs.google.com/presentation/d/demo-${r.id}-${i + 1}` : null,
          tasks: [
            { text: 'Check Jira to-dos', done: isPast(s.date) },
            { text: 'Print handouts', done: isPast(s.date) },
          ],
          notes: s.adapted ?? null,
        },
      });
      await prisma.sessionActivity.createMany({
        data: s.activities.map((a, j) => ({ session_id: session.id, activity_id: a.id, sort_order: j, notes: j === 1 && s.adapted ? s.adapted : null })),
      });
      const isLastPast = pastSessions[pastSessions.length - 1] === s;
      if (isPast(s.date) && !(opts.leaveLastDue && isLastPast)) {
        await prisma.sessionDebrief.create({
          data: {
            session_id: session.id,
            attendance: opts.creators - (i % 4),
            engagement: 3 + ((i + r.id) % 3),
            ...debriefs[i % debriefs.length],
            submitted_by: pick(i + 2, 1)[0],
          },
        });
      }
    }
    return r;
  };

  // Summers: one week of milestones per track, Mon/Wed in July.
  const summer = (year: number, track: 'game' | 'cad', status: string, withSessions: boolean) => {
    const first = day(`${year}-07-${year === 2024 ? '08' : year === 2025 ? '07' : year === 2026 ? '06' : '12'}`);
    const plan: SessionPlan[] = !withSessions
      ? []
      : track === 'game'
        ? [
            { date: first, title: 'Kickoff and game pitches', activities: [icebreaker, pitch] },
            { date: addDays(first, 2), title: 'Paper levels', activities: [paperLevels, firstLevel] },
            { date: addDays(first, 7), title: 'Build week', activities: [firstLevel], adapted: 'Split into two rooms by engine experience' },
            { date: addDays(first, 9), title: 'Playtesting', activities: [playtest] },
            { date: addDays(first, 14), title: 'Showcase', activities: [familyShowcase] },
          ]
        : [
            { date: first, title: 'Kickoff and keychains', activities: [icebreaker, keychain] },
            { date: addDays(first, 2), title: 'Measuring and CAD basics', activities: [phoneStand] },
            { date: addDays(first, 7), title: 'Print and iterate', activities: [printIterate], adapted: 'Pre-sliced prints to save printer time' },
            { date: addDays(first, 9), title: 'Final designs', activities: [phoneStand, printIterate] },
            { date: addDays(first, 14), title: 'Showcase', activities: [familyShowcase] },
          ];
    const n = year - 2023;
    return run(track === 'game' ? gameDev : cad, `Summer ${year}`, status, `${year}-07-01`, `${year}-08-01`, plan, {
      location: 'Launchpad Philly, main lab',
      arrival: '09:00',
      startTime: '10:00',
      endTime: '14:00',
      creators: 18 + n * 2,
      jira_epic: `${track === 'game' ? 'GAME' : 'CAD'}-${year - 2000}`,
      what_changed: n === 1 ? 'First summer with Launchpad Philly.' : `Summer #${n}: ${n === 2 ? 'added a family showcase' : 'longer build week, more printers'}.`,
    });
  };

  // Past summers (1st–3rd), with every session debriefed.
  for (const year of [2024, 2025, 2026]) {
    await summer(year, 'game', 'Completed', true);
    await summer(year, 'cad', 'Completed', true);
  }

  // Clubs: weekly after school. Last year's are done; this year's are running now.
  const weekly = (start: string, count: number, titles: string[], acts: { id: number }[][]) =>
    Array.from({ length: count }, (_, i) => ({ date: addDays(day(start), i * 7), title: titles[i % titles.length], activities: acts[i % acts.length] }));
  const clubOpts = { location: 'Launchpad Philly, room 2', arrival: '15:00', startTime: '15:30', endTime: '17:00', creators: 14 };

  await run(designClub, '2025–2026', 'Completed', '2025-10-02', '2026-03-26',
    weekly('2025-10-02', 8, ['Welcome back', 'CAD refresh', 'Design brief', 'Prototype', 'Print day', 'Iterate', 'Polish', 'Club showcase'], [[icebreaker, clubKeychain], [phoneStand], [printIterate], [gallery]]),
    { ...clubOpts, jira_epic: 'CLUB-25', what_changed: 'First year of clubs, after Summer 2025.' });
  await run(geoClub, '2025–2026', 'Completed', '2025-10-01', '2026-03-25',
    weekly('2025-10-01', 8, ['Kickoff', 'Map walk', 'Photogrammetry', 'Model your block', 'Texturing', 'Assemble the map', 'Polish', 'Map showcase'], [[icebreaker, mapWalk], [photogrammetry], [modelBlock], [gallery]]),
    { ...clubOpts, jira_epic: 'GEO-25', what_changed: 'First year of clubs, after Summer 2025.' });

  await run(designClub, '2026–2027', 'Active', '2026-10-01', '2027-03-25',
    weekly('2026-10-01', 12, ['Welcome back', 'CAD refresh', 'Design brief', 'Prototype', 'Print day', 'Iterate'], [[icebreaker, clubKeychain], [phoneStand], [printIterate]]),
    { ...clubOpts, leaveLastDue: true, jira_epic: 'CLUB-26', what_changed: 'Second year; returning creators mentor new ones.' });
  await run(geoClub, '2026–2027', 'Active', '2026-09-30', '2027-03-24',
    weekly('2026-09-30', 12, ['Kickoff', 'Map walk', 'Photogrammetry', 'Model your block', 'Texturing', 'Assemble the map'], [[icebreaker, mapWalk], [photogrammetry], [modelBlock]]),
    { ...clubOpts, leaveLastDue: true, jira_epic: 'GEO-26', what_changed: 'Second year; mapping a new neighborhood.' });

  // The 4th summer, planned with no sessions yet.
  await summer(2027, 'game', 'Planned', false);
  await summer(2027, 'cad', 'Planned', false);

  const [runs, sessions, debriefCount] = await Promise.all([
    prisma.programRun.count({ where: { partner_id: partner.id } }),
    prisma.programSession.count({ where: { run: { partner_id: partner.id } } }),
    prisma.sessionDebrief.count({ where: { session: { run: { partner_id: partner.id } } } }),
  ]);
  console.log(`Added demo data for ${partner.org_name} (partner ${partner.id}): ${runs} programs, ${sessions} sessions, ${debriefCount} debriefs.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
