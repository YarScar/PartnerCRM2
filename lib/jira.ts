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
  | { ok: true; tasks: JiraTask[]; total: number; searchUrl: string }
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
      const tasks = mapIssues(config.base, body.issues);
      result = { ok: true, tasks, total: typeof body.total === 'number' ? body.total : tasks.length, searchUrl: searchUrl! };
    }
  } catch (err) {
    console.error('Jira fetch failed:', err instanceof Error ? err.name : 'error');
    result = { ok: false, reason: 'unavailable', searchUrl };
  }
  cache.set(jql, { at: Date.now(), result });
  return result;
}
