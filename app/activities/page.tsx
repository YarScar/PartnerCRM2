import Link from 'next/link';
import { ChevronRight, GitBranch, Plus, Search } from 'lucide-react';
import { formatAges } from '@/lib/programs';
import { activityVocabulary, listActivities } from '@/lib/programsData';
import { EmptyState, PageHeading } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

type Filters = { q?: string; age?: string; goal?: string; category?: string };

/** A link to this list with one filter changed (and the others kept). */
function withFilter(f: Filters, key: keyof Filters, value: string | undefined) {
  const params = new URLSearchParams(Object.entries({ ...f, [key]: value }).filter(([, v]) => v) as [string, string][]);
  const qs = params.toString();
  return qs ? `/activities?${qs}` : '/activities';
}

/**
 * The activity library as a scannable list: type is one click (chips), search, age and
 * goal sit in one row, and each activity is a single line with what matters for choosing.
 */
export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const f = await searchParams;
  const age = f.age && /^\d{1,3}$/.test(f.age) ? Number(f.age) : undefined;
  const [activities, vocab] = await Promise.all([
    listActivities({ q: f.q?.trim() || undefined, age, goal: f.goal || undefined, category: f.category || undefined }),
    activityVocabulary(),
  ]);
  const filtering = Boolean(f.q || age != null || f.goal || f.category);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <PageHeading kicker="Activities" title="Activity library">
        <Link href="/activities/new" className="btn-primary">
          <Plus size={16} /> New activity
        </Link>
      </PageHeading>

      <form className="flex flex-wrap items-end gap-2 mb-3" method="get">
        {f.category && <input type="hidden" name="category" value={f.category} />}
        <div className="relative flex-1 min-w-[12rem]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input name="q" className="input-base !pl-9" defaultValue={f.q} placeholder="Search activities" aria-label="Search activities" />
        </div>
        <input name="age" type="number" min={0} max={120} className="input-base !w-28" defaultValue={f.age} placeholder="Age" aria-label="For age" />
        <select name="goal" className="input-base !w-44" defaultValue={f.goal ?? ''} aria-label="Goal">
          <option value="">Any goal</option>
          {vocab.goals.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
        <button className="btn-secondary">Find</button>
        {filtering && <Link href="/activities" className="btn-ghost">Clear</Link>}
      </form>

      {vocab.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6" aria-label="Filter by type">
          <Link
            href={withFilter(f, 'category', undefined)}
            className={`text-xs px-3 py-1.5 rounded-full border ${!f.category ? 'bg-ink text-cream border-ink' : 'border-ink/15 hover:border-ink'}`}
          >
            All types
          </Link>
          {vocab.categories.map((c) => (
            <Link
              key={c}
              href={withFilter(f, 'category', c)}
              className={`text-xs px-3 py-1.5 rounded-full border ${f.category?.toLowerCase() === c.toLowerCase() ? 'bg-ink text-cream border-ink' : 'border-ink/15 hover:border-ink'}`}
            >
              {c}
            </Link>
          ))}
        </div>
      )}

      {activities.length === 0 ? (
        <div className="card">
          <EmptyState>{filtering ? 'No activities match these filters.' : 'No activities yet. Add the ones you run most.'}</EmptyState>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden divide-y divide-ink/10">
          {activities.map((a) => {
            const ages = formatAges(a.age_min, a.age_max);
            return (
              <Link key={a.id} href={`/activities/${a.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-court/5 group">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold group-hover:text-court">
                    {a.name}
                    {a.based_on && (
                      <span className="ml-2 text-xs font-normal text-ink/50 inline-flex items-center gap-1">
                        <GitBranch size={11} /> twist
                      </span>
                    )}
                  </div>
                  {a.summary && <div className="text-sm text-ink/60 truncate">{a.summary}</div>}
                </div>
                <div className="hidden sm:flex items-center gap-3 text-xs text-ink/50 shrink-0">
                  {a.category && <span className="px-2 py-0.5 rounded-full bg-ink/5">{a.category}</span>}
                  <span className="w-16 text-right">{ages ? `Ages ${ages}` : 'Any age'}</span>
                  <span className="w-12 text-right">{a.duration_minutes ? `${a.duration_minutes} min` : ''}</span>
                </div>
                <ChevronRight size={16} className="text-ink/30 group-hover:text-court shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
