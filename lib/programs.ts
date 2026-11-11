/**
 * Programs, program runs and the activity library: input checks and activity suggestions.
 * Pure functions only (no database), so they can be unit tested; queries live in
 * lib/programsData.ts.
 *
 * - A Program is the reusable idea ("Intro to 3D Printing").
 * - A ProgramRun is one time it happens, often with a partner, and can differ from the plan.
 * - An Activity can be based on another one (a twist), so the library keeps its family tree.
 */

export const RUN_STATUSES = ['Planned', 'Active', 'Completed', 'Cancelled'] as const;
export type RunStatus = (typeof RUN_STATUSES)[number];

export const ACTIVITY_CATEGORIES = [
  'Icebreaker',
  'Warm-up',
  'Hands-on build',
  'Design challenge',
  'Demo',
  'Group project',
  'Reflection',
  'Showcase',
];

/** Activity types to offer while typing: the ones in use plus the starter list. */
export function categoryChoices(inUse: string[]): string[] {
  const byKey = new Map<string, string>();
  for (const c of [...inUse, ...ACTIVITY_CATEGORIES]) if (!byKey.has(c.toLowerCase())) byKey.set(c.toLowerCase(), c);
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
}

const MAX_TEXT = 200;
const MAX_LONG_TEXT = 10_000;
const MAX_TAGS = 20;
const MAX_TAG = 40;
const MAX_AGE = 120;

type Result<T> = { ok: true; data: T } | { ok: false; error: string };
type Input = Record<string, unknown>;

function text(v: unknown, max: number): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== 'string' && typeof v !== 'number') throw new Error('must be text');
  const s = String(v).trim();
  if (s.length > max) throw new Error(`must be ${max} characters or fewer`);
  return s || null;
}

function int(v: unknown, min: number, max: number): number | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  if (!Number.isInteger(n) || n < min || n > max) throw new Error(`must be a whole number from ${min} to ${max}`);
  return n;
}

/** Goals arrive as a list or as "teamwork, design thinking". Kept in order, duplicates dropped. */
export function cleanTags(v: unknown): string[] {
  const raw = Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const tag = item.trim().replace(/\s+/g, ' ');
    if (!tag) continue;
    if (tag.length > MAX_TAG) throw new Error(`each goal must be ${MAX_TAG} characters or fewer`);
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  if (out.length > MAX_TAGS) throw new Error(`no more than ${MAX_TAGS} goals`);
  return out;
}

