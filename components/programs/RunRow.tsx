import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { dateOnly, formatDate, todayDateOnly } from '@/lib/programs';
import { RunStatusBadge } from './bits';

type Run = {
  id: number;
  name: string;
  status: string;
  program: { id: number; name: string };
  sessions: { date: Date }[];
};

/** "3 sessions · next Feb 1, 2026" or "· last Jan 18, 2026". */
function sessionSummary(sessions: { date: Date }[]) {
  if (sessions.length === 0) return 'No sessions yet';
  const today = todayDateOnly();
  const next = sessions.find((s) => dateOnly(s.date) >= today);
  const last = sessions[sessions.length - 1];
  const count = `${sessions.length} session${sessions.length === 1 ? '' : 's'}`;
  return next ? `${count} · next ${formatDate(next.date)}` : `${count} · last ${formatDate(last.date)}`;
}

/** One run in a list: program name first, then the run's name and its sessions. */
export function RunRow({ run }: { run: Run }) {
  return (
    <Link href={`/runs/${run.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-court/5 transition-colors group">
      <div className="min-w-0">
        <div className="font-semibold group-hover:text-court transition-colors">
          {run.program.name} <span className="font-normal text-ink/60">· {run.name}</span>
        </div>
        <div className="text-xs text-ink/50">{sessionSummary(run.sessions)}</div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <RunStatusBadge status={run.status} />
        <ArrowUpRight size={16} className="text-ink/30 group-hover:text-court" />
      </div>
    </Link>
  );
}
