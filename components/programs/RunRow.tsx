import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { dateOnly, formatDate, isPastRun, todayDateOnly } from '@/lib/programs';
import { debriefsDue } from '@/lib/programGroups';
import type { RunListing } from '@/lib/programsData';
import { RunStatusBadge } from './bits';

/** "6 sessions · next Wed, Nov 18, 2026" or "· last …". */
function sessionSummary(sessions: RunListing['sessions']) {
  if (sessions.length === 0) return 'No sessions yet';
  const today = todayDateOnly();
  const next = sessions.find((s) => dateOnly(s.date) >= today);
  const last = sessions[sessions.length - 1];
  const count = `${sessions.length} session${sessions.length === 1 ? '' : 's'}`;
  return next ? `${count} · next ${formatDate(next.date)}` : `${count} · last ${formatDate(last.date)}`;
}

/**
 * One program with a partner: by default the program's name and its term; on a program's
 * own page (`byPartner`) the partner's name instead, since the program is already known.
 */
export function RunRow({ run, byPartner = false }: { run: RunListing; byPartner?: boolean }) {
  // Past programs are archived for the record, so they don't nag for debriefs.
  const due = isPastRun(run.status) ? 0 : debriefsDue(run);
  return (
    <Link href={`/runs/${run.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-court/5 transition-colors group">
      <div className="min-w-0">
        <div className="font-semibold group-hover:text-court transition-colors">
          {byPartner ? run.partner?.org_name ?? 'Our own' : run.program.name} <span className="font-normal text-ink/60">· {run.name}</span>
        </div>
        <div className="text-xs text-ink/50">{sessionSummary(run.sessions)}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {due > 0 && (
          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-court/10 text-court">
            {due} debrief{due === 1 ? '' : 's'} due
          </span>
        )}
        {/* Only the statuses that tell you something the list's heading doesn't. */}
        {(run.status === 'Planned' || run.status === 'Cancelled') && <RunStatusBadge status={run.status} />}
        <ArrowUpRight size={16} className="text-ink/30 group-hover:text-court" />
      </div>
    </Link>
  );
}
