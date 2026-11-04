import Link from 'next/link';
import { ArrowUpRight, Plus } from 'lucide-react';
import { listPrograms } from '@/lib/programsData';
import { dateOnly } from '@/lib/programs';
import { Ages, EmptyState, Goals, PageHeading } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

export default async function ProgramsPage() {
  const programs = await listPrograms();

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <PageHeading kicker="Programs" title="Programs">
        <Link href="/activities" className="btn-secondary">Activity library</Link>
        <Link href="/programs/new" className="btn-primary">
          <Plus size={16} /> New program
        </Link>
      </PageHeading>
      <p className="text-ink/60 mb-8 max-w-2xl">
        A program is something we offer again and again. Each time it happens is a <strong>run</strong>, usually with a
        partner. A run starts from the program&apos;s usual activities and records what was different.
      </p>

      {programs.length === 0 ? (
        <div className="card">
          <EmptyState>No programs yet. Create one to start planning runs.</EmptyState>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((p) => {
            const latest = p.runs[0];
            return (
              <Link key={p.id} href={`/programs/${p.id}`} className="card hover:border-court/40 transition-colors group space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-xl font-bold group-hover:text-court transition-colors">{p.name}</h2>
                  <ArrowUpRight size={16} className="text-ink/30 group-hover:text-court shrink-0" />
                </div>
                {p.description && <p className="text-sm text-ink/60 line-clamp-2">{p.description}</p>}
                <Goals goals={p.goals} />
                <div className="text-xs text-ink/50 flex flex-wrap gap-x-3 gap-y-1">
                  <Ages min={p.age_min} max={p.age_max} />
                  <span>{p._count.activities} usual activities</span>
                  <span>
                    {p._count.runs} run{p._count.runs === 1 ? '' : 's'}
                    {latest?.start_date ? `, latest ${dateOnly(latest.start_date)}` : ''}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
