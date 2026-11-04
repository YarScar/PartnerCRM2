import Link from 'next/link';
import { Plus } from 'lucide-react';
import { dateOnly } from '@/lib/programs';
import { EmptyState, RunStatusBadge } from './bits';

type Run = {
  id: number;
  name: string;
  status: string;
  start_date: Date | null;
  program: { id: number; name: string };
};

/** On a partner's page: every program run with this partner. */
export function PartnerRuns({ partnerId, runs }: { partnerId: number; runs: Run[] }) {
  return (
    <section className="card space-y-4 mt-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold">Programs with this partner</h2>
          <p className="text-sm text-ink/60">Each run of a program we did, or plan to do, with them.</p>
        </div>
        <Link href={`/runs/new?partner=${partnerId}`} className="btn-secondary">
          <Plus size={14} /> New run
        </Link>
      </div>
      {runs.length === 0 ? (
        <EmptyState>No programs with this partner yet.</EmptyState>
      ) : (
        <div className="divide-y divide-ink/10">
          {runs.map((r) => (
            <Link key={r.id} href={`/runs/${r.id}`} className="flex items-center justify-between gap-4 py-3 hover:text-court">
              <div>
                <div className="font-semibold">{r.program.name}</div>
                <div className="text-xs text-ink/50">{[r.name, dateOnly(r.start_date)].filter(Boolean).join(' · ')}</div>
              </div>
              <RunStatusBadge status={r.status} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
