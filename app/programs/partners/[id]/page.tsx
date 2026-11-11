import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Archive, ClipboardCheck, ExternalLink, Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { parseId } from '@/lib/parseId';
import { dateOnly, formatDate, isPastRun, todayDateOnly } from '@/lib/programs';
import { listRunsForPartner } from '@/lib/programsData';
import { RunRow } from '@/components/programs/RunRow';
import { Breadcrumbs, EmptyState, PageHeading } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

/** One partner's programs: debriefs due, what's running now, and the past-programs archive. */
export default async function PartnerProgramsPage({ params }: { params: Promise<{ id: string }> }) {
  const raw = (await params).id;
  const own = raw === 'own';
  const partnerId = own ? null : parseId(raw);
  if (!own && partnerId === null) notFound();
  const partner = partnerId ? await prisma.partner.findUnique({ where: { id: partnerId }, select: { id: true, org_name: true } }) : null;
  if (!own && !partner) notFound();

  const runs = await listRunsForPartner(partnerId);
  const current = runs.filter((r) => !isPastRun(r.status));
  const past = runs.filter((r) => isPastRun(r.status));
  const today = todayDateOnly();
  const due = current.flatMap((r) =>
    r.sessions.filter((s) => !s.debrief && dateOnly(s.date) <= today).map((s) => ({ run: r, session: s }))
  );
  const name = partner?.org_name ?? 'Our own programs';
  const addHref = partner ? `/runs/new?partner=${partner.id}` : '/runs/new';

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div>
        <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: name }]} />
        <PageHeading kicker={partner ? 'Partner programs' : 'Programs with no partner'} title={name}>
          {partner && (
            <Link href={`/partners/${partner.id}`} className="btn-ghost">
              <ExternalLink size={14} /> Partner profile
            </Link>
          )}
          <Link href={addHref} className="btn-primary">
            <Plus size={14} /> Add program
          </Link>
        </PageHeading>
      </div>

      {due.length > 0 && (
        <section className="card space-y-3 border-court/30">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={18} className="text-court" />
            <h2 className="font-display text-xl font-bold">Debriefs due</h2>
          </div>
          <p className="text-sm text-ink/60">Sessions that have happened but haven&apos;t been debriefed yet.</p>
          <ul className="divide-y divide-ink/10">
            {due.map(({ run, session }) => (
              <li key={session.id}>
                <Link href={`/sessions/${session.id}#debrief`} className="flex items-center justify-between gap-3 py-2 hover:text-court">
                  <span>
                    <span className="font-medium">{formatDate(session.date)}</span>
                    {session.title && <span className="text-ink/60"> — {session.title}</span>}
                    <span className="text-xs text-ink/50"> · {run.program.name} {run.name}</span>
                  </span>
                  <span className="text-sm font-medium text-court shrink-0">Write debrief →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-bold">Current programs</h2>
        {current.length === 0 ? (
          <div className="card">
            <EmptyState>
              Nothing running with {partner ? partner.org_name : 'no partner'} right now.{' '}
              <Link href={addHref} className="underline">Add a program</Link>
            </EmptyState>
          </div>
        ) : (
          <div className="card !p-0 overflow-hidden divide-y divide-ink/10">
            {current.map((r) => (
              <RunRow key={r.id} run={r} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Archive size={18} className="text-ink/50" />
          <h2 className="font-display text-2xl font-bold">Past programs</h2>
        </div>
        <p className="text-sm text-ink/60">
          Finished programs stay here with every session and debrief, for documentation. Open a current program and
          choose <strong>Move to past programs</strong> when it ends.
        </p>
        {past.length === 0 ? (
          <div className="card">
            <EmptyState>No past programs yet.</EmptyState>
          </div>
        ) : (
          <div className="card !p-0 overflow-hidden divide-y divide-ink/10">
            {past.map((r) => (
              <RunRow key={r.id} run={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
