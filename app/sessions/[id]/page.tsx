import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight, Edit2, ExternalLink, Plus } from 'lucide-react';
import { isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { pageUser } from '@/lib/pageUser';
import { parseId } from '@/lib/parseId';
import { debriefStatus, formatDate, formatTime, formatTimeRange, splitLinks } from '@/lib/programs';
import { getSession, listActivityCards } from '@/lib/programsData';
import { ActivityListEditor } from '@/components/programs/ActivityListEditor';
import { DebriefForm } from '@/components/programs/DebriefForm';
import { DeleteButton } from '@/components/programs/DeleteButton';
import { DebriefChip } from '@/components/programs/SessionList';
import { TaskListEditor } from '@/components/programs/TaskListEditor';
import { storedTasks } from '@/components/programs/sessionValues';
import { Breadcrumbs, partnerProgramsHref } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

const TABS = ['overview', 'debrief', 'activities'] as const;
type Tab = (typeof TABS)[number];

/** A labelled block that disappears when it has nothing in it. */
function Block({ label, children }: { label: string; children: React.ReactNode }) {
  if (children === null || children === undefined || children === '' || children === false) return null;
  return (
    <div>
      <div className="label-base">{label}</div>
      <div className="text-sm whitespace-pre-wrap">{children}</div>
    </div>
  );
}

function People({ names }: { names: string[] }) {
  if (!names.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {names.map((n) => (
        <span key={n} className="text-xs px-2.5 py-1 rounded-full bg-ink/5 font-medium">{n}</span>
      ))}
    </div>
  );
}

function DocButton({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-ink/10 hover:border-court/40 hover:text-court text-sm">
      <span className="truncate">{label}</span>
      <ExternalLink size={13} className="shrink-0 text-ink/40" />
    </a>
  );
}

/**
 * One session, in three tabs so nothing is a long scroll: Overview (the doc template's
 * facts, team, documents, tasks), Debrief, and Activities. Empty fields are left out, and
 * a session whose debrief is due opens on the Debrief tab.
 */
export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const id = parseId((await params).id);
  const session = id ? await getSession(id) : null;
  if (!session) notFound();
  const { tab: rawTab } = await searchParams;
  const status = debriefStatus(session.date, Boolean(session.debrief));
  const tab: Tab = TABS.includes(rawTab as Tab) ? (rawTab as Tab) : status === 'due' ? 'debrief' : 'overview';

  const [library, user, siblings] = await Promise.all([
    tab === 'activities' ? listActivityCards() : Promise.resolve([]),
    pageUser(),
    prisma.programSession.findMany({
      where: { run_id: session.run.id },
      orderBy: [{ date: 'asc' }, { start_time: 'asc' }, { id: 'asc' }],
      select: { id: true, date: true },
    }),
  ]);
  const at = siblings.findIndex((s) => s.id === session.id);
  const prev = siblings[at - 1];
  const next = siblings[at + 1];
  const { run } = session;
  const time = formatTimeRange(session.start_time, session.end_time);
  const docs = [
    session.planning_doc_url && { href: session.planning_doc_url, label: 'Planning documents' },
    session.slides_url && { href: session.slides_url, label: 'Slides' },
    session.shared_docs_url && { href: session.shared_docs_url, label: 'Creator shared documents' },
    ...splitLinks(session.other_links).map((l) => (l.href ? { href: l.href, label: l.text.replace(l.href, '').trim() || 'Other doc' } : null)),
  ].filter((d): d is { href: string; label: string } => Boolean(d));
  const otherText = splitLinks(session.other_links).filter((l) => !l.href).map((l) => l.text).join('\n');
  const tasks = storedTasks(session.tasks);
  const audience = [session.creator_count != null && `${session.creator_count} creators`, session.audience_notes].filter(Boolean).join(' · ');

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <div>
        <Breadcrumbs
          items={[
            { label: 'Programs', href: '/programs' },
            { label: run.partner?.org_name ?? 'Our own programs', href: partnerProgramsHref(run.partner?.id) },
            { label: `${run.program.name} · ${run.name}`, href: `/runs/${run.id}` },
          ]}
        />
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-widest text-ink/50 mb-1">Session {at + 1} of {siblings.length}</div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              {formatDate(session.date)}
              {session.title && <span className="text-ink/50 font-normal"> · {session.title}</span>}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/60">
              <DebriefChip date={session.date} done={Boolean(session.debrief)} />
              {time && <span>{time}</span>}
              {session.arrival_time && <span>· team arrives {formatTime(session.arrival_time)}</span>}
              {session.location && <span>· {session.location}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {prev && (
              <Link href={`/sessions/${prev.id}`} className="btn-ghost !px-2" aria-label="Previous session" title={formatDate(prev.date)}>
                <ChevronLeft size={16} />
              </Link>
            )}
            {next && (
              <Link href={`/sessions/${next.id}`} className="btn-ghost !px-2" aria-label="Next session" title={formatDate(next.date)}>
                <ChevronRight size={16} />
              </Link>
            )}
            <Link href={`/sessions/${session.id}/edit`} className="btn-secondary">
              <Edit2 size={14} /> Edit
            </Link>
          </div>
        </div>
      </div>

      <nav className="flex gap-1 border-b border-ink/10" aria-label="Session sections">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/sessions/${session.id}?tab=${t}`}
            aria-current={tab === t ? 'page' : undefined}
            className={`px-4 py-2.5 text-sm font-medium -mb-px border-b-2 ${tab === t ? 'border-ink text-ink' : 'border-transparent text-ink/60 hover:text-ink'}`}
          >
            {t === 'overview' ? 'Overview' : t === 'debrief' ? 'Debrief' : 'Activities'}
            {t === 'debrief' && status === 'due' && <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-court align-middle" />}
            {t === 'activities' && <span className="ml-1.5 text-ink/40">{session.activities.length}</span>}
          </Link>
        ))}
      </nav>

      {tab === 'overview' && (
        <div className="grid md:grid-cols-[1fr_17rem] gap-6">
          <div className="card space-y-5">
            <Block label="Program description">{session.description}</Block>
            <Block label="Audience">{audience}</Block>
            <Block label="Equipment and needs">{session.equipment}</Block>
            <Block label="Notes">{session.notes}</Block>
            <Block label="Other docs">{otherText}</Block>
            {!session.description && !audience && !session.equipment && !session.notes && !otherText && (
              <div className="text-sm text-ink/50">
                Nothing planned yet. <Link href={`/sessions/${session.id}/edit`} className="underline">Fill in the plan</Link>
              </div>
            )}
          </div>
          <aside className="space-y-4">
            {(session.facilitation_team.length > 0 || session.development_team.length > 0) && (
              <div className="card !p-4 space-y-3">
                <Block label="Facilitation team"><People names={session.facilitation_team} /></Block>
                <Block label="Development team"><People names={session.development_team} /></Block>
              </div>
            )}
            {docs.length > 0 && (
              <div className="card !p-4 space-y-2">
                <div className="label-base">Documents</div>
                {docs.map((d, i) => (
                  <DocButton key={i} href={d.href} label={d.label} />
                ))}
              </div>
            )}
            <div className="card !p-4 space-y-2">
              <div className="label-base">Tasks</div>
              <TaskListEditor value={tasks} saveUrl={`/api/sessions/${session.id}`} />
            </div>
          </aside>
        </div>
      )}

      {tab === 'debrief' && (
        <section className="card">
          <DebriefForm
            sessionId={session.id}
            status={status}
            plannedCount={session.creator_count}
            saved={
              session.debrief
                ? {
                    attendance: session.debrief.attendance?.toString() ?? '',
                    engagement: session.debrief.engagement?.toString() ?? '',
                    went_well: session.debrief.went_well ?? '',
                    to_improve: session.debrief.to_improve ?? '',
                    changes_next_time: session.debrief.changes_next_time ?? '',
                    highlights: session.debrief.highlights ?? '',
                    follow_ups: session.debrief.follow_ups ?? '',
                    submitted_by: session.debrief.submitted_by,
                    updated_at: session.debrief.updated_at.toISOString(),
                  }
                : null
            }
          />
        </section>
      )}

      {tab === 'activities' && (
        <section className="card">
          <ActivityListEditor
            saveUrl={`/api/sessions/${session.id}/activities`}
            initial={session.activities.map((sa) => ({ activity: sa.activity, notes: sa.notes ?? '' }))}
            library={library}
            target={{ age_min: run.age_min, age_max: run.age_max, goals: run.program.goals }}
            withNotes
            emptyText="No activities yet. Add some below."
          />
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-ink/10">
        <Link href={`/sessions/new?run=${run.id}`} className="btn-ghost">
          <Plus size={14} /> Add next session
        </Link>
        {isAdmin(user) && (
          <DeleteButton url={`/api/sessions/${session.id}`} after={`/runs/${run.id}`} what={`the ${formatDate(session.date)} session`} />
        )}
      </div>
    </div>
  );
}