function date(v: unknown): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error('must be a date (YYYY-MM-DD)');
  const d = new Date(`${v}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) throw new Error('must be a real date');
  return d;
}

/** Runs each field check and turns the first failure into "Field name must ...". */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- each check returns its own field type
type Values = Record<string, any>;

function collect<T>(checks: [string, () => unknown][], build: (values: Values) => T | string): Result<T> {
  const values: Values = {};
  for (const [label, check] of checks) {
    try {
      values[label] = check();
    } catch (e) {
      return { ok: false, error: `${label} ${(e as Error).message}` };
    }
  }
  const built = build(values);
  return typeof built === 'string' ? { ok: false, error: built } : { ok: true, data: built };
}

function agesError(min: number | null | undefined, max: number | null | undefined) {
  return min != null && max != null && min > max ? 'Youngest age must not be more than oldest age' : null;
}

/** Drops undefined keys so a PATCH only touches the fields that were sent. */
function defined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export type ProgramData = {
  name?: string;
  description?: string | null;
  goals?: string[];
  age_min?: number | null;
  age_max?: number | null;
  audience_notes?: string | null;
};

export function validateProgram(input: unknown, { partial = false } = {}): Result<ProgramData> {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Send the program as an object' };
  const b = input as Input;
  return collect<ProgramData>(
    [
      ['Name', () => text(b.name, MAX_TEXT)],
      ['Description', () => text(b.description, MAX_LONG_TEXT)],
      ['Goals', () => (b.goals === undefined ? undefined : cleanTags(b.goals))],
      ['Youngest age', () => int(b.age_min, 0, MAX_AGE)],
      ['Oldest age', () => int(b.age_max, 0, MAX_AGE)],
      ['Audience notes', () => text(b.audience_notes, MAX_LONG_TEXT)],
    ],
    (v) => {
      if ((!partial || v.Name !== undefined) && !v.Name) return 'Name is required';
      const ages = agesError(v['Youngest age'], v['Oldest age']);
      if (ages) return ages;
      return defined({
        name: v.Name ?? undefined,
        description: v.Description,
        goals: v.Goals,
        age_min: v['Youngest age'],
        age_max: v['Oldest age'],
        audience_notes: v['Audience notes'],
      });
    }
  );
}

export type ActivityData = {
  name?: string;
  summary?: string | null;
  category?: string | null;
  goals?: string[];
  age_min?: number | null;
  age_max?: number | null;
  duration_minutes?: number | null;
  group_size?: string | null;
  materials?: string | null;
  instructions?: string | null;
  based_on_id?: number | null;
};

export function validateActivity(input: unknown, { partial = false } = {}): Result<ActivityData> {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Send the activity as an object' };
  const b = input as Input;
  return collect<ActivityData>(
    [
      ['Name', () => text(b.name, MAX_TEXT)],
      ['Summary', () => text(b.summary, 1000)],
      ['Category', () => text(b.category, 80)],
      ['Goals', () => (b.goals === undefined ? undefined : cleanTags(b.goals))],
      ['Youngest age', () => int(b.age_min, 0, MAX_AGE)],
      ['Oldest age', () => int(b.age_max, 0, MAX_AGE)],
      ['Length (minutes)', () => int(b.duration_minutes, 1, 24 * 60)],
      ['Group size', () => text(b.group_size, 80)],
      ['Materials', () => text(b.materials, MAX_LONG_TEXT)],
      ['Instructions', () => text(b.instructions, MAX_LONG_TEXT)],
      // Only set when an activity is created as a twist of another; an edit can't move it.
      ['Based on', () => (partial ? undefined : int(b.based_on_id, 1, 2 ** 31 - 1))],
    ],
    (v) => {
      if ((!partial || v.Name !== undefined) && !v.Name) return 'Name is required';
      const ages = agesError(v['Youngest age'], v['Oldest age']);
      if (ages) return ages;
      return defined({
        name: v.Name ?? undefined,
        summary: v.Summary,
        category: v.Category,
        goals: v.Goals,
        age_min: v['Youngest age'],
        age_max: v['Oldest age'],
        duration_minutes: v['Length (minutes)'],
        group_size: v['Group size'],
        materials: v.Materials,
        instructions: v.Instructions,
        based_on_id: v['Based on'],
      });
    }
  );
}

export type RunData = {
  program_id?: number;
  /** Instead of program_id: create this program in the library and run it. */
  new_program_name?: string;
  partner_id?: number | null;
  name?: string;
  status?: RunStatus;
  start_date?: Date | null;
  end_date?: Date | null;
  location?: string | null;
  age_min?: number | null;
  age_max?: number | null;
  participant_count?: number | null;
  what_changed?: string | null;
  notes?: string | null;
};

export function validateRun(input: unknown, { partial = false } = {}): Result<RunData> {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Send the run as an object' };
  const b = input as Input;
  return collect<RunData>(
    [
      // A run stays with the program it was made for.
      ['Program', () => (partial ? undefined : int(b.program_id, 1, 2 ** 31 - 1))],
      ['New program name', () => (partial ? undefined : text(b.new_program_name, MAX_TEXT))],
      ['Partner', () => int(b.partner_id, 1, 2 ** 31 - 1)],
      ['Name', () => text(b.name, MAX_TEXT)],
      ['Status', () => text(b.status, 40)],
      ['Start date', () => date(b.start_date)],
      ['End date', () => date(b.end_date)],
      ['Location', () => text(b.location, MAX_TEXT)],
      ['Youngest age', () => int(b.age_min, 0, MAX_AGE)],
      ['Oldest age', () => int(b.age_max, 0, MAX_AGE)],
      ['Participants', () => int(b.participant_count, 0, 100_000)],
      ['What changed', () => text(b.what_changed, MAX_LONG_TEXT)],
      ['Notes', () => text(b.notes, MAX_LONG_TEXT)],
    ],
    (v) => {
      if (!partial && !v.Program && !v['New program name']) return 'Choose a program or name a new one';
      if (v.Program && v['New program name']) return 'Choose a program or name a new one, not both';
      if ((!partial || v.Name !== undefined) && !v.Name) return 'Name is required';
      if (v.Status != null && !(RUN_STATUSES as readonly string[]).includes(v.Status)) {
        return `Status must be one of ${RUN_STATUSES.join(', ')}`;
      }
      if (v['Start date'] && v['End date'] && v['Start date'] > v['End date']) return 'End date must not be before the start date';
      const ages = agesError(v['Youngest age'], v['Oldest age']);
      if (ages) return ages;
      return defined({
        program_id: v.Program ?? undefined,
        new_program_name: v['New program name'] ?? undefined,
        partner_id: v.Partner,
        name: v.Name ?? undefined,
        status: v.Status ?? undefined,
        start_date: v['Start date'],
        end_date: v['End date'],
        location: v.Location,
        age_min: v['Youngest age'],
        age_max: v['Oldest age'],
        participant_count: v.Participants,
        what_changed: v['What changed'],
        notes: v.Notes,
      });
    }
  );
}

export type ActivityListItem = { activity_id: number; notes: string | null };

/** The ordered activity list for a program plan or a run. Notes only apply to runs. */
export function validateActivityList(input: unknown, { withNotes = false } = {}): Result<ActivityListItem[]> {
  if (!Array.isArray(input)) return { ok: false, error: 'Send the activities as a list' };
  if (input.length > 200) return { ok: false, error: 'No more than 200 activities' };
  const seen = new Set<number>();
  const out: ActivityListItem[] = [];
  for (const item of input) {
    const raw = item && typeof item === 'object' ? (item as Input).activity_id : undefined;
    let id: number | null | undefined;
    let notes: string | null | undefined = null;
    try {
      id = int(raw, 1, 2 ** 31 - 1);
      if (withNotes) notes = text((item as Input).notes, 2000);
    } catch (e) {
      return { ok: false, error: `Activity ${(e as Error).message}` };
    }
    if (!id) return { ok: false, error: 'Each activity needs an id' };
    if (seen.has(id)) return { ok: false, error: 'An activity is listed twice' };
    seen.add(id);
    out.push({ activity_id: id, notes: notes ?? null });
  }
  return { ok: true, data: out };
}

/** "8–12", "8+", "up to 12", or null when no ages are set. */
export function formatAges(min: number | null | undefined, max: number | null | undefined): string | null {
  if (min != null && max != null) return min === max ? `${min}` : `${min}–${max}`;
  if (min != null) return `${min}+`;
  if (max != null) return `up to ${max}`;
  return null;
}

/** Ranges with a missing end are open on that side, so they fit anything there. */
export function agesOverlap(
  aMin: number | null | undefined,
  aMax: number | null | undefined,
  bMin: number | null | undefined,
  bMax: number | null | undefined
): boolean {
  const lo = Math.max(aMin ?? -Infinity, bMin ?? -Infinity);
  const hi = Math.min(aMax ?? Infinity, bMax ?? Infinity);
  return lo <= hi;
}

export type SuggestTarget = {
  age_min?: number | null;
  age_max?: number | null;
  goals?: string[];
};

export type SuggestableActivity = {
  id: number;
  name: string;
  goals: string[];
  age_min: number | null;
  age_max: number | null;
};

export type Suggestion<A> = { activity: A; score: number; reasons: string[] };

/**
 * Activities that suit an audience and its goals, best first. An activity whose ages
 * don't fit is left out; then each shared goal counts, and a known age fit adds a little.
 * Ties keep the library's order. Plain rules, so a person can see why each one came up.
 */
export function suggestActivities<A extends SuggestableActivity>(
  activities: A[],
  target: SuggestTarget,
  { exclude = [] as number[], limit = 8 } = {}
): Suggestion<A>[] {
  const wanted = new Map((target.goals ?? []).map((g) => [g.toLowerCase(), g]));
  const agesKnown = target.age_min != null || target.age_max != null;
  const out: Suggestion<A>[] = [];

  for (const activity of activities) {
    if (exclude.includes(activity.id)) continue;
    if (!agesOverlap(activity.age_min, activity.age_max, target.age_min, target.age_max)) continue;

    const reasons: string[] = [];
    let score = 0;
    const shared = activity.goals.filter((g) => wanted.has(g.toLowerCase()));
    if (shared.length) {
      score += shared.length * 10;
      reasons.push(`Goal${shared.length > 1 ? 's' : ''}: ${shared.join(', ')}`);
    }
    const activityAges = formatAges(activity.age_min, activity.age_max);
    if (agesKnown && activityAges) {
      score += 3;
      reasons.push(`Ages ${activityAges} fit`);
    }
    if (score > 0) out.push({ activity, score, reasons });
  }

  return out
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s.score - a.s.score || a.i - b.i)
    .slice(0, limit)
    .map(({ s }) => s);
}

/** A date column as YYYY-MM-DD for forms and display. */
export function dateOnly(d: Date | null | undefined): string {
  return d ? d.toISOString().slice(0, 10) : '';
}

// ---------- Sessions ----------

const MAX_NAMES = 30;

/** Team members as typed names; same clean-up as goals, a little longer allowed. */
export function cleanNames(v: unknown): string[] {
  const raw = Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const name = item.trim().replace(/\s+/g, ' ');
    if (!name) continue;
    if (name.length > 80) throw new Error('each name must be 80 characters or fewer');
    if (seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    out.push(name);
  }
  if (out.length > MAX_NAMES) throw new Error(`no more than ${MAX_NAMES} people`);
  return out;
}

function time(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  if (typeof v !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) throw new Error('must be a time (HH:MM)');
  return v;
}

/** Only http(s) links, so a saved link can never run script when clicked. */
function url(v: unknown): string | null | undefined {
  const s = text(v, 2000);
  if (!s) return s;
  let parsed: URL;
  try {
    parsed = new URL(s);
  } catch {
    throw new Error('must be a full link starting with https://');
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('must be a full link starting with https://');
  return s;
}

export type SessionTask = { text: string; done: boolean };

function tasks(v: unknown): SessionTask[] | undefined {
  if (v === undefined) return undefined;
  if (v === null) return [];
  if (!Array.isArray(v)) throw new Error('must be a list');
  if (v.length > 50) throw new Error('no more than 50 tasks');
  const out: SessionTask[] = [];
  for (const item of v) {
    const t = item && typeof item === 'object' ? (item as Input) : {};
    const label = text(t.text, 300);
    if (!label) continue;
    out.push({ text: label, done: t.done === true });
  }
  return out;
}

export type SessionData = {
  run_id?: number;
  date?: Date;
  title?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  arrival_time?: string | null;
  location?: string | null;
  description?: string | null;
  creator_count?: number | null;
  audience_notes?: string | null;
  development_team?: string[];
  facilitation_team?: string[];
  equipment?: string | null;
  planning_doc_url?: string | null;
  slides_url?: string | null;
  shared_docs_url?: string | null;
  other_links?: string | null;
  tasks?: SessionTask[];
  notes?: string | null;
};

export function validateSession(input: unknown, { partial = false } = {}): Result<SessionData> {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Send the session as an object' };
  const b = input as Input;
  return collect<SessionData>(
    [
      // A session stays with the run it was made for.
      ['Run', () => (partial ? undefined : int(b.run_id, 1, 2 ** 31 - 1))],
      ['Date', () => date(b.date)],
      ['Session title', () => text(b.title, MAX_TEXT)],
      ['Program start time', () => time(b.start_time)],
      ['Program end time', () => time(b.end_time)],
      ['Team arrival time', () => time(b.arrival_time)],
      ['Location', () => text(b.location, MAX_TEXT)],
      ['Description', () => text(b.description, MAX_LONG_TEXT)],
      ['Creator count', () => int(b.creator_count, 0, 100_000)],
      ['Audience', () => text(b.audience_notes, 1000)],
      ['Development team', () => (b.development_team === undefined ? undefined : cleanNames(b.development_team))],
      ['Facilitation team', () => (b.facilitation_team === undefined ? undefined : cleanNames(b.facilitation_team))],
      ['Equipment and needs', () => text(b.equipment, MAX_LONG_TEXT)],
      ['Planning documents link', () => url(b.planning_doc_url)],
      ['Slides link', () => url(b.slides_url)],
      ['Creator shared documents link', () => url(b.shared_docs_url)],
      ['Other docs', () => text(b.other_links, MAX_LONG_TEXT)],
      ['Tasks', () => tasks(b.tasks)],
      ['Notes', () => text(b.notes, MAX_LONG_TEXT)],
    ],
    (v) => {
      if (!partial && !v.Run) return 'Run is required';
      if ((!partial || v.Date !== undefined) && !v.Date) return 'Date is required';
      if (v['Program start time'] && v['Program end time'] && v['Program start time'] >= v['Program end time']) {
        return 'Program end time must be after the start time';
      }
      return defined({
        run_id: v.Run ?? undefined,
        date: v.Date ?? undefined,
        title: v['Session title'],
        start_time: v['Program start time'],
        end_time: v['Program end time'],
        arrival_time: v['Team arrival time'],
        location: v.Location,
        description: v.Description,
        creator_count: v['Creator count'],
        audience_notes: v.Audience,
        development_team: v['Development team'],
        facilitation_team: v['Facilitation team'],
        equipment: v['Equipment and needs'],
        planning_doc_url: v['Planning documents link'],
        slides_url: v['Slides link'],
        shared_docs_url: v['Creator shared documents link'],
        other_links: v['Other docs'],
        tasks: v.Tasks,
        notes: v.Notes,
      });
    }
  );
}

/** "15:30" → "3:30 PM". */
export function formatTime(t: string | null | undefined): string | null {
  if (!t || !/^\d{2}:\d{2}$/.test(t)) return null;
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "3:30 PM – 5:00 PM", "from 3:30 PM", or null. */
export function formatTimeRange(start: string | null | undefined, end: string | null | undefined): string | null {
  const s = formatTime(start);
  const e = formatTime(end);
  if (s && e) return `${s} – ${e}`;
  if (s) return `from ${s}`;
  if (e) return `until ${e}`;
  return null;
}

/** "Sun, Feb 1, 2026" for a date column (stored as UTC midnight). */
export function formatDate(d: Date | null | undefined): string {
  return d
    ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
    : '';
}

/** Today as YYYY-MM-DD in the shop's local sense (the server's clock). */
export function todayDateOnly(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/** Planned and Active runs are current; Completed and Cancelled are past. */
export function isPastRun(status: string): boolean {
  return status === 'Completed' || status === 'Cancelled';
}

/** Lines of "other docs": a line that is a link becomes a link, anything else stays text. */
export function splitLinks(textBlock: string | null | undefined): { text: string; href: string | null }[] {
  return (textBlock ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/https?:\/\/\S+/);
      return { text: line, href: m ? m[0] : null };
    });
}

// ---------- Debriefs ----------

export const ENGAGEMENT_LABELS: Record<number, string> = {
  1: 'Very low',
  2: 'Low',
  3: 'Okay',
  4: 'Good',
  5: 'Excellent',
};

export type DebriefData = {
  attendance?: number | null;
  engagement?: number | null;
  went_well?: string | null;
  to_improve?: string | null;
  changes_next_time?: string | null;
  highlights?: string | null;
  follow_ups?: string | null;
};

/** The after-session debrief. Needs at least one answer so an empty form isn't saved as done. */
export function validateDebrief(input: unknown): Result<DebriefData> {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Send the debrief as an object' };
  const b = input as Input;
  return collect<DebriefData>(
    [
      ['Attendance', () => int(b.attendance, 0, 100_000)],
      ['Engagement', () => int(b.engagement, 1, 5)],
      ['What went well', () => text(b.went_well, MAX_LONG_TEXT)],
      ['What to improve', () => text(b.to_improve, MAX_LONG_TEXT)],
      ['Changes for next time', () => text(b.changes_next_time, MAX_LONG_TEXT)],
      ['Highlights', () => text(b.highlights, MAX_LONG_TEXT)],
      ['Follow-ups', () => text(b.follow_ups, MAX_LONG_TEXT)],
    ],
    (v) => {
      const data: DebriefData = {
        attendance: v.Attendance ?? null,
        engagement: v.Engagement ?? null,
        went_well: v['What went well'] ?? null,
        to_improve: v['What to improve'] ?? null,
        changes_next_time: v['Changes for next time'] ?? null,
        highlights: v.Highlights ?? null,
        follow_ups: v['Follow-ups'] ?? null,
      };
      if (Object.values(data).every((x) => x == null)) return 'Fill in at least one part of the debrief';
      return data;
    }
  );
}

export type DebriefStatus = 'done' | 'due' | 'upcoming';

/** A session on or before today without a debrief is due; later ones are upcoming. */
export function debriefStatus(sessionDate: Date, hasDebrief: boolean, today = todayDateOnly()): DebriefStatus {
  if (hasDebrief) return 'done';
  return dateOnly(sessionDate) <= today ? 'due' : 'upcoming';
}

/** A YYYY-MM-DD date moved by n days. */
export function addDaysDateOnly(ymd: string, n: number): string {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
