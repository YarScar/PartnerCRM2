import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Edit2 } from 'lucide-react';
import { isAdmin } from '@/lib/auth';
import { pageUser } from '@/lib/pageUser';
import { parseId } from '@/lib/parseId';
import { dateOnly } from '@/lib/programs';
import { getRun, listActivityCards } from '@/lib/programsData';
import { ActivityListEditor } from '@/components/programs/ActivityListEditor';
import { DeleteButton } from '@/components/programs/DeleteButton';
import { Ages, BackLink, Detail, Goals, PageHeading, RunStatusBadge } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  const run = id ? await getRun(id) : null;
  if (!run) notFound();
  const [library, user] = await Promise.all([listActivityCards(), pageUser()]);
  const dates = [dateOnly(run.start_date), dateOnly(run.end_date)].filter(Boolean).join(' to ');

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div>
        <BackLink href={`/programs/${run.program.id}`} label={run.program.name} />
        <PageHeading kicker={`Run of ${run.program.name}`} title={run.name}>
          <Link href={`/runs/${run.id}/edit`} className="btn-secondary">
            <Edit2 size={14} /> Edit
          </Link>
          {isAdmin(user) && <DeleteButton url={`/api/runs/${run.id}`} after={`/programs/${run.program.id}`} what={run.name} />}
        </PageHeading>
        <div className="card space-y-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink/70">
            <RunStatusBadge status={run.status} />
            {run.partner ? (
              <Link href={`/partners/${run.partner.id}`} className="underline hover:text-court">{run.partner.org_name}</Link>
            ) : (
              <span>No partner</span>
            )}
            {dates && <span>{dates}</span>}
            {run.location && <span>{run.location}</span>}
            <Ages min={run.age_min} max={run.age_max} />
            {run.participant_count != null && <span>{run.participant_count} participants</span>}
          </div>
          <Goals goals={run.program.goals} />
          <Detail label="What was different this time">{run.what_changed}</Detail>
          <Detail label="Notes">{run.notes}</Detail>
          {run.partner?.youth_ages && <Detail label="Partner says their youth are">{run.partner.youth_ages}</Detail>}
        </div>
      </div>

      <section className="card space-y-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Activities this run</h2>
          <p className="text-sm text-ink/60">
            Started from the program&apos;s usual plan. Change it for this group, and note how each one was adapted.
          </p>
        </div>
        <ActivityListEditor
          saveUrl={`/api/runs/${run.id}/activities`}
          initial={run.activities.map((ra) => ({ activity: ra.activity, notes: ra.notes ?? '' }))}
          library={library}
          target={{ age_min: run.age_min, age_max: run.age_max, goals: run.program.goals }}
          withNotes
          emptyText="No activities yet. Add some below."
        />
      </section>
    </div>
  );
}
