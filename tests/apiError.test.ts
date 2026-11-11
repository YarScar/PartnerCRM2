/// <reference types="node" />

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { apiError, isDatabaseUnavailable } from '../lib/apiError';

const quiet = <T>(fn: () => T): T => {
  const original = console.error;
  console.error = () => {};
  try {
    return fn();
  } finally {
    console.error = original;
  }
};

describe('apiError', () => {
  it('answers 503 with a plain message when the database is down', async () => {
    const down = new Prisma.PrismaClientInitializationError("Can't reach database server at `x:5432`", '6.12.0');
    assert.equal(isDatabaseUnavailable(down), true);
    const res = quiet(() => apiError(down));
    assert.equal(res.status, 503);
    assert.match((await res.json()).error, /database is unavailable/);
  });

  it('treats connection error codes as an outage, other database errors as 500', async () => {
    const login = new Prisma.PrismaClientKnownRequestError('Authentication failed', { code: 'P1000', clientVersion: '6.12.0' });
    const unique = new Prisma.PrismaClientKnownRequestError('Unique constraint', { code: 'P2002', clientVersion: '6.12.0' });
    assert.equal(isDatabaseUnavailable(login), true);
    assert.equal(isDatabaseUnavailable(unique), false);
    const res = quiet(() => apiError(unique));
    assert.equal(res.status, 500);
    assert.deepEqual(await res.json(), { error: 'Internal server error' });
  });

  it('keeps ordinary errors at 500 without details', async () => {
    const res = quiet(() => apiError(new Error('secret detail')));
    assert.equal(res.status, 500);
    assert.deepEqual(await res.json(), { error: 'Internal server error' });
  });
});
