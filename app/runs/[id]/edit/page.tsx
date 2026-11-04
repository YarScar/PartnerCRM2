import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { parseId } from '@/lib/parseId';
import { dateOnly } from '@/lib/programs';
import { getRun } from '@/lib/programsData';
import { RunForm } from '@/components/programs/RunForm';
import { BackLink, PageHeading } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

export default async function EditRunPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  const run = id ? await getRun(id) : null;
  if (!run) notFound();
  const partners = await prisma.partner.findMany({ orderBy: { org_name: 'asc' }, select: { id: true, org_name: true } });
  const str = (n: number | null) => (n == null ? '' : String(n));

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <BackLink href={`/runs/${run.id}`} label={run.name} />
      <PageHeading kicker="Edit run" title={run.name} />
      <RunForm
        programs={[{ id: run.program.id, name: run.program.name }]}
        partners={partners.map((p) => ({ id: p.id, name: p.org_name }))}
        initial={{
          id: run.id,
          program_id: String(run.program.id),
          partner_id: str(run.partner?.id ?? null),
          name: run.name,
          status: run.status,
          start_date: dateOnly(run.start_date),
          end_date: dateOnly(run.end_date),
          location: run.location ?? '',
          age_min: str(run.age_min),
          age_max: str(run.age_max),
          participant_count: str(run.participant_count),
          what_changed: run.what_changed ?? '',
          notes: run.notes ?? '',
        }}
      />
    </div>
  );
}
