import { prisma } from '@/lib/db';
import { parseId } from '@/lib/parseId';
import { RunForm } from '@/components/programs/RunForm';
import { Breadcrumbs, PageHeading, partnerProgramsHref } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

/** Add a program for a partner: pick one from the library or name a new one. */
export default async function NewRunPage({ searchParams }: { searchParams: Promise<{ program?: string; partner?: string }> }) {
  const { program, partner } = await searchParams;
  const programId = program ? parseId(program) : null;
  const partnerId = partner ? parseId(partner) : null;
  const [programs, partners] = await Promise.all([
    prisma.program.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.partner.findMany({ orderBy: { org_name: 'asc' }, select: { id: true, org_name: true } }),
  ]);
  const chosen = partners.find((p) => p.id === partnerId);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Breadcrumbs
        items={[
          { label: 'Programs', href: '/programs' },
          ...(chosen ? [{ label: chosen.org_name, href: partnerProgramsHref(chosen.id) }] : []),
          { label: 'Add program' },
        ]}
      />
      <PageHeading kicker={chosen ? chosen.org_name : 'Programs'} title={chosen ? `Add a program with ${chosen.org_name}` : 'Add a program'} />
      <RunForm
        programs={programs}
        partners={partners.map((p) => ({ id: p.id, name: p.org_name }))}
        initial={{
          program_id: programId?.toString() ?? (programs.length === 0 ? 'new' : ''),
          partner_id: partnerId?.toString() ?? '',
          name: '',
          status: 'Planned',
          start_date: '',
          end_date: '',
          location: '',
          age_min: '',
          age_max: '',
          participant_count: '',
          what_changed: '',
          notes: '',
        }}
      />
    </div>
  );
}
