import { dateOnly, isPastRun, todayDateOnly } from './programs';
import type { RunListing } from './programsData';

/** Pure helpers that turn the run list into the Programs pages' groups and counts. */

export type PartnerKey = number | 'own';

export type PartnerGroup = {
  key: PartnerKey;
  name: string;
  current: RunListing[];
  past: RunListing[];
  debriefsDue: number;
  nextSession: Date | null;
};

/** Sessions on or before today with no debrief yet. */
export function debriefsDue(run: RunListing, today = todayDateOnly()): number {
  return run.sessions.filter((s) => !s.debrief && dateOnly(s.date) <= today).length;
}

/** The run's next session from today on, if any. */
export function nextSession(run: RunListing, today = todayDateOnly()): Date | null {
  return run.sessions.find((s) => dateOnly(s.date) >= today)?.date ?? null;
}

/** One group per partner (plus "Our own programs"), partners A–Z, our own last. */
export function groupRunsByPartner(runs: RunListing[], today = todayDateOnly()): PartnerGroup[] {
  const groups = new Map<PartnerKey, PartnerGroup>();
  for (const run of runs) {
    const key: PartnerKey = run.partner?.id ?? 'own';
    if (!groups.has(key)) {
      groups.set(key, { key, name: run.partner?.org_name ?? 'Our own programs', current: [], past: [], debriefsDue: 0, nextSession: null });
    }
    const g = groups.get(key)!;
    (isPastRun(run.status) ? g.past : g.current).push(run);
    if (!isPastRun(run.status)) {
      g.debriefsDue += debriefsDue(run, today);
      const next = nextSession(run, today);
      if (next && (!g.nextSession || next < g.nextSession)) g.nextSession = next;
    }
  }
  return [...groups.values()].sort((a, b) => {
    if (a.key === 'own') return 1;
    if (b.key === 'own') return -1;
    return a.name.localeCompare(b.name);
  });
}
