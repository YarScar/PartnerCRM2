import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Edit2, GitBranch } from 'lucide-react';
import { isAdmin } from '@/lib/auth';
import { pageUser } from '@/lib/pageUser';
import { parseId } from '@/lib/parseId';
import { formatAges } from '@/lib/programs';
import { getActivity } from '@/lib/programsData';
import { DeleteButton } from '@/components/programs/DeleteButton';
import { Breadcrumbs, Goals, PageHeading, Panel } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

const RECENT_USES = 5;
const shortDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** One activity: how to run it first, then its twists and where it has been used. */
export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  const activity = id ? await getActivity(id) : null;
  if (!activity) notFound();
  const user = await pageUser();
  const ages = formatAges(activity.age_min, activity.age_max);
  const recent = activity.sessions.slice(0, RECENT_USES);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Activities', href: '/activities' }, { label: activity.name }]} />
        <PageHeading
          title={activity.name}
          meta={
            <>
              {activity.category && <span className="px-2 py-0.5 rounded-full bg-ink/5 text-xs">{activity.category}</span>}
              <span>{ages ? `Ages ${ages}` : 'Any age'}</span>
              {activity.duration_minutes && <span>· {activity.duration_minutes} min</span>}
              {activity.group_size && <span>· {activity.group_size}</span>}
              {activity.based_on && (
                <span className="inline-flex items-center gap-1">
                  · <GitBranch size={13} /> Twist of{' '}
                  <Link href={`/activities/${activity.based_on.id}`} className="underline hover:text-court">{activity.based_on.name}</Link>
                </span>
              )}
            </>
          }
        >
          <Link href={`/activities/${activity.id}/edit`} className="btn-secondary">
            <Edit2 size={14} /> Edit
          </Link>
          <Link href={`/activities/new?based_on=${activity.id}`} className="btn-ghost" title="Copy it into a new activity you can change, keeping this one as it is">
            <GitBranch size={14} /> Make a twist
          </Link>
        </PageHeading>
      </div>

      <section className="card space-y-5">
        {activity.summary && <p className="text-base">{activity.summary}</p>}
        <Goals goals={activity.goals} />
        {activity.materials && (
          <div>
            <div className="label-base">Materials</div>
            <p className="text-sm whitespace-pre-wrap">{activity.materials}</p>
          </div>
        )}
        {activity.instructions && (
          <div>
            <div className="label-base">How to run it</div>
            <p className="text-sm whitespace-pre-wrap">{activity.instructions}</p>
          </div>
        )}
        {!activity.summary && !activity.materials && !activity.instructions && (
          <p className="text-sm text-ink/50">
            No details yet. <Link href={`/activities/${activity.id}/edit`} className="underline">Add how to run it</Link>
          </p>
        )}
      </section>

      {activity.variants.length > 0 && (
        <Panel title="Twists" count={activity.variants.length} flush>
          <ul className="divide-y divide-ink/10 border-t border-ink/10">
            {activity.variants.map((v) => (
              <li key={v.id}>
                <Link href={`/activities/${v.id}`} className="block px-5 py-2.5 hover:bg-court/5">
                  <span className="text-sm font-medium">{v.name}</span>
                  {v.summary && <span className="block text-xs text-ink/50 truncate">{v.summary}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="Used in" count={activity.sessions.length} flush>
        {activity.programs.length > 0 && (
          <div className="px-5 pb-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-ink/50">Usual plan of</span>
            {activity.programs.map((pa) => (
              <Link key={pa.id} href={`/programs/${pa.program.id}`} className="px-2 py-0.5 rounded-full bg-ink/5 hover:bg-court/10 hover:text-court">
                {pa.program.name}
              </Link>
            ))}
          </div>
        )}
        {recent.length === 0 ? (
          <p className="px-5 pb-4 text-sm text-ink/50">Not used in a session yet.</p>
        ) : (
          <ul className="divide-y divide-ink/10 border-t border-ink/10">
            {recent.map((sa) => (
              <li key={sa.id}>
                <Link href={`/sessions/${sa.session.id}?tab=activities`} className="block px-5 py-2.5 hover:bg-court/5">
                  <span className="text-sm">
                    <span className="font-medium">{shortDate(sa.session.date)}</span>
                    <span className="text-ink/50"> · {[sa.session.run.partner?.org_name, sa.session.run.program.name, sa.session.run.name].filter(Boolean).join(' · ')}</span>
                  </span>
                  {sa.notes && <span className="block text-xs text-ink/60">Adapted: {sa.notes}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {activity.sessions.length > RECENT_USES && (
          <p className="px-5 py-2.5 text-xs text-ink/50 border-t border-ink/10">Showing the {RECENT_USES} most recent of {activity.sessions.length}.</p>
        )}
      </Panel>

      {isAdmin(user) && (
        <div className="pt-2 border-t border-ink/10">
          <DeleteButton
            url={`/api/activities/${activity.id}`}
            after="/activities"
            what={activity.name}
            warning={activity.sessions.length ? 'A session used it, so it can’t be deleted. Edit it instead.' : undefined}
          />
        </div>
      )}
    </div>
  );
}
