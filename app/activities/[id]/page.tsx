import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Edit2, GitBranch } from 'lucide-react';
import { isAdmin } from '@/lib/auth';
import { pageUser } from '@/lib/pageUser';
import { parseId } from '@/lib/parseId';
import { formatDate } from '@/lib/programs';
import { getActivity } from '@/lib/programsData';
import { DeleteButton } from '@/components/programs/DeleteButton';
import { Ages, BackLink, Detail, EmptyState, Goals, PageHeading } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  const activity = id ? await getActivity(id) : null;
  if (!activity) notFound();
  const user = await pageUser();

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div>
        <BackLink href="/activities" label="Activity library" />
        <PageHeading kicker={activity.category || 'Activity'} title={activity.name}>
          <Link href={`/activities/new?based_on=${activity.id}`} className="btn-primary">
            <GitBranch size={14} /> Make a twist
          </Link>
          <Link href={`/activities/${activity.id}/edit`} className="btn-secondary">
            <Edit2 size={14} /> Edit
          </Link>
          {isAdmin(user) && (
            <DeleteButton
              url={`/api/activities/${activity.id}`}
              after="/activities"
              what={activity.name}
              warning={activity.sessions.length ? 'A session used it, so it can’t be deleted. Edit it instead.' : undefined}
            />
          )}
        </PageHeading>

        <div className="card space-y-4">
          {activity.based_on && (
            <div className="text-sm flex items-center gap-1.5 text-ink/70">
              <GitBranch size={14} /> Twist of{' '}
              <Link href={`/activities/${activity.based_on.id}`} className="underline hover:text-court">{activity.based_on.name}</Link>
            </div>
          )}
          {activity.summary && <p className="text-lg">{activity.summary}</p>}
          <Goals goals={activity.goals} />
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink/70">
            <Ages min={activity.age_min} max={activity.age_max} />
            {activity.duration_minutes && <span>{activity.duration_minutes} minutes</span>}
            {activity.group_size && <span>Group: {activity.group_size}</span>}
          </div>
          <Detail label="Materials">{activity.materials}</Detail>
          <Detail label="How to run it">{activity.instructions}</Detail>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="card space-y-3">
          <h2 className="font-display text-xl font-bold">Twists of this activity</h2>
          {activity.variants.length === 0 ? (
            <EmptyState>None yet.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {activity.variants.map((v) => (
                <li key={v.id}>
                  <Link href={`/activities/${v.id}`} className="font-medium hover:text-court">{v.name}</Link>
                  {v.summary && <div className="text-xs text-ink/50">{v.summary}</div>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card space-y-3">
          <h2 className="font-display text-xl font-bold">Where it&apos;s used</h2>
          {activity.programs.length === 0 && activity.sessions.length === 0 ? (
            <EmptyState>Not used yet.</EmptyState>
          ) : (
            <ul className="space-y-2 text-sm">
              {activity.programs.map((pa) => (
                <li key={`p${pa.id}`}>
                  Usual plan of{' '}
                  <Link href={`/programs/${pa.program.id}`} className="font-medium hover:text-court">{pa.program.name}</Link>
                </li>
              ))}
              {activity.sessions.map((sa) => (
                <li key={`s${sa.id}`}>
                  <Link href={`/sessions/${sa.session.id}`} className="font-medium hover:text-court">
                    {formatDate(sa.session.date)}{sa.session.title ? ` — ${sa.session.title}` : ''}
                  </Link>
                  <span className="text-ink/50">
                    {' '}
                    · {[sa.session.run.program.name, sa.session.run.name, sa.session.run.partner?.org_name].filter(Boolean).join(' · ')}
                  </span>
                  {sa.notes && <div className="text-xs text-ink/60">Adapted: {sa.notes}</div>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
