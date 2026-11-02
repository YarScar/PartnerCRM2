/// <reference types="node" />

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml } from '../lib/email';
import { isCronRequest } from '../lib/cron';
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

describe('isCronRequest', () => {
  it('accepts only the exact bearer secret', () => {
    assert.equal(isCronRequest('Bearer s3cret', 's3cret'), true);
    assert.equal(isCronRequest('Bearer wrong!', 's3cret'), false);
    assert.equal(isCronRequest('s3cret', 's3cret'), false);
    assert.equal(isCronRequest(null, 's3cret'), false);
  });

  it('refuses every call when no secret is configured', () => {
    assert.equal(isCronRequest('Bearer ', ''), false);
    assert.equal(isCronRequest('Bearer undefined', undefined), false);
  });
});
