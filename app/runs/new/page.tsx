import { prisma } from '@/lib/db';
import { parseId } from '@/lib/parseId';
import { RunForm } from '@/components/programs/RunForm';
import { BackLink, PageHeading } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

export default async function NewRunPage({ searchParams }: { searchParams: Promise<{ program?: string; partner?: string }> }) {
  const { program, partner } = await searchParams;
  const programId = program ? parseId(program) : null;
  const partnerId = partner ? parseId(partner) : null;
  const [programs, partners] = await Promise.all([
    prisma.program.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.partner.findMany({ orderBy: { org_name: 'asc' }, select: { id: true, org_name: true } }),
  ]);
  const back = programId ? `/programs/${programId}` : partnerId ? `/partners/${partnerId}` : '/programs';

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <BackLink href={back} label="Back" />
      <PageHeading kicker="+ New run" title="New program run" />
      {programs.length === 0 ? (
        <div className="card text-sm">Create a program first, then add runs to it.</div>
      ) : (
        <RunForm
          programs={programs}
          partners={partners.map((p) => ({ id: p.id, name: p.org_name }))}
          initial={{
            program_id: programId?.toString() ?? '',
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
      )}
    </div>
  );
}
