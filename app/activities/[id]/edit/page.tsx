import { notFound } from 'next/navigation';
import { parseId } from '@/lib/parseId';
import { categoryChoices } from '@/lib/programs';
import { activityVocabulary, getActivity } from '@/lib/programsData';
import { ActivityForm } from '@/components/programs/ActivityForm';
import { Breadcrumbs, PageHeading } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

export default async function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  const activity = id ? await getActivity(id) : null;
  if (!activity) notFound();
  const vocab = await activityVocabulary();
  const str = (n: number | null) => (n == null ? '' : String(n));

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Breadcrumbs items={[{ label: 'Activities', href: '/activities' }, { label: activity.name, href: `/activities/${activity.id}` }, { label: 'Edit' }]} />
      <PageHeading title={`Edit ${activity.name}`} />
      {activity.sessions.length > 0 && (
        <p className="text-sm text-ink/60 mb-4">
          {activity.sessions.length} session(s) used this. Editing changes it for them too. To change it for one new group only,
          make a twist instead.
        </p>
      )}
      <ActivityForm
        knownGoals={vocab.goals}
        categories={categoryChoices(vocab.categories)}
        initial={{
          id: activity.id,
          name: activity.name,
          summary: activity.summary ?? '',
          category: activity.category ?? '',
          goals: activity.goals,
          age_min: str(activity.age_min),
          age_max: str(activity.age_max),
          duration_minutes: str(activity.duration_minutes),
          group_size: activity.group_size ?? '',
          materials: activity.materials ?? '',
          instructions: activity.instructions ?? '',
        }}
      />
    </div>
  );
}
