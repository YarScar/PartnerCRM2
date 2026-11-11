import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Edit2, Plus } from 'lucide-react';
import { isAdmin } from '@/lib/auth';
import { pageUser } from '@/lib/pageUser';
import { parseId } from '@/lib/parseId';
import { formatAges, formatDate, isPastRun } from '@/lib/programs';
import { getRun } from '@/lib/programsData';
import { ArchiveRunButton } from '@/components/programs/ArchiveRunButton';
import { DeleteButton } from '@/components/programs/DeleteButton';
import { JiraTasks, JiraTasksLoading } from '@/components/programs/JiraTasks';
import { SessionList } from '@/components/programs/SessionList';
import { Breadcrumbs, Goals, PageHeading, Panel, RunStatusBadge, partnerProgramsHref } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

/** A program with a partner: one line of facts, then every session in date order. */
export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  const run = id ? await getRun(id) : null;
  if (!run) notFound();
  const user = await pageUser();
  const ages = formatAges(run.age_min, run.age_max);
  const dates = [formatDate(run.start_date), formatDate(run.end_date)].filter(Boolean).join(' – ');
  const facts = [dates, run.location, ages && `Ages ${ages}`, run.participant_count != null && `${run.participant_count} creators`].filter(Boolean);
  const hasDetails = Boolean(run.what_changed || run.notes || run.program.goals.length);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <div>
        <Breadcrumbs
          items={[
            { label: 'Programs', href: '/programs' },
            { label: run.partner?.org_name ?? 'Our own programs', href: partnerProgramsHref(run.partner?.id) },
            { label: `${run.program.name} · ${run.name}` },
          ]}
        />
        <PageHeading
          title={run.program.name}
          meta={
            <>
              <span className="font-medium text-ink">{run.name}</span>
              <RunStatusBadge status={run.status} />
              {facts.map((f) => (
                <span key={String(f)}>· {f}</span>
              ))}
            </>
          }
        >
          <Link href={`/sessions/new?run=${run.id}`} className="btn-primary">
            <Plus size={14} /> New session
          </Link>
          <Link href={`/runs/${run.id}/edit`} className="btn-ghost" aria-label="Edit program details">
            <Edit2 size={14} /> Edit
          </Link>
        </PageHeading>
      </div>

      <Panel title="Sessions" count={run.sessions.length} flush>
        <SessionList sessions={run.sessions} empty="No sessions yet. Add the first one." />
      </Panel>

      <Panel
        title="Jira tasks"
        action={
          (run.jira_epic || run.jira_label) && (
            <span className="text-xs text-ink/50">{[run.jira_epic && `Epic ${run.jira_epic}`, run.jira_label && `Label ${run.jira_label}`].filter(Boolean).join(' · ')}</span>
          )
        }
      >
        <Suspense fallback={<JiraTasksLoading />}>
          <JiraTasks link={run} editHref={`/runs/${run.id}/edit`} />
        </Suspense>
      </Panel>

      {hasDetails && (
        <details className="card">
          <summary className="cursor-pointer font-semibold">Program details</summary>
          <div className="mt-4 space-y-4 text-sm">
            <Goals goals={run.program.goals} />
            {run.what_changed && (
              <div>
                <div className="label-base">What&apos;s different this time</div>
                <p className="whitespace-pre-wrap">{run.what_changed}</p>
              </div>
            )}
            {run.notes && (
              <div>
                <div className="label-base">Notes</div>
                <p className="whitespace-pre-wrap">{run.notes}</p>
              </div>
            )}
            <Link href={`/programs/${run.program.id}`} className="inline-block underline text-ink/70 hover:text-court">
              {run.program.name} in the program library
            </Link>
          </div>
        </details>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-ink/10">
        <ArchiveRunButton runId={run.id} past={isPastRun(run.status)} />
        {isAdmin(user) && (
          <DeleteButton
            url={`/api/runs/${run.id}`}
            after={partnerProgramsHref(run.partner?.id)}
            what={`${run.program.name} · ${run.name}`}
            warning={run.sessions.length ? `Its ${run.sessions.length} session(s) and their debriefs are deleted too.` : undefined}
          />
        )}
      </div>
    </div>
  );
}
