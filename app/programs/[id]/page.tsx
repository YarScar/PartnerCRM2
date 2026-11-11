import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Edit2, Plus } from 'lucide-react';
import { isAdmin } from '@/lib/auth';
import { pageUser } from '@/lib/pageUser';
import { parseId } from '@/lib/parseId';
import { formatAges, isPastRun } from '@/lib/programs';
import { getProgram, listActivityCards } from '@/lib/programsData';
import { ActivityListEditor } from '@/components/programs/ActivityListEditor';
import { DeleteButton } from '@/components/programs/DeleteButton';
import { RunRow } from '@/components/programs/RunRow';
import { Breadcrumbs, EmptyState, Goals, PageHeading, Panel } from '@/components/programs/bits';

export const dynamic = 'force-dynamic';

/**
 * A program in the library: what it is, where it has run (by partner), and the usual
 * activities every new session starts with.
 */
export default async function ProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  const program = id ? await getProgram(id) : null;
  if (!program) notFound();
  const [library, user] = await Promise.all([listActivityCards(), pageUser()]);
  const ages = formatAges(program.age_min, program.age_max);
  const current = program.runs.filter((r) => !isPastRun(r.status));
  const past = program.runs.filter((r) => isPastRun(r.status));

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
      <div>
        <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: 'Program library', href: '/programs?view=library' }, { label: program.name }]} />
        <PageHeading
          title={program.name}
          meta={
            <>
              <span>{ages ? `Ages ${ages}` : 'Any age'}</span>
              <span>· Run {program.runs.length} time{program.runs.length === 1 ? '' : 's'}</span>
            </>
          }
        >
          <Link href={`/runs/new?program=${program.id}`} className="btn-primary">
            <Plus size={14} /> Add to a partner
          </Link>
          <Link href={`/programs/${program.id}/edit`} className="btn-ghost">
            <Edit2 size={14} /> Edit
          </Link>
        </PageHeading>
        {(program.description || program.goals.length > 0 || program.audience_notes) && (
          <div className="card space-y-3">
            {program.description && <p className="text-sm whitespace-pre-wrap">{program.description}</p>}
            {program.audience_notes && <p className="text-sm text-ink/60 whitespace-pre-wrap">{program.audience_notes}</p>}
            <Goals goals={program.goals} />
          </div>
        )}
      </div>

      <Panel title="Where it runs" count={program.runs.length} flush>
        {program.runs.length === 0 ? (
          <EmptyState>Not run yet. Use Add to a partner to start it.</EmptyState>
        ) : (
          <div className="divide-y divide-ink/10 border-t border-ink/10">
            {[...current, ...past].map((r) => (
              <RunRow key={r.id} run={r} byPartner />
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Usual activities" count={program.activities.length}>
        <p className="text-sm text-ink/60 mb-4">Every new session starts with these. Changing them doesn&apos;t change sessions already planned.</p>
        <ActivityListEditor
          saveUrl={`/api/programs/${program.id}/activities`}
          initial={program.activities.map((pa) => ({ activity: pa.activity, notes: '' }))}
          library={library}
          target={{ age_min: program.age_min, age_max: program.age_max, goals: program.goals }}
          emptyText="No usual activities yet."
        />
      </Panel>

      {isAdmin(user) && (
        <div className="pt-2 border-t border-ink/10">
          <DeleteButton
            url={`/api/programs/${program.id}`}
            after="/programs?view=library"
            what={program.name}
            warning={program.runs.length ? `It has run ${program.runs.length} time(s); those runs and their sessions are deleted too. Activities stay in the library.` : undefined}
          />
        </div>
      )}
    </div>
  );
}
