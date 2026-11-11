import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { fetchJiraTasks, type JiraResult, type JiraTask } from '@/lib/jira';

const CATEGORY_STYLE: Record<JiraTask['category'], string> = {
  new: 'bg-ink/5 text-ink/70',
  indeterminate: 'bg-sky-100 text-sky-800',
  done: 'bg-emerald-100 text-emerald-800',
};

type Problem = Exclude<Extract<JiraResult, { ok: false }>['reason'], 'not_linked'>;

const MESSAGES: Record<Problem, string> = {
  not_configured: 'Jira isn’t connected yet. An admin adds JIRA_BASE_URL, JIRA_EMAIL and JIRA_API_TOKEN to show tasks here.',
  auth: 'Jira refused the login. Check the Jira email and API token.',
  bad_link: 'Jira didn’t recognize this epic or label. Check it on the program’s Edit page.',
  unavailable: 'Couldn’t reach Jira just now. Try again in a minute.',
};

const shortDue = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

/**
 * A program's Jira tasks, read-only. Open tasks first; `compact` shows only open ones,
 * up to five, for the session page's side column. Every task links to Jira, where the
 * team keeps editing them.
 */
export async function JiraTasks({
  link,
  editHref,
  compact = false,
}: {
  link: { jira_epic: string | null; jira_label: string | null };
  editHref: string;
  compact?: boolean;
}) {
  const result = await fetchJiraTasks(link);

  if (!result.ok && result.reason === 'not_linked') {
    return (
      <p className="text-sm text-ink/50">
        Not linked to Jira. <Link href={editHref} className="underline">Add the epic or label</Link>
      </p>
    );
  }

  if (!result.ok) {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-ink/60">{MESSAGES[result.reason as Problem]}</p>
        {result.searchUrl && <OpenInJira href={result.searchUrl} />}
      </div>
    );
  }

  const open = result.tasks.filter((t) => t.category !== 'done');
  const shown = compact ? open.slice(0, 5) : result.tasks;
  const doneCount = result.tasks.length - open.length;

  return (
    <div className="space-y-2">
      {result.demo && (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
          Demo tasks · not from your Jira
        </p>
      )}
      {shown.length === 0 ? (
        <p className="text-sm text-ink/50">{result.tasks.length ? 'All tasks done.' : 'No tasks yet.'}</p>
      ) : (
        <ul className="divide-y divide-ink/10">
          {shown.map((t) => (
            <li key={t.key}>
              {/* Two lines: the task across the full width, then key · who · due and its status. */}
              <a href={t.url} target="_blank" rel="noopener noreferrer" className="block py-2.5 hover:text-court">
                <span className={`block text-sm leading-snug ${t.category === 'done' ? 'line-through text-ink/40' : ''}`}>{t.summary}</span>
                <span className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-xs text-ink/50 truncate min-w-0">
                    <span className="font-mono">{t.key}</span>
                    {' · '}
                    {t.assignee ?? 'Unassigned'}
                    {!compact && t.due && ` · due ${shortDue(t.due)}`}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap shrink-0 ${CATEGORY_STYLE[t.category]}`}>{t.status}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between gap-2 text-xs text-ink/50">
        <span>
          {compact ? `${open.length} open` : `${open.length} open · ${doneCount} done`}
          {result.total > result.tasks.length && ` · showing ${result.tasks.length} of ${result.total}`}
        </span>
        <OpenInJira href={result.searchUrl} />
      </div>
    </div>
  );
}

function OpenInJira({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs underline text-ink/60 hover:text-court">
      Open in Jira <ExternalLink size={11} />
    </a>
  );
}

/** Placeholder while Jira answers, so the rest of the page isn't held up. */
export function JiraTasksLoading() {
  return <p className="text-sm text-ink/40">Loading Jira tasks…</p>;
}
