import { notFound } from 'next/navigation';
import { parseId } from '@/lib/parseId';
import { formatAges, formatDate, todayDateOnly } from '@/lib/programs';
import { getRun, previousSession, teamNames } from '@/lib/programsData';
import { SessionForm } from '@/components/programs/SessionForm';
import { newSessionForm } from '@/components/programs/sessionValues';
import { BackLink, PageHeading } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

export default async function NewSessionPage({ searchParams }: { searchParams: Promise<{ run?: string }> }) {
  const { run: rawRun } = await searchParams;
  const runId = rawRun ? parseId(rawRun) : null;
  const run = runId ? await getRun(runId) : null;
  if (!run) notFound();
  const [prev, names] = await Promise.all([previousSession(run.id), teamNames()]);
  const ages = formatAges(run.age_min, run.age_max);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <BackLink href={`/runs/${run.id}`} label={`${run.program.name} · ${run.name}`} />
      <PageHeading kicker={`${run.program.name} · ${run.name}`} title="New session" />
      <SessionForm
        knownNames={names}
        prefilledFrom={prev ? formatDate(prev.date) : undefined}
        initial={newSessionForm(
          run.id,
          { location: run.location, audience: ages ? `Ages ${ages}` : null, date: todayDateOnly() },
          prev
        )}
      />
    </div>
  );
}
