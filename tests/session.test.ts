/// <reference types="node" />

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { allowedBeforePasswordChange, createSessionToken, getSessionFromToken } from '../lib/auth';
import { parseId } from '../lib/parseId';

describe('session tokens', () => {
  const user = { username: 'jose', displayName: 'José Nguyễn', role: 'admin' as const };

  it('round-trips a user, including non-ASCII names', async () => {
    const token = await createSessionToken(user);
    assert.deepEqual(await getSessionFromToken(token), { ...user, email: undefined, mustChangePassword: false });
  });

  it('carries the temporary-password flag', async () => {
    const token = await createSessionToken({ ...user, mustChangePassword: true });
    assert.equal((await getSessionFromToken(token))?.mustChangePassword, true);
  });

  it('rejects tampered, garbage and missing tokens', async () => {
    const token = await createSessionToken(user);
    const [payload, signature] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ ...user, role: 'admin', username: 'x', exp: Date.now() + 1e9 }))
      .toString('base64url');
    assert.equal(await getSessionFromToken(`${forged}.${signature}`), null);
    assert.equal(await getSessionFromToken(`${payload}.not*base64`), null);
    assert.equal(await getSessionFromToken('garbage'), null);
    assert.equal(await getSessionFromToken(undefined), null);
  });
});

describe('allowedBeforePasswordChange', () => {
  it('only lets a temporary-password user reach Settings and sign out', () => {
    assert.equal(allowedBeforePasswordChange('/settings'), true);
    assert.equal(allowedBeforePasswordChange('/api/account/change-password'), true);
    assert.equal(allowedBeforePasswordChange('/api/auth/logout'), true);
    assert.equal(allowedBeforePasswordChange('/dashboard'), false);
    assert.equal(allowedBeforePasswordChange('/api/partners'), false);
    assert.equal(allowedBeforePasswordChange('/admin'), false);
  });
});

describe('parseId', () => {
  it('accepts positive integers only', () => {
    assert.equal(parseId('12'), 12);
    assert.equal(parseId('0'), null);
    assert.equal(parseId('12abc'), null);
    assert.equal(parseId('abc'), null);
    assert.equal(parseId('-3'), null);
    assert.equal(parseId('9999999999'), null);
  });
});
