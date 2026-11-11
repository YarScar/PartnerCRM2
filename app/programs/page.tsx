import Link from 'next/link';
import { ArrowUpRight, Building2, ClipboardCheck, Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/programs';
import { groupRunsByPartner } from '@/lib/programGroups';
import { listPrograms, listRuns } from '@/lib/programsData';
import { Ages, EmptyState, Goals, PageHeading, partnerProgramsHref } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

/**
 * Programs, by partner: one card per partner we run programs with. A card opens that
 * partner's programs (current ones, then the past-programs archive). The "Program
 * library" tab lists the reusable programs themselves.
 */
export default async function ProgramsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const library = view === 'library';
  const [runs, programs, partners] = await Promise.all([
    listRuns(),
    library ? listPrograms() : Promise.resolve([]),
    prisma.partner.findMany({ orderBy: { org_name: 'asc' }, select: { id: true, org_name: true } }),
  ]);
  const groups = groupRunsByPartner(runs);
  const withPrograms = new Set(groups.map((g) => g.key));
  const others = partners.filter((p) => !withPrograms.has(p.id));
  const totalDue = groups.reduce((n, g) => n + g.debriefsDue, 0);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <PageHeading kicker="Programs" title="Programs">
        <Link href="/activities" className="btn-secondary">Activity library</Link>
        <Link href="/runs/new" className="btn-primary">
          <Plus size={16} /> Add program
        </Link>
      </PageHeading>

      <nav className="flex gap-1 mb-6" aria-label="Programs view">
        {[
          { href: '/programs', label: 'By partner', active: !library },
          { href: '/programs?view=library', label: 'Program library', active: library },
        ].map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`px-4 py-2 rounded-full text-sm font-medium ${t.active ? 'bg-ink text-cream' : 'text-ink/70 hover:bg-ink/5'}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {library ? (
        <>
          <p className="text-ink/60 mb-6 max-w-2xl">
            The programs we offer. Each one can run many times, with different partners; its usual activities are where
            every new session starts.
          </p>
          {programs.length === 0 ? (
            <div className="card">
              <EmptyState>No programs yet. Add one with a partner, or create it here.</EmptyState>
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
                    <span>Run {p._count.runs} time{p._count.runs === 1 ? '' : 's'}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-6">
            <Link href="/programs/new" className="btn-secondary">
              <Plus size={14} /> New program in the library
            </Link>
          </div>
        </>
      ) : (
        <>
          {totalDue > 0 && (
            <div className="mb-6 flex items-center gap-2 text-sm bg-court/5 border border-court/20 rounded-xl px-4 py-3">
              <ClipboardCheck size={16} className="text-court" />
              {totalDue} session debrief{totalDue === 1 ? ' is' : 's are'} due. Open a partner to see which.
            </div>
          )}

          {groups.length === 0 ? (
            <div className="card">
              <EmptyState>No programs yet. Choose a partner below to add the first one.</EmptyState>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((g) => (
                <Link key={g.key} href={partnerProgramsHref(g.key === 'own' ? null : g.key)} className="card hover:border-court/40 transition-colors group space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Building2 size={18} className="text-ink/40" />
                      <h2 className="font-display text-xl font-bold group-hover:text-court transition-colors">{g.name}</h2>
                    </div>
                    <ArrowUpRight size={16} className="text-ink/30 group-hover:text-court shrink-0" />
                  </div>
                  <div className="text-sm">
                    {g.current.length > 0 ? (
                      <ul className="space-y-0.5">
                        {g.current.slice(0, 4).map((r) => (
                          <li key={r.id} className="truncate">
                            {r.program.name} <span className="text-ink/50">· {r.name}</span>
                          </li>
                        ))}
                        {g.current.length > 4 && <li className="text-ink/50">+{g.current.length - 4} more</li>}
                      </ul>
                    ) : (
                      <span className="text-ink/50">Nothing running now</span>
                    )}
                  </div>
                  <div className="text-xs text-ink/50 flex flex-wrap gap-x-3 gap-y-1">
                    <span>{g.current.length} current</span>
                    <span>{g.past.length} past</span>
                    {g.nextSession && <span>Next session {formatDate(g.nextSession)}</span>}
                  </div>
                  {g.debriefsDue > 0 && (
                    <span className="inline-block text-[11px] px-2 py-0.5 rounded-full font-semibold bg-court/10 text-court">
                      {g.debriefsDue} debrief{g.debriefsDue === 1 ? '' : 's'} due
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}

          {others.length > 0 && (
            <form action="/runs/new" method="get" className="card !p-4 mt-6 flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[14rem]">
                <label className="label-base" htmlFor="partner">Start a program with another partner</label>
                <select id="partner" name="partner" className="input-base" required defaultValue="">
                  <option value="" disabled>Choose a partner</option>
                  {others.map((p) => (
                    <option key={p.id} value={p.id}>{p.org_name}</option>
                  ))}
                </select>
              </div>
              <button className="btn-primary">
                <Plus size={14} /> Add program
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
