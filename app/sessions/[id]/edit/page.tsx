import { notFound } from 'next/navigation';
import { parseId } from '@/lib/parseId';
import { formatDate } from '@/lib/programs';
import { getSession, teamNames } from '@/lib/programsData';
import { SessionForm } from '@/components/programs/SessionForm';
import { sessionToForm } from '@/components/programs/sessionValues';
import { Breadcrumbs, PageHeading, partnerProgramsHref } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

export default async function EditSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  const session = id ? await getSession(id) : null;
  if (!session) notFound();
  const names = await teamNames();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          { label: session.run.partner?.org_name ?? 'Our own programs', href: partnerProgramsHref(session.run.partner?.id) },
          { label: `${session.run.program.name} · ${session.run.name}`, href: `/runs/${session.run.id}` },
          { label: formatDate(session.date), href: `/sessions/${session.id}` },
          { label: 'Edit' },
        ]}
      />
      <PageHeading title={`Edit session · ${formatDate(session.date)}`} />
      <SessionForm knownNames={names} initial={sessionToForm(session)} />
    </div>
  );
}
