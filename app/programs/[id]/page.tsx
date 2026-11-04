import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Edit2, Plus } from 'lucide-react';
import { isAdmin } from '@/lib/auth';
import { pageUser } from '@/lib/pageUser';
import { parseId } from '@/lib/parseId';
import { dateOnly } from '@/lib/programs';
import { getProgram, listActivityCards } from '@/lib/programsData';
import { ActivityListEditor } from '@/components/programs/ActivityListEditor';
import { DeleteButton } from '@/components/programs/DeleteButton';
import { Ages, BackLink, Detail, EmptyState, Goals, PageHeading, RunStatusBadge } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

export default async function ProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  const program = id ? await getProgram(id) : null;
  if (!program) notFound();
  const [library, user] = await Promise.all([listActivityCards(), pageUser()]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
      <div>
        <BackLink href="/programs" label="Programs" />
        <PageHeading kicker="Program" title={program.name}>
          <Link href={`/programs/${program.id}/edit`} className="btn-secondary">
            <Edit2 size={14} /> Edit
          </Link>
          {isAdmin(user) && (
            <DeleteButton
              url={`/api/programs/${program.id}`}
              after="/programs"
              what={program.name}
              warning={program.runs.length ? `Its ${program.runs.length} run(s) are deleted too. Activities stay in the library.` : undefined}
            />
          )}
        </PageHeading>
        <div className="card space-y-4">
          <Goals goals={program.goals} />
          <div className="text-sm text-ink/70">
            <Ages min={program.age_min} max={program.age_max} />
          </div>
          <Detail label="What it is">{program.description}</Detail>
          <Detail label="Audience notes">{program.audience_notes}</Detail>
        </div>
      </div>

      <section className="card space-y-4">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-2xl font-bold">Runs</h2>
            <p className="text-sm text-ink/60">Each stretch of this program (e.g. 2026–2027) with a partner, holding its sessions.</p>
          </div>
          <Link href={`/runs/new?program=${program.id}`} className="btn-primary">
            <Plus size={14} /> New run
          </Link>
        </div>
        {program.runs.length === 0 ? (
          <EmptyState>No runs yet.</EmptyState>
        ) : (
          <div className="divide-y divide-ink/10">
            {program.runs.map((r) => (
              <Link key={r.id} href={`/runs/${r.id}`} className="flex items-center justify-between gap-4 py-3 hover:text-court">
                <div className="min-w-0">
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs text-ink/50">
                    {[r.partner?.org_name ?? 'No partner', r.start_date && dateOnly(r.start_date), `${r.sessions.length} session${r.sessions.length === 1 ? '' : 's'}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                  {r.what_changed && <div className="text-xs text-ink/60 truncate">Different: {r.what_changed}</div>}
                </div>
                <RunStatusBadge status={r.status} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="card space-y-4">
        <div>
          <h2 className="font-display text-2xl font-bold">Usual activities</h2>
          <p className="text-sm text-ink/60">
            The plan each new session starts with. Changing it here doesn&apos;t change sessions that already exist.
          </p>
        </div>
        <ActivityListEditor
          saveUrl={`/api/programs/${program.id}/activities`}
          initial={program.activities.map((pa) => ({ activity: pa.activity, notes: '' }))}
          library={library}
          target={{ age_min: program.age_min, age_max: program.age_max, goals: program.goals }}
          emptyText="No usual activities yet. Add some below."
        />
      </section>
    </div>
  );
}
