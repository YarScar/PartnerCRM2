import Link from 'next/link';
import { Plus } from 'lucide-react';
import { isPastRun } from '@/lib/programs';
import type { RunListing } from '@/lib/programsData';
import { RunRow } from './RunRow';
import { EmptyState } from './bits';

/** On a partner's page: their current programs, then past ones. */
export function PartnerRuns({ partnerId, runs }: { partnerId: number; runs: RunListing[] }) {
  const current = runs.filter((r) => !isPastRun(r.status));
  const past = runs.filter((r) => isPastRun(r.status));
  return (
    <section className="card space-y-4 mt-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold">Programs with this partner</h2>
          <p className="text-sm text-ink/60">Each run of a program with them, and its sessions.</p>
        </div>
        <Link href={`/runs/new?partner=${partnerId}`} className="btn-secondary">
          <Plus size={14} /> New run
        </Link>
      </div>
      {runs.length === 0 ? (
        <EmptyState>No programs with this partner yet.</EmptyState>
      ) : (
        <div className="space-y-4">
          {[
            ['Current', current],
            ['Past', past],
          ].map(([label, list]) =>
            (list as RunListing[]).length === 0 ? null : (
              <div key={label as string}>
                <div className="label-base">{label as string}</div>
                <div className="divide-y divide-ink/10 border border-ink/10 rounded-xl overflow-hidden">
                  {(list as RunListing[]).map((r) => (
                    <RunRow key={r.id} run={r} />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}
