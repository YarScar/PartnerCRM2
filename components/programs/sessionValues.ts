import type { ProgramSession } from '@prisma/client';
import { dateOnly, type SessionTask } from '@/lib/programs';
import type { SessionFormValues } from './SessionForm';

/** Tasks as stored (JSON) back to a typed list; anything malformed is skipped. */
export function storedTasks(v: unknown): SessionTask[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((t): t is { text: string; done?: unknown } => Boolean(t) && typeof t.text === 'string')
    .map((t) => ({ text: t.text, done: t.done === true }));
}

/** A saved session as form values. */
export function sessionToForm(s: ProgramSession): SessionFormValues {
  return {
    id: s.id,
    run_id: s.run_id,
    date: dateOnly(s.date),
    title: s.title ?? '',
    start_time: s.start_time ?? '',
    end_time: s.end_time ?? '',
    arrival_time: s.arrival_time ?? '',
    location: s.location ?? '',
    description: s.description ?? '',
    creator_count: s.creator_count == null ? '' : String(s.creator_count),
    audience_notes: s.audience_notes ?? '',
    development_team: s.development_team,
    facilitation_team: s.facilitation_team,
    equipment: s.equipment ?? '',
    planning_doc_url: s.planning_doc_url ?? '',
    slides_url: s.slides_url ?? '',
    shared_docs_url: s.shared_docs_url ?? '',
    other_links: s.other_links ?? '',
    tasks: storedTasks(s.tasks),
    notes: s.notes ?? '',
  };
}

/**
 * A new session for a run. With a previous session, the things that usually repeat week
 * to week are copied (times, place, team, equipment, standing links, the task list
 * unticked) and the date moves on a week; the slides, notes and title start empty.
 */
export function newSessionForm(
  runId: number,
  defaults: { location?: string | null; audience?: string | null; date?: string },
  prev?: ProgramSession | null
): SessionFormValues {
  const blank: SessionFormValues = {
    run_id: runId,
    date: defaults.date ?? '',
    title: '',
    start_time: '',
    end_time: '',
    arrival_time: '',
    location: defaults.location ?? '',
    description: '',
    creator_count: '',
    audience_notes: defaults.audience ?? '',
    development_team: [],
    facilitation_team: [],
    equipment: '',
    planning_doc_url: '',
    slides_url: '',
    shared_docs_url: '',
    other_links: '',
    tasks: [],
    notes: '',
  };
  if (!prev) return blank;
  const from = sessionToForm(prev);
  const nextWeek = new Date(prev.date.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    ...from,
    id: undefined,
    run_id: runId,
    date: dateOnly(nextWeek),
    title: '',
    slides_url: '',
    notes: '',
    tasks: from.tasks.map((t) => ({ text: t.text, done: false })),
  };
}
