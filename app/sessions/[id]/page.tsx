import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight, Copy, Edit2, ExternalLink } from 'lucide-react';
import { isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { pageUser } from '@/lib/pageUser';
import { parseId } from '@/lib/parseId';
import { formatDate, formatTime, formatTimeRange, splitLinks } from '@/lib/programs';
import { getSession, listActivityCards } from '@/lib/programsData';
import { ActivityListEditor } from '@/components/programs/ActivityListEditor';
import { DeleteButton } from '@/components/programs/DeleteButton';
import { TaskListEditor } from '@/components/programs/TaskListEditor';
import { storedTasks } from '@/components/programs/sessionValues';
import { BackLink, PageHeading } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

/** One field of the doc: "Label: value", with a muted dash when it's empty. */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  const empty = children === null || children === undefined || children === '' || (Array.isArray(children) && children.length === 0);
  return (
    <div className="grid sm:grid-cols-[13rem_1fr] gap-x-4 gap-y-0.5 py-2 border-b border-ink/5 last:border-0">
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-sm whitespace-pre-wrap">{empty ? <span className="text-ink/30">—</span> : children}</div>
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

function DocLink({ href }: { href: string | null }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline hover:text-court break-all">
      {href.replace(/^https?:\/\//, '').slice(0, 60)}
      <ExternalLink size={12} className="shrink-0" />
    </a>
  );
}

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  const session = id ? await getSession(id) : null;
  if (!session) notFound();
  const [library, user, siblings] = await Promise.all([
    listActivityCards(),
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
  const otherDocs = splitLinks(session.other_links);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <div>
        <BackLink href={`/runs/${run.id}`} label={`${run.program.name} · ${run.name}`} />
        <PageHeading
          kicker={`${run.partner?.org_name ? `${run.partner.org_name} · ` : ''}${run.program.name} · ${run.name} · Session ${at + 1} of ${siblings.length}`}
          title={session.title || formatDate(session.date)}
        >
          <Link href={`/sessions/${session.id}/edit`} className="btn-secondary">
            <Edit2 size={14} /> Edit
          </Link>
          <Link href={`/sessions/new?run=${run.id}`} className="btn-ghost" title="New session, filled in from the latest one">
            <Copy size={14} /> Next session
          </Link>
          {isAdmin(user) && (
            <DeleteButton url={`/api/sessions/${session.id}`} after={`/runs/${run.id}`} what={`the ${formatDate(session.date)} session`} />
          )}
        </PageHeading>

        <div className="flex justify-between text-sm mb-3">
          {prev ? (
            <Link href={`/sessions/${prev.id}`} className="inline-flex items-center gap-1 text-ink/60 hover:text-ink">
              <ChevronLeft size={14} /> {formatDate(prev.date)}
            </Link>
          ) : <span />}
          {next && (
            <Link href={`/sessions/${next.id}`} className="inline-flex items-center gap-1 text-ink/60 hover:text-ink">
              {formatDate(next.date)} <ChevronRight size={14} />
            </Link>
          )}
        </div>

        <div className="card">
          <Row label="Program title">{run.program.name}</Row>
          <Row label="Date">{formatDate(session.date)}</Row>
          <Row label="Program time">
            {formatTimeRange(session.start_time, session.end_time)}
            {formatTimeRange(session.start_time, session.end_time) && <span className="text-ink/40"> (not including travel and setup)</span>}
          </Row>
          <Row label="Team arrival time">{formatTime(session.arrival_time)}</Row>
          <Row label="Location">{session.location}</Row>
          <Row label="Program description">{session.description}</Row>
          <Row label="Audience">
            {[session.creator_count != null ? `${session.creator_count} creators` : null, session.audience_notes].filter(Boolean).join(' · ')}
          </Row>
          <Row label="Development team"><People names={session.development_team} /></Row>
          <Row label="Facilitation team"><People names={session.facilitation_team} /></Row>
          <Row label="Equipment and needs">{session.equipment}</Row>
          <Row label="Program planning documents"><DocLink href={session.planning_doc_url} /></Row>
          <Row label="Program slides"><DocLink href={session.slides_url} /></Row>
          <Row label="Creator shared documents"><DocLink href={session.shared_docs_url} /></Row>
          <Row label="Other docs">
            {otherDocs.length > 0 && (
              <ul className="space-y-1">
                {otherDocs.map((d, i) => (
                  <li key={i}>{d.href ? <DocLink href={d.href} /> : d.text}</li>
                ))}
              </ul>
            )}
          </Row>
        </div>
      </div>

      <section className="card space-y-3">
        <h2 className="font-display text-xl font-bold">General tasks</h2>
        <TaskListEditor value={storedTasks(session.tasks)} saveUrl={`/api/sessions/${session.id}`} />
      </section>

      <section className="card space-y-3">
        <h2 className="font-display text-xl font-bold">Misc program notes</h2>
        <div className="text-sm whitespace-pre-wrap">{session.notes || <span className="text-ink/30">Nothing yet.</span>}</div>
      </section>

      <section className="card space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold">Activities this session</h2>
          <p className="text-sm text-ink/60">Started from the program&apos;s usual plan. Change it for this session, and note how each was adapted.</p>
        </div>
        <ActivityListEditor
          saveUrl={`/api/sessions/${session.id}/activities`}
          initial={session.activities.map((sa) => ({ activity: sa.activity, notes: sa.notes ?? '' }))}
          library={library}
          target={{ age_min: run.age_min, age_max: run.age_max, goals: run.program.goals }}
          withNotes
          emptyText="No activities yet. Add some below."
        />
      </section>
    </div>
  );
}
