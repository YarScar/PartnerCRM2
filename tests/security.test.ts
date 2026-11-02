/// <reference types="node" />

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getAuthSecret } from '../lib/auth';
import { hashResetToken } from '../lib/resetToken';
import { checkIntake, MAX_INTAKE_BYTES } from '../lib/intakeValidation';

describe('getAuthSecret', () => {
  const strong = 'x'.repeat(32);

  it('uses a strong AUTH_SECRET', () => {
    assert.equal(getAuthSecret({ AUTH_SECRET: strong, NODE_ENV: 'production' }), strong);
  });

  it('refuses to run in production without a strong secret', () => {
    assert.throws(() => getAuthSecret({ NODE_ENV: 'production' }), /AUTH_SECRET/);
    assert.throws(() => getAuthSecret({ AUTH_SECRET: 'short', NODE_ENV: 'production' }), /AUTH_SECRET/);
  });

  it('allows the dev fallback outside production', () => {
    assert.ok(getAuthSecret({ NODE_ENV: 'development' }).length > 0);
  });
});

describe('hashResetToken', () => {
  it('stores a hash, not the token, and is stable', () => {
    const token = 'abc123';
    assert.notEqual(hashResetToken(token), token);
    assert.equal(hashResetToken(token), hashResetToken(token));
    assert.match(hashResetToken(token), /^[0-9a-f]{64}$/);
  });
});

describe('checkIntake', () => {
  it('accepts a normal submission and strips server-owned fields', () => {
    const result = checkIntake(
      JSON.stringify({ org_name: 'Northside Youth', contact_email: 'a@b.org', status: 'Active Partner', id: 7, company_website: '' })
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.org_name, 'Northside Youth');
      assert.equal(result.data.status, undefined);
      assert.equal(result.data.id, undefined);
      assert.equal(result.data.company_website, undefined);
    }
  });

  it('flags the honeypot as spam', () => {
    const result = checkIntake(JSON.stringify({ org_name: 'Bot', company_website: 'http://spam.example' }));
    assert.deepEqual(result, { ok: false, spam: true });
  });

  it('rejects missing names, long answers, oversize bodies and bad JSON', () => {
    assert.deepEqual(checkIntake(JSON.stringify({ org_name: '  ' })).ok, false);
    const long = checkIntake(JSON.stringify({ org_name: 'Org', intake_message: 'x'.repeat(5001) }));
    assert.equal(!long.ok && 'status' in long && long.status, 400);
    const big = checkIntake(JSON.stringify({ org_name: 'Org', a: 'x'.repeat(MAX_INTAKE_BYTES) }));
    assert.equal(!big.ok && 'status' in big && big.status, 413);
    const bad = checkIntake('{not json');
    assert.equal(!bad.ok && 'status' in bad && bad.status, 400);
  });
});
