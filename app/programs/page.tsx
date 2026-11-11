import Link from 'next/link';
import { ArrowUpRight, ChevronRight, Plus } from 'lucide-react';
import { addDaysDateOnly, dateOnly, isPastRun, todayDateOnly } from '@/lib/programs';
import { groupRunsByPartner } from '@/lib/programGroups';
import { listPrograms, listRuns, type RunListing } from '@/lib/programsData';
import { SessionList, type SessionListItem } from '@/components/programs/SessionList';
import { Ages, EmptyState, Goals, PageHeading, partnerProgramsHref } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

const UPCOMING_DAYS = 14;

/** Sessions of current programs, tagged with where they belong, for the cross-partner lists. */
function currentSessions(runs: RunListing[]): SessionListItem[] {
  return runs
    .filter((r) => !isPastRun(r.status))
    .flatMap((r) =>
      r.sessions.map((s) => ({ ...s, context: `${r.partner?.org_name ?? 'Our own'} · ${r.program.name}` }))
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * The Programs home answers "what do I need to do?" first (debriefs due, sessions coming
 * up, both one click from the session), then lists partners. The program library is a tab.
 */
export default async function ProgramsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  const library = view === 'library';
  const [runs, programs] = await Promise.all([listRuns(), library ? listPrograms() : Promise.resolve([])]);
  const groups = groupRunsByPartner(runs);
  const today = todayDateOnly();
  const horizon = addDaysDateOnly(today, UPCOMING_DAYS);
  const sessions = currentSessions(runs);
  const due = sessions.filter((s) => !s.debrief && dateOnly(s.date) <= today).reverse();
  const upcoming = sessions.filter((s) => dateOnly(s.date) > today && dateOnly(s.date) <= horizon);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <PageHeading kicker="Programs" title="Programs">
        <Link href="/runs/new" className="btn-primary">
          <Plus size={16} /> Add program
        </Link>
      </PageHeading>

      <nav className="flex gap-1 mb-8" aria-label="Programs view">
        {[
          { href: '/programs', label: 'By partner', active: !library },
          { href: '/programs?view=library', label: 'Program library', active: library },
        ].map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={t.active ? 'page' : undefined}
            className={`px-4 py-2 rounded-full text-sm font-medium ${t.active ? 'bg-ink text-cream' : 'text-ink/70 hover:bg-ink/5'}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {library ? (
        <>
          {programs.length === 0 ? (
            <div className="card">
              <EmptyState>No programs yet. Add one with a partner, or create it here.</EmptyState>
            </div>
          ) : (
            <div className="card !p-0 overflow-hidden divide-y divide-ink/10">
              {programs.map((p) => (
                <Link key={p.id} href={`/programs/${p.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-court/5 group">
                  <div className="min-w-0 space-y-1">
                    <div className="font-semibold group-hover:text-court">{p.name}</div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/50">
                      <Ages min={p.age_min} max={p.age_max} />
                      <span>Run {p._count.runs} time{p._count.runs === 1 ? '' : 's'}</span>
                      <Goals goals={p.goals.slice(0, 3)} />
                    </div>
                  </div>
                  <ArrowUpRight size={16} className="text-ink/30 group-hover:text-court shrink-0" />
                </Link>
              ))}
            </div>
          )}
          <div className="mt-4">
            <Link href="/programs/new" className="btn-ghost">
              <Plus size={14} /> New program in the library
            </Link>
          </div>
        </>
      ) : (
        <div className="space-y-8">
          {due.length > 0 && (
            <section className="card !p-0 overflow-hidden border-court/30">
              <h2 className="px-5 pt-4 pb-2 font-display text-lg font-bold">
                Debriefs due <span className="text-court">{due.length}</span>
              </h2>
              <SessionList sessions={due} />
            </section>
          )}

          <section className="card !p-0 overflow-hidden">
            <h2 className="px-5 pt-4 pb-2 font-display text-lg font-bold">Coming up <span className="text-sm font-normal text-ink/50">next {UPCOMING_DAYS} days</span></h2>
            <SessionList sessions={upcoming} empty="No sessions in the next two weeks." />
          </section>

          <section>
            <h2 className="font-display text-lg font-bold mb-3">Partners</h2>
            {groups.length === 0 ? (
              <div className="card">
                <EmptyState>No programs yet. Use Add program to start one with a partner.</EmptyState>
              </div>
            ) : (
              <div className="card !p-0 overflow-hidden divide-y divide-ink/10">
                {groups.map((g) => (
                  <Link
                    key={g.key}
                    href={partnerProgramsHref(g.key === 'own' ? null : g.key)}
                    className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-court/5 group"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold group-hover:text-court">{g.name}</div>
                      <div className="text-xs text-ink/50 truncate">
                        {g.current.length > 0
                          ? g.current.map((r) => `${r.program.name} ${r.name}`).join(' · ')
                          : 'Nothing running now'}
                        {g.past.length > 0 && ` · ${g.past.length} past`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {g.debriefsDue > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-court/10 text-court">{g.debriefsDue} due</span>
                      )}
                      <ChevronRight size={16} className="text-ink/30 group-hover:text-court" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
