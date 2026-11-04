import { activityVocabulary } from '@/lib/programsData';
import { ProgramForm } from '@/components/programs/ProgramForm';
import { BackLink, PageHeading } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

export default async function NewProgramPage() {
  const { goals } = await activityVocabulary();
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <BackLink href="/programs" label="Programs" />
      <PageHeading kicker="+ New program" title="New program" />
      <ProgramForm knownGoals={goals} />
    </div>
  );
}
