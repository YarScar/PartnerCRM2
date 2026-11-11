import { activityVocabulary } from '@/lib/programsData';
import { ProgramForm } from '@/components/programs/ProgramForm';
import { Breadcrumbs, PageHeading } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

export default async function NewProgramPage() {
  const { goals } = await activityVocabulary();
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Program library', href: '/programs?view=library' }, { label: 'New program' }]} />
      <PageHeading title="New program" />
      <ProgramForm knownGoals={goals} />
    </div>
  );
}
