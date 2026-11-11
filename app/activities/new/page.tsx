import { parseId } from '@/lib/parseId';
import { categoryChoices } from '@/lib/programs';
import { activityVocabulary, getActivity } from '@/lib/programsData';
import { ActivityForm, EMPTY_ACTIVITY, type ActivityFormValues } from '@/components/programs/ActivityForm';
import { Breadcrumbs, PageHeading } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

/** A new activity, or with ?based_on=ID a twist that starts as a copy of that one. */
export default async function NewActivityPage({ searchParams }: { searchParams: Promise<{ based_on?: string }> }) {
  const { based_on } = await searchParams;
  const basedOnId = based_on ? parseId(based_on) : null;
  const [original, vocab] = await Promise.all([basedOnId ? getActivity(basedOnId) : null, activityVocabulary()]);
  const str = (n: number | null) => (n == null ? '' : String(n));

  const initial: ActivityFormValues = original
    ? {
        name: `${original.name} (twist)`,
        summary: original.summary ?? '',
        category: original.category ?? '',
        goals: original.goals,
        age_min: str(original.age_min),
        age_max: str(original.age_max),
        duration_minutes: str(original.duration_minutes),
        group_size: original.group_size ?? '',
        materials: original.materials ?? '',
        instructions: original.instructions ?? '',
        based_on_id: original.id,
      }
    : EMPTY_ACTIVITY;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Breadcrumbs
        items={[
          { label: 'Activities', href: '/activities' },
          ...(original ? [{ label: original.name, href: `/activities/${original.id}` }] : []),
          { label: original ? 'New twist' : 'New activity' },
        ]}
      />
      <PageHeading title={original ? `New twist of ${original.name}` : 'New activity'} />
      <ActivityForm initial={initial} basedOnName={original?.name} knownGoals={vocab.goals} categories={categoryChoices(vocab.categories)} />
    </div>
  );
}
