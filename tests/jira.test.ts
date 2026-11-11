/// <reference types="node" />

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildJql, cleanEpicKey, cleanLabel } from '../lib/jiraRefs';
import { fetchJiraTasks, jiraConfig, mapIssues } from '../lib/jira';
import { validateRun } from '../lib/programs';

const env = { JIRA_BASE_URL: 'https://createaccess.atlassian.net/', JIRA_EMAIL: 'bot@example.org', JIRA_API_TOKEN: 'secret-token' };
const issue = (key: string, cat: string, extra: object = {}) => ({
  key,
  fields: { summary: `Task ${key}`, status: { name: cat === 'done' ? 'Done' : 'To Do', statusCategory: { key: cat } }, assignee: { displayName: 'Liz' }, duedate: '2026-11-20', ...extra },
});
const fakeFetch = (status: number, body: unknown, seen: { url?: string; auth?: string } = {}) =>
  (async (url: string | URL | Request, init?: RequestInit) => {
    seen.url = String(url);
    seen.auth = (init?.headers as Record<string, string>)?.Authorization;
    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch;

describe('Jira links', () => {
  it('accepts an epic key or a one-word label, nothing that could change the query', () => {
    assert.equal(cleanEpicKey(' ca-12 '), 'CA-12');
    assert.equal(cleanEpicKey(''), null);
    assert.throws(() => cleanEpicKey('CA-12 OR project = HR'), /issue key/);
    assert.equal(cleanLabel('geo-club-2026'), 'geo-club-2026');
    assert.throws(() => cleanLabel('geo club'), /no spaces/);
    assert.throws(() => cleanLabel('x" OR labels = "y'), /no spaces/);
  });

  it('builds JQL from what is set', () => {
    assert.equal(buildJql({}), null);
    assert.equal(buildJql({ jira_epic: 'CA-12' }), '(parent = CA-12) ORDER BY statusCategory ASC, duedate ASC, updated DESC');
    assert.match(buildJql({ jira_epic: 'CA-12', jira_label: 'geo' })!, /^\(parent = CA-12 OR labels = "geo"\)/);
    assert.equal(buildJql({ jira_epic: 'bad key' }), null, 'unchecked values never reach JQL');
  });

  it('is part of the program form', () => {
    const r = validateRun({ jira_epic: 'ca-7', jira_label: '' }, { partial: true });
    assert.deepEqual(r, { ok: true, data: { jira_epic: 'CA-7', jira_label: null } });
    assert.equal(validateRun({ jira_label: 'two words' }, { partial: true }).ok, false);
  });
});

describe('Jira client', () => {
  it('needs all three settings and an https site', () => {
    assert.equal(jiraConfig({})?.base, undefined);
    assert.equal(jiraConfig({ ...env, JIRA_BASE_URL: 'http://x.atlassian.net' }), null);
    assert.equal(jiraConfig(env)?.base, 'https://createaccess.atlassian.net');
  });

  it('maps issues, skipping malformed ones', () => {
    const tasks = mapIssues('https://j.example', [issue('CA-1', 'indeterminate'), { nope: true }, issue('CA-2', 'weird', { assignee: null })]);
    assert.deepEqual(
      tasks.map((t) => [t.key, t.category, t.assignee, t.url]),
      [
        ['CA-1', 'indeterminate', 'Liz', 'https://j.example/browse/CA-1'],
        ['CA-2', 'new', null, 'https://j.example/browse/CA-2'],
      ]
    );
  });

  it('reports why when it can’t show tasks', async () => {
    assert.equal((await fetchJiraTasks({}, { env })).ok, false);
    const notConfigured = await fetchJiraTasks({ jira_epic: 'CA-90' }, { env: { JIRA_BASE_URL: env.JIRA_BASE_URL } });
    assert.equal(!notConfigured.ok && notConfigured.reason, 'not_configured');
    assert.match(!notConfigured.ok ? notConfigured.searchUrl ?? '' : '', /^https:\/\/createaccess\.atlassian\.net\/issues\/\?jql=/);
    const auth = await fetchJiraTasks({ jira_epic: 'CA-91' }, { env, fetchImpl: fakeFetch(401, {}) });
    assert.equal(!auth.ok && auth.reason, 'auth');
    const bad = await fetchJiraTasks({ jira_epic: 'CA-92' }, { env, fetchImpl: fakeFetch(400, {}) });
    assert.equal(!bad.ok && bad.reason, 'bad_link');
    const down = await fetchJiraTasks({ jira_epic: 'CA-93' }, { env, fetchImpl: (async () => { throw new Error('ECONNRESET'); }) as typeof fetch });
    assert.equal(!down.ok && down.reason, 'unavailable');
  });

  it('reads tasks with basic auth and caches them for a minute', async () => {
    const seen: { url?: string; auth?: string } = {};
    let calls = 0;
    const counting = (async (u: string | URL | Request, i?: RequestInit) => {
      calls++;
      return fakeFetch(200, { issues: [issue('CA-5', 'new'), issue('CA-6', 'done')], total: 2 }, seen)(u, i);
    }) as typeof fetch;
    const first = await fetchJiraTasks({ jira_label: 'geo-club-2026' }, { env, fetchImpl: counting });
    assert.equal(first.ok && first.tasks.length, 2);
    assert.match(seen.url!, /\/rest\/api\/3\/search\/jql\?jql=/);
    assert.equal(seen.auth, `Basic ${Buffer.from('bot@example.org:secret-token').toString('base64')}`);
    await fetchJiraTasks({ jira_label: 'geo-club-2026' }, { env, fetchImpl: counting });
    assert.equal(calls, 1, 'second call within a minute comes from the cache');
  });
});
