import Link from 'next/link';
import { ArrowUpRight, Plus } from 'lucide-react';
import { isPastRun } from '@/lib/programs';
import { listPrograms, listRuns, type RunListing } from '@/lib/programsData';
import { RunRow } from '@/components/programs/RunRow';
import { Ages, EmptyState, Goals, PageHeading } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

const VIEWS = [
  { id: 'current', label: 'Current' },
  { id: 'past', label: 'Past' },
  { id: 'programs', label: 'All programs' },
] as const;
type View = (typeof VIEWS)[number]['id'];

/** Runs grouped under their collaborator, like the team's folders: Launchpad → 3D Geospatial Club → 2026–2027. */
function groupByPartner(runs: RunListing[]) {
  const groups = new Map<string, { partner: RunListing['partner']; runs: RunListing[] }>();
  for (const run of runs) {
    const key = run.partner ? `p${run.partner.id}` : 'own';
    if (!groups.has(key)) groups.set(key, { partner: run.partner, runs: [] });
    groups.get(key)!.runs.push(run);
  }
  return [...groups.values()].sort((a, b) => {
    if (!a.partner) return 1;
    if (!b.partner) return -1;
    return a.partner.org_name.localeCompare(b.partner.org_name);
  });
}

export default async function ProgramsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view: rawView } = await searchParams;
  const view: View = VIEWS.some((v) => v.id === rawView) ? (rawView as View) : 'current';
  const [runs, programs] = await Promise.all([listRuns(), view === 'programs' ? listPrograms() : Promise.resolve([])]);
  const current = runs.filter((r) => !isPastRun(r.status));
  const past = runs.filter((r) => isPastRun(r.status));
  const shown = view === 'past' ? past : current;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <PageHeading kicker="Programs" title="Programs">
        <Link href="/activities" className="btn-secondary">Activity library</Link>
        <Link href="/runs/new" className="btn-secondary">
          <Plus size={16} /> New run
        </Link>
        <Link href="/programs/new" className="btn-primary">
          <Plus size={16} /> New program
        </Link>
      </PageHeading>
      <p className="text-ink/60 mb-6 max-w-2xl">
        Grouped by collaborator. A <strong>program</strong> is what we offer (3D Design Club); a <strong>run</strong> is
        one stretch of it with a partner (2026–2027), holding its dated <strong>sessions</strong>. Mark a run Completed
        and it moves to Past.
      </p>

      <nav className="flex gap-1 mb-6" aria-label="Programs view">
        {VIEWS.map((v) => {
          const count = v.id === 'current' ? current.length : v.id === 'past' ? past.length : null;
          return (
            <Link
              key={v.id}
              href={v.id === 'current' ? '/programs' : `/programs?view=${v.id}`}
              className={`px-4 py-2 rounded-full text-sm font-medium ${view === v.id ? 'bg-ink text-cream' : 'text-ink/70 hover:bg-ink/5'}`}
            >
              {v.label}
              {count != null && <span className="ml-1.5 opacity-60">{count}</span>}
            </Link>
          );
        })}
      </nav>

      {view === 'programs' ? (
        programs.length === 0 ? (
          <div className="card">
            <EmptyState>No programs yet. Create one to start planning runs.</EmptyState>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map((p) => (
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
                  <span>{p._count.runs} run{p._count.runs === 1 ? '' : 's'}</span>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : shown.length === 0 ? (
        <div className="card">
          <EmptyState>
            {view === 'past' ? 'No past runs yet.' : 'Nothing running. Start a run of a program to plan its sessions.'}
          </EmptyState>
        </div>
      ) : (
        <div className="space-y-6">
          {groupByPartner(shown).map((g) => (
            <section key={g.partner?.id ?? 'own'} className="card !p-0 overflow-hidden">
              <div className="px-5 py-3 bg-ink/5 flex items-center justify-between">
                {g.partner ? (
                  <Link href={`/partners/${g.partner.id}`} className="font-display text-lg font-bold hover:text-court">
                    {g.partner.org_name}
                  </Link>
                ) : (
                  <span className="font-display text-lg font-bold">Our own programs</span>
                )}
                <span className="text-xs text-ink/50">{g.runs.length} run{g.runs.length === 1 ? '' : 's'}</span>
              </div>
              <div className="divide-y divide-ink/10">
                {g.runs.map((r) => (
                  <RunRow key={r.id} run={r} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
