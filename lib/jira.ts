import { buildJql } from './jiraRefs';

/**
 * Read-only Jira Cloud client, server side only. It needs JIRA_BASE_URL, JIRA_EMAIL and
 * JIRA_API_TOKEN; without them it reports "not configured" and the app just links out.
 * It never writes to Jira and never returns the token or Jira's raw error text.
 */

export type JiraTask = {
  key: string;
  summary: string;
  status: string;
  /** Jira's status category: "new" (to do), "indeterminate" (in progress) or "done". */
  category: 'new' | 'indeterminate' | 'done';
  assignee: string | null;
  due: string | null;
  url: string;
};

export type JiraResult =
  | { ok: true; tasks: JiraTask[]; total: number; searchUrl: string; demo?: boolean }
  | { ok: false; reason: 'not_configured' | 'not_linked' | 'auth' | 'bad_link' | 'unavailable'; searchUrl?: string };

const MAX_TASKS = 50;
const TIMEOUT_MS = 8000;
const CACHE_MS = 60_000;
const cache = new Map<string, { at: number; result: JiraResult }>();

export function jiraConfig(env: Record<string, string | undefined> = process.env) {
  const base = env.JIRA_BASE_URL?.trim().replace(/\/+$/, '');
  const email = env.JIRA_EMAIL?.trim();
  const token = env.JIRA_API_TOKEN?.trim();
  if (!base || !email || !token || !/^https:\/\/[^/\s]+$/.test(base)) return null;
  return { base, email, token };
}

/** A link that opens the same search in Jira (works even when the API isn't configured). */
export function jiraSearchUrl(base: string, jql: string) {
  return `${base}/issues/?jql=${encodeURIComponent(jql)}`;
}

type RawIssue = {
  key?: string;
  fields?: {
    summary?: string;
    status?: { name?: string; statusCategory?: { key?: string } };
    assignee?: { displayName?: string } | null;
    duedate?: string | null;
  };
};

const CATEGORY_ORDER: JiraTask['category'][] = ['indeterminate', 'new', 'done'];

/** In progress first, then to do, then done; within each, soonest due first (no due date last). */
export function sortTasks(tasks: JiraTask[]): JiraTask[] {
  return [...tasks].sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
      (a.due ?? '9999').localeCompare(b.due ?? '9999')
  );
}

/** Jira's search response as plain tasks; anything malformed is skipped. */
export function mapIssues(base: string, issues: unknown): JiraTask[] {
  if (!Array.isArray(issues)) return [];
  return (issues as RawIssue[])
    .filter((i) => typeof i?.key === 'string' && i.fields)
    .map((i) => {
      const cat = i.fields!.status?.statusCategory?.key;
      return {
        key: i.key!,
        summary: i.fields!.summary ?? '(no summary)',
        status: i.fields!.status?.name ?? 'Unknown',
        category: cat === 'done' || cat === 'indeterminate' ? cat : 'new',
        assignee: i.fields!.assignee?.displayName ?? null,
        due: i.fields!.duedate ?? null,
        url: `${base}/browse/${encodeURIComponent(i.key!)}`,
      };
    });
}

/** The program's Jira tasks. Results are cached for a minute so pages stay fast. */
export async function fetchJiraTasks(
  link: { jira_epic?: string | null; jira_label?: string | null },
  { env = process.env, fetchImpl = fetch }: { env?: Record<string, string | undefined>; fetchImpl?: typeof fetch } = {}
): Promise<JiraResult> {
  const jql = buildJql(link);
  if (!jql) return { ok: false, reason: 'not_linked' };
  const config = jiraConfig(env);
  const base = config?.base ?? env.JIRA_BASE_URL?.trim().replace(/\/+$/, '');
  const searchUrl = base && /^https:\/\//.test(base) ? jiraSearchUrl(base, jql) : undefined;
  if (!config && jiraDemoEnabled(env)) return demoTasks(link);
  if (!config) return { ok: false, reason: 'not_configured', searchUrl };

  const hit = cache.get(jql);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.result;

  const url = `${config.base}/rest/api/3/search/jql?${new URLSearchParams({
    jql,
    fields: 'summary,status,assignee,duedate',
    maxResults: String(MAX_TASKS),
  })}`;
  let result: JiraResult;
  try {
    const res = await fetchImpl(url, {
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${Buffer.from(`${config.email}:${config.token}`).toString('base64')}`,
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    });
    if (res.status === 401 || res.status === 403) {
      result = { ok: false, reason: 'auth', searchUrl };
    } else if (res.status === 400) {
      // e.g. the epic key doesn't exist in this Jira site.
      result = { ok: false, reason: 'bad_link', searchUrl };
    } else if (!res.ok) {
      result = { ok: false, reason: 'unavailable', searchUrl };
    } else {
      const body = (await res.json()) as { issues?: unknown; total?: number; isLast?: boolean };
      const tasks = sortTasks(mapIssues(config.base, body.issues));
      result = { ok: true, tasks, total: typeof body.total === 'number' ? body.total : tasks.length, searchUrl: searchUrl! };
    }
  } catch (err) {
    console.error('Jira fetch failed:', err instanceof Error ? err.name : 'error');
    result = { ok: false, reason: 'unavailable', searchUrl };
  }
  cache.set(jql, { at: Date.now(), result });
  return result;
}

// ---------- Demo mode ----------

/**
 * JIRA_DEMO=true shows sample tasks, clearly labeled, so the feature can be shown before
 * Jira is connected. Ignored once real Jira settings exist, and never on Vercel production.
 */
export function jiraDemoEnabled(env: Record<string, string | undefined> = process.env) {
  return env.JIRA_DEMO === 'true' && env.VERCEL_ENV !== 'production';
}

const DEMO_TASKS: [summary: string, status: string, category: JiraTask['category'], assignee: string | null, dueInDays: number | null][] = [
  ['Book room and confirm the schedule with the partner', 'Done', 'done', 'Liz', -21],
  ['Build the session slides', 'Done', 'done', 'Jordan', -7],
  ['Order PLA filament and printer parts', 'In Progress', 'indeterminate', 'Marcus', 2],
  ['Collect photo releases from families', 'In Progress', 'indeterminate', 'Amara', 5],
  ['Print handouts for next session', 'To Do', 'new', 'Priya', 6],
  ['Send the recap and slides to the partner', 'To Do', 'new', 'Liz', 8],
  ['Plan the end-of-term showcase', 'To Do', 'new', null, 30],
];

/** Sample tasks for a linked program, keyed off its epic or label so each program looks its own. */
export function demoTasks(link: { jira_epic?: string | null; jira_label?: string | null }, today = new Date()): JiraResult {
  const project = link.jira_epic?.split('-')[0] ?? 'DEMO';
  const seed = [...(link.jira_epic ?? link.jira_label ?? '')].reduce((n, c) => n + c.charCodeAt(0), 0);
  const base = 'https://your-team.atlassian.net';
  const tasks = DEMO_TASKS.map(([summary, status, category, assignee, dueInDays], i) => {
    const key = `${project}-${100 + ((seed + i * 7) % 900)}`;
    const due = dueInDays == null ? null : new Date(today.getTime() + dueInDays * 86_400_000).toISOString().slice(0, 10);
    return { key, summary, status, category, assignee, due, url: `${base}/browse/${key}` };
  });
  const jql = buildJql(link) ?? '';
  return { ok: true, tasks: sortTasks(tasks), total: tasks.length, searchUrl: jiraSearchUrl(base, jql), demo: true };
}
