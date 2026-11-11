import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { parseId } from '@/lib/parseId';
import { dateOnly, isPastRun, todayDateOnly } from '@/lib/programs';
import { listRunsForPartner, type RunListing } from '@/lib/programsData';
import { RunRow } from '@/components/programs/RunRow';
import { SessionList } from '@/components/programs/SessionList';
import { Breadcrumbs, EmptyState, PageHeading } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

const RECENT = 3;
const NEXT = 3;

/**
 * A current program with its sessions right here, so the usual job (open a session,
 * write its debrief) is one click from this page: debriefs due first, then the next few
 * sessions, then the last few. The full list is on the program's page.
 */
function CurrentProgram({ run, today }: { run: RunListing; today: string }) {
  const due = run.sessions.filter((s) => !s.debrief && dateOnly(s.date) <= today);
  const upcoming = run.sessions.filter((s) => dateOnly(s.date) > today).slice(0, NEXT);
  const recent = run.sessions
    .filter((s) => s.debrief && dateOnly(s.date) <= today)
    .slice(-RECENT)
    .reverse();
  const shown = [...due, ...upcoming, ...recent];
  const hidden = run.sessions.length - shown.length;

  return (
    <section className="card !p-0 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-ink/10">
        <Link href={`/runs/${run.id}`} className="min-w-0 hover:text-court">
          <span className="font-display text-lg font-bold">{run.program.name}</span>
          <span className="text-ink/50"> · {run.name}</span>
          {run.status === 'Planned' && <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-ink/10 align-middle">Planned</span>}
        </Link>
        <Link href={`/sessions/new?run=${run.id}`} className="btn-ghost shrink-0">
          <Plus size={14} /> Session
        </Link>
      </div>
      <SessionList sessions={shown} empty="No sessions yet. Add the first one." />
      {hidden > 0 && (
        <Link href={`/runs/${run.id}`} className="block px-5 py-2.5 text-sm text-ink/60 hover:text-court border-t border-ink/10">
          All {run.sessions.length} sessions →
        </Link>
      )}
    </section>
  );
}

/** One partner's programs: what's running (with sessions), then the past-programs archive. */
export default async function PartnerProgramsPage({ params }: { params: Promise<{ id: string }> }) {
  const raw = (await params).id;
  const own = raw === 'own';
  const partnerId = own ? null : parseId(raw);
  if (!own && partnerId === null) notFound();
  const partner = partnerId ? await prisma.partner.findUnique({ where: { id: partnerId }, select: { id: true, org_name: true } }) : null;
  if (!own && !partner) notFound();

  const runs = await listRunsForPartner(partnerId);
  // Running now first, then planned, each by start date.
  const current = runs
    .filter((r) => !isPastRun(r.status))
    .sort((a, b) => Number(a.status === 'Planned') - Number(b.status === 'Planned') || (a.start_date?.getTime() ?? 0) - (b.start_date?.getTime() ?? 0));
  const past = runs.filter((r) => isPastRun(r.status));
  const today = todayDateOnly();
  const name = partner?.org_name ?? 'Our own programs';
  const addHref = partner ? `/runs/new?partner=${partner.id}` : '/runs/new';

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: name }]} />
        <PageHeading kicker={partner ? 'Partner' : 'Programs with no partner'} title={name}>
          {partner && (
            <Link href={`/partners/${partner.id}`} className="btn-ghost">
              Partner profile
            </Link>
          )}
          <Link href={addHref} className="btn-primary">
            <Plus size={14} /> Add program
          </Link>
        </PageHeading>
      </div>

      {current.length === 0 ? (
        <div className="card">
          <EmptyState>
            Nothing running right now. <Link href={addHref} className="underline">Add a program</Link>
          </EmptyState>
        </div>
      ) : (
        current.map((r) => <CurrentProgram key={r.id} run={r} today={today} />)
      )}

      {past.length > 0 && (
        <details className="card !p-0 overflow-hidden group">
          <summary className="cursor-pointer list-none px-5 py-3 flex items-center justify-between hover:bg-ink/5">
            <span className="font-display text-lg font-bold">
              Past programs <span className="text-sm font-normal text-ink/50">{past.length}</span>
            </span>
            <span className="text-sm text-ink/50 group-open:hidden">Show</span>
            <span className="text-sm text-ink/50 hidden group-open:inline">Hide</span>
          </summary>
          <div className="divide-y divide-ink/10 border-t border-ink/10">
            {past.map((r) => (
              <RunRow key={r.id} run={r} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
