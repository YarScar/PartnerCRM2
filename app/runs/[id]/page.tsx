import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Edit2, Plus } from 'lucide-react';
import { isAdmin } from '@/lib/auth';
import { pageUser } from '@/lib/pageUser';
import { parseId } from '@/lib/parseId';
import { dateOnly, formatDate, formatTimeRange, todayDateOnly } from '@/lib/programs';
import { getRun } from '@/lib/programsData';
import { DeleteButton } from '@/components/programs/DeleteButton';
import { storedTasks } from '@/components/programs/sessionValues';
import { Ages, BackLink, Detail, EmptyState, Goals, PageHeading, RunStatusBadge } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

type Session = NonNullable<Awaited<ReturnType<typeof getRun>>>['sessions'][number];

function SessionCard({ s, number }: { s: Session; number: number }) {
  const tasks = storedTasks(s.tasks);
  const open = tasks.filter((t) => !t.done).length;
  const team = [...s.facilitation_team, ...s.development_team.filter((n) => !s.facilitation_team.includes(n))];
  return (
    <Link href={`/sessions/${s.id}`} className="block border border-ink/10 rounded-xl px-5 py-4 bg-cream hover:border-court/40 transition-colors">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-ink/50">Session {number}</div>
          <div className="font-semibold">
            {formatDate(s.date)}
            {s.title && <span className="font-normal text-ink/70"> — {s.title}</span>}
          </div>
          <div className="text-xs text-ink/50">
            {[formatTimeRange(s.start_time, s.end_time), s.location, s.creator_count != null && `${s.creator_count} creators`].filter(Boolean).join(' · ')}
          </div>
        </div>
        {tasks.length > 0 && (
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${open ? 'bg-court/10 text-court' : 'bg-emerald-100 text-emerald-800'}`}>
            {open ? `${open} task${open === 1 ? '' : 's'} open` : 'Tasks done'}
          </span>
        )}
      </div>
      {s.activities.length > 0 && (
        <div className="text-xs text-ink/70 mt-2">Activities: {s.activities.map((a) => a.activity.name).join(', ')}</div>
      )}
      {team.length > 0 && <div className="text-xs text-ink/50 mt-1">Team: {team.join(', ')}</div>}
    </Link>
  );
}

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  const run = id ? await getRun(id) : null;
  if (!run) notFound();
  const user = await pageUser();
  const today = todayDateOnly();
  const numbered = run.sessions.map((s, i) => ({ s, number: i + 1 }));
  const upcoming = numbered.filter(({ s }) => dateOnly(s.date) >= today);
  const past = numbered.filter(({ s }) => dateOnly(s.date) < today).reverse();
  const dates = [formatDate(run.start_date), formatDate(run.end_date)].filter(Boolean).join(' to ');

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div>
        <BackLink href={`/programs/${run.program.id}`} label={run.program.name} />
        <PageHeading kicker={`${run.partner?.org_name ?? 'Our own'} · ${run.program.name}`} title={run.name}>
          <Link href={`/runs/${run.id}/edit`} className="btn-secondary">
            <Edit2 size={14} /> Edit
          </Link>
          {isAdmin(user) && (
            <DeleteButton
              url={`/api/runs/${run.id}`}
              after={`/programs/${run.program.id}`}
              what={run.name}
              warning={run.sessions.length ? `Its ${run.sessions.length} session(s) are deleted too.` : undefined}
            />
          )}
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
          <Detail label="What's different this time">{run.what_changed}</Detail>
          <Detail label="Notes">{run.notes}</Detail>
        </div>
      </div>

      <section className="card space-y-4">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-2xl font-bold">Sessions</h2>
            <p className="text-sm text-ink/60">The ongoing record: one entry per session, with its time, team, docs and tasks.</p>
          </div>
          <Link href={`/sessions/new?run=${run.id}`} className="btn-primary">
            <Plus size={14} /> New session
          </Link>
        </div>
        {run.sessions.length === 0 ? (
          <EmptyState>No sessions yet. Add the first one.</EmptyState>
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <div className="space-y-2">
                <div className="label-base">Upcoming</div>
                {upcoming.map(({ s, number }) => <SessionCard key={s.id} s={s} number={number} />)}
              </div>
            )}
            {past.length > 0 && (
              <div className="space-y-2">
                <div className="label-base">Past (newest first)</div>
                {past.map(({ s, number }) => <SessionCard key={s.id} s={s} number={number} />)}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
