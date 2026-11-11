/**
 * How a program points at its Jira tasks: an epic key ("CA-12") or a label ("geo-club-2026").
 * Pure checks and JQL building, shared by the form validation and the Jira client. Only
 * values matching these patterns ever reach a JQL query, so nothing typed into the form
 * can change the query's meaning.
 */

const EPIC_KEY = /^[A-Z][A-Z0-9_]{0,9}-\d{1,7}$/;
// Jira labels can't contain spaces; keep to the characters people actually use.
const LABEL = /^[A-Za-z0-9_.-]{1,100}$/;

export function cleanEpicKey(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  if (typeof v !== 'string') throw new Error('must be text');
  const key = v.trim().toUpperCase();
  if (!key) return null;
  if (!EPIC_KEY.test(key)) throw new Error('must be an issue key like CA-12');
  return key;
}

export function cleanLabel(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  if (typeof v !== 'string') throw new Error('must be text');
  const label = v.trim();
  if (!label) return null;
  if (!LABEL.test(label)) throw new Error('must be one word: letters, numbers, - _ or . (no spaces)');
  return label;
}

/** The JQL for a program's tasks, or null when it isn't linked. The app sorts them by status itself. */
export function buildJql(link: { jira_epic?: string | null; jira_label?: string | null }): string | null {
  const parts: string[] = [];
  if (link.jira_epic && EPIC_KEY.test(link.jira_epic)) parts.push(`parent = ${link.jira_epic}`);
  if (link.jira_label && LABEL.test(link.jira_label)) parts.push(`labels = "${link.jira_label}"`);
  if (parts.length === 0) return null;
  return `(${parts.join(' OR ')}) ORDER BY duedate ASC, updated DESC`;
}
