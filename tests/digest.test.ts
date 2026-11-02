/// <reference types="node" />

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderDigest } from '../lib/digest';

describe('renderDigest', () => {
  const input = {
    newIntakes: [{ organizationName: 'Bright <b>Futures</b>', contactName: 'Jane', createdAt: new Date('2026-08-06') }],
    statusChanges: [
      { organizationName: 'Northside Youth', contactName: 'Sam', status: 'Active Partner', updatedAt: new Date('2026-08-06') },
    ],
    upcomingTimelines: [],
    quietPartners: [{ organizationName: 'Eastside Group', contactName: 'Dana', lastNoteAt: null }],
    totalActive: 3,
  };

  it('lists each section with counts and says when a section is empty', () => {
    const { text } = renderDigest(input);
    assert.match(text, /New inquiries this week \(1\)\n- Bright <b>Futures<\/b> — Jane/);
    assert.match(text, /Northside Youth — Active Partner/);
    assert.match(text, /Timelines in the next 30 days \(0\)\nNothing to report this week\./);
    assert.match(text, /Eastside Group — no notes yet/);
    assert.match(text, /Total active partners: 3$/);
  });

  it('escapes partner values in the HTML', () => {
    const { html } = renderDigest(input);
    assert.ok(html.includes('Bright &lt;b&gt;Futures&lt;/b&gt;'));
    assert.ok(!html.includes('<b>Futures'));
  });
});
