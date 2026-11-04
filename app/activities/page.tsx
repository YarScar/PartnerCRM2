import Link from 'next/link';
import { GitBranch, Plus, Search } from 'lucide-react';
import { activityVocabulary, listActivities } from '@/lib/programsData';
import { Ages, EmptyState, Goals, PageHeading } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

type Filters = { q?: string; age?: string; goal?: string; category?: string };

export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const f = await searchParams;
  const age = f.age && /^\d{1,3}$/.test(f.age) ? Number(f.age) : undefined;
  const [activities, vocab] = await Promise.all([
    listActivities({ q: f.q?.trim() || undefined, age, goal: f.goal || undefined, category: f.category || undefined }),
    activityVocabulary(),
  ]);
  const filtering = Boolean(f.q || age != null || f.goal || f.category);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <PageHeading kicker="Activities" title="Activity library">
        <Link href="/programs" className="btn-secondary">Programs</Link>
        <Link href="/activities/new" className="btn-primary">
          <Plus size={16} /> New activity
        </Link>
      </PageHeading>
      <p className="text-ink/60 mb-6 max-w-2xl">
        Everything we run, in one place. Filter by who it&apos;s for and what it&apos;s for. To change one for a new group
        without losing the original, open it and choose <strong>Make a twist</strong>.
      </p>

      <form className="card !p-4 mb-6 grid gap-3 md:grid-cols-[2fr_1fr_1.5fr_1.5fr_auto] items-end" method="get">
        <div>
          <label className="label-base" htmlFor="q">Search</label>
          <input id="q" name="q" className="input-base" defaultValue={f.q} placeholder="Name or summary" />
        </div>
        <div>
          <label className="label-base" htmlFor="age">For age</label>
          <input id="age" name="age" type="number" min={0} max={120} className="input-base" defaultValue={f.age} />
        </div>
        <div>
          <label className="label-base" htmlFor="goal">Goal</label>
          <select id="goal" name="goal" className="input-base" defaultValue={f.goal ?? ''}>
            <option value="">Any goal</option>
            {vocab.goals.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-base" htmlFor="category">Type</label>
          <select id="category" name="category" className="input-base" defaultValue={f.category ?? ''}>
            <option value="">Any type</option>
            {vocab.categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary">
            <Search size={14} /> Find
          </button>
          {filtering && <Link href="/activities" className="btn-ghost">Clear</Link>}
        </div>
      </form>

      {activities.length === 0 ? (
        <div className="card">
          <EmptyState>{filtering ? 'No activities match these filters.' : 'No activities yet. Add the ones you run most.'}</EmptyState>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map((a) => (
            <Link key={a.id} href={`/activities/${a.id}`} className="card hover:border-court/40 transition-colors group space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-ink/50">{a.category || 'Activity'}</div>
              <h2 className="font-display text-lg font-bold group-hover:text-court transition-colors">{a.name}</h2>
              {a.based_on && (
                <div className="text-xs text-ink/50 flex items-center gap-1">
                  <GitBranch size={12} /> Twist of {a.based_on.name}
                </div>
              )}
              {a.summary && <p className="text-sm text-ink/60 line-clamp-2">{a.summary}</p>}
              <Goals goals={a.goals} />
              <div className="text-xs text-ink/50 flex flex-wrap gap-x-3">
                <Ages min={a.age_min} max={a.age_max} />
                {a.duration_minutes && <span>{a.duration_minutes} min</span>}
                <span>Used in {a._count.runs} run{a._count.runs === 1 ? '' : 's'}</span>
                {a._count.variants > 0 && <span>{a._count.variants} twist{a._count.variants === 1 ? '' : 's'}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
