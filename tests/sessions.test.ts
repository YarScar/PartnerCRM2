/// <reference types="node" />

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanNames, formatDate, formatTime, formatTimeRange, isPastRun, splitLinks, validateSession } from '../lib/programs';

const error = (r: { ok: boolean; error?: string }) => (r.ok ? '' : r.error ?? '');

describe('validateSession', () => {
  it('accepts a filled-in session like the doc template', () => {
    const r = validateSession({
      run_id: 3,
      date: '2026-02-01',
      start_time: '15:30',
      end_time: '17:00',
      arrival_time: '15:00',
      location: ' Launchpad HQ ',
      creator_count: '18',
      development_team: ['Liz', 'Sam', 'liz'],
      facilitation_team: 'Ana, Jo',
      planning_doc_url: 'https://drive.google.com/x',
      tasks: [{ text: 'Print handouts', done: true }, { text: '  ' }, { text: 'Charge laptops' }],
    });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.data.date?.toISOString().slice(0, 10), '2026-02-01');
      assert.equal(r.data.location, 'Launchpad HQ');
      assert.equal(r.data.creator_count, 18);
      assert.deepEqual(r.data.development_team, ['Liz', 'Sam']);
      assert.deepEqual(r.data.facilitation_team, ['Ana', 'Jo']);
      assert.deepEqual(r.data.tasks, [
        { text: 'Print handouts', done: true },
        { text: 'Charge laptops', done: false },
      ]);
    }
  });

  it('needs a run and a date when created', () => {
    assert.match(error(validateSession({ date: '2026-02-01' })), /Run is required/);
    assert.match(error(validateSession({ run_id: 1 })), /Date is required/);
  });

  it('checks times and links', () => {
    const base = { run_id: 1, date: '2026-02-01' };
    assert.match(error(validateSession({ ...base, start_time: '3:30pm' })), /HH:MM/);
    assert.match(error(validateSession({ ...base, start_time: '17:00', end_time: '15:00' })), /end time must be after/);
    assert.match(error(validateSession({ ...base, slides_url: 'javascript:alert(1)' })), /https/);
    assert.match(error(validateSession({ ...base, slides_url: 'drive.google.com/x' })), /https/);
    assert.equal(validateSession({ ...base, slides_url: '' }).ok, true);
  });

  it('a partial update can just tick tasks, and never moves the session to another run', () => {
    const r = validateSession({ tasks: [{ text: 'A', done: true }], run_id: 9 }, { partial: true });
    assert.deepEqual(r, { ok: true, data: { tasks: [{ text: 'A', done: true }] } });
    assert.match(error(validateSession({ date: '' }, { partial: true })), /Date is required/);
  });
});

describe('session display helpers', () => {
  it('formats times and dates', () => {
    assert.equal(formatTime('15:30'), '3:30 PM');
    assert.equal(formatTime('00:05'), '12:05 AM');
    assert.equal(formatTime('12:00'), '12:00 PM');
    assert.equal(formatTimeRange('15:30', '17:00'), '3:30 PM – 5:00 PM');
    assert.equal(formatTimeRange(null, null), null);
    assert.equal(formatDate(new Date('2026-02-01T00:00:00Z')), 'Sun, Feb 1, 2026');
  });

  it('turns other-docs lines into links when they hold one', () => {
    assert.deepEqual(splitLinks('Rubric https://docs.google.com/a\n\nAsk Jo for the roster'), [
      { text: 'Rubric https://docs.google.com/a', href: 'https://docs.google.com/a' },
      { text: 'Ask Jo for the roster', href: null },
    ]);
  });

  it('Completed and Cancelled runs are past', () => {
    assert.equal(isPastRun('Completed'), true);
    assert.equal(isPastRun('Cancelled'), true);
    assert.equal(isPastRun('Active'), false);
    assert.equal(isPastRun('Planned'), false);
  });

  it('caps team size', () => {
    assert.throws(() => cleanNames(Array.from({ length: 31 }, (_, i) => `P${i}`)), /no more than 30/);
  });
});
