import { notFound } from 'next/navigation';
import { parseId } from '@/lib/parseId';
import { formatDate } from '@/lib/programs';
import { getSession, teamNames } from '@/lib/programsData';
import { SessionForm } from '@/components/programs/SessionForm';
import { sessionToForm } from '@/components/programs/sessionValues';
import { BackLink, PageHeading } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

export default async function EditSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  const session = id ? await getSession(id) : null;
  if (!session) notFound();
  const names = await teamNames();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <BackLink href={`/sessions/${session.id}`} label={formatDate(session.date)} />
      <PageHeading kicker={`${session.run.program.name} · ${session.run.name}`} title={`Edit ${formatDate(session.date)}`} />
      <SessionForm knownNames={names} initial={sessionToForm(session)} />
    </div>
  );
}
