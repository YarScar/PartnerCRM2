import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { debriefStatus, formatTimeRange } from '@/lib/programs';

export type SessionListItem = {
  id: number;
  date: Date;
  title: string | null;
  start_time?: string | null;
  end_time?: string | null;
  debrief: object | null;
  /** Shown before the title, e.g. the program name on a list that mixes programs. */
  context?: string;
};

const shortDate = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });

/** The one status a session row needs: due, done or upcoming. */
export function DebriefChip({ date, done }: { date: Date; done: boolean }) {
  const status = debriefStatus(date, done);
  if (status === 'due') return <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-court text-cream whitespace-nowrap">Debrief due</span>;
  if (status === 'done') return <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 whitespace-nowrap">Debriefed</span>;
  return <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-ink/5 text-ink/60 whitespace-nowrap">Upcoming</span>;
}

/**
 * Sessions as one-line rows: date, title, time, status. A whole row is the link, and a
 * session whose debrief is due opens straight on its debrief.
 */
export function SessionList({ sessions, empty = 'No sessions yet.' }: { sessions: SessionListItem[]; empty?: string }) {
  if (sessions.length === 0) return <div className="text-sm text-ink/50 px-5 py-3">{empty}</div>;
  return (
    <ul className="divide-y divide-ink/10">
      {sessions.map((s) => {
        const due = debriefStatus(s.date, Boolean(s.debrief)) === 'due';
        const time = formatTimeRange(s.start_time, s.end_time);
        return (
          <li key={s.id}>
            <Link
              href={`/sessions/${s.id}${due ? '?tab=debrief' : ''}`}
              className="grid grid-cols-[6.5rem_1fr_auto_auto] items-center gap-3 px-5 py-2.5 hover:bg-court/5 transition-colors group"
            >
              <span className="text-sm font-medium tabular-nums">{shortDate(s.date)}</span>
              <span className="text-sm truncate min-w-0">
                {s.context && <span className="text-ink/50">{s.context} · </span>}
                {s.title || <span className="text-ink/40">Session</span>}
                {time && <span className="hidden md:inline text-xs text-ink/40"> · {time}</span>}
              </span>
              <DebriefChip date={s.date} done={Boolean(s.debrief)} />
              <ChevronRight size={14} className="text-ink/30 group-hover:text-court" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
