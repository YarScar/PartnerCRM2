import { notFound } from 'next/navigation';
import { parseId } from '@/lib/parseId';
import { activityVocabulary, getProgram } from '@/lib/programsData';
import { ProgramForm } from '@/components/programs/ProgramForm';
import { BackLink, PageHeading } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

export default async function EditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  const program = id ? await getProgram(id) : null;
  if (!program) notFound();
  const { goals } = await activityVocabulary();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <BackLink href={`/programs/${program.id}`} label={program.name} />
      <PageHeading kicker="Edit program" title={program.name} />
      <ProgramForm
        knownGoals={goals}
        initial={{
          id: program.id,
          name: program.name,
          description: program.description ?? '',
          goals: program.goals,
          age_min: program.age_min?.toString() ?? '',
          age_max: program.age_max?.toString() ?? '',
          audience_notes: program.audience_notes ?? '',
        }}
      />
    </div>
  );
}
