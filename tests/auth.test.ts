/// <reference types="node" />

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'crypto';
import { hashPassword, verifyPassword } from '../lib/auth';

describe('auth password helpers', () => {
  it('hashes with bcrypt and verifies passwords', async () => {
    const password = 'StrongPassword123!';
    const hash = await hashPassword(password);

    assert.ok(hash.startsWith('$2'));
    assert.equal(await verifyPassword(password, hash), true);
    assert.equal(await verifyPassword('wrong-password', hash), false);
  });

  it('accepts legacy sha256 hashes for compatibility', async () => {
    const password = 'LegacyPassword123!';
    const legacyHash = createHash('sha256').update(password).digest('base64');

    assert.equal(await verifyPassword(password, legacyHash), true);
    assert.equal(await verifyPassword('wrong-password', legacyHash), false);
  });
});
