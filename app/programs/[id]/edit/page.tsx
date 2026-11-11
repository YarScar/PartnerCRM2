import { notFound } from 'next/navigation';
import { parseId } from '@/lib/parseId';
import { activityVocabulary, getProgram } from '@/lib/programsData';
import { ProgramForm } from '@/components/programs/ProgramForm';
import { Breadcrumbs, PageHeading } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

export default async function EditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  const program = id ? await getProgram(id) : null;
  if (!program) notFound();
  const { goals } = await activityVocabulary();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Program library', href: '/programs?view=library' }, { label: program.name, href: `/programs/${program.id}` }, { label: 'Edit' }]} />
      <PageHeading title={`Edit ${program.name}`} />
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
