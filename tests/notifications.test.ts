/// <reference types="node" />

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../lib/email';
import { parseEmailList } from '../lib/notifications';

describe('parseEmailList', () => {
  it('merges comma lists, trims, lowercases and drops non-addresses', () => {
    assert.deepEqual(parseEmailList(' A@Org.org, admin ,b@org.org', undefined, 'c@org.org'), [
      'a@org.org',
      'b@org.org',
      'c@org.org',
    ]);
  });

  it('returns nothing for empty settings', () => {
    assert.deepEqual(parseEmailList(undefined, ''), []);
  });
});

describe('escapeHtml', () => {
  it('neutralizes markup typed into the public intake form', () => {
    assert.equal(
      escapeHtml('<a href="https://evil.example">Click</a> & \'x\''),
      '&lt;a href=&quot;https://evil.example&quot;&gt;Click&lt;/a&gt; &amp; &#39;x&#39;'
    );
    assert.equal(escapeHtml(undefined), '');
  });
});
