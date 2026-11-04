/// <reference types="node" />

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  agesOverlap,
  categoryChoices,
  cleanTags,
  formatAges,
  suggestActivities,
  validateActivity,
  validateActivityList,
  validateProgram,
  validateRun,
} from '../lib/programs';

const error = (r: { ok: boolean; error?: string }) => (r.ok ? '' : r.error ?? '');

describe('validateProgram', () => {
  it('cleans a normal program', () => {
    const r = validateProgram({ name: '  3D Printing ', goals: 'Teamwork, design thinking, teamwork', age_min: '8', age_max: 12 });
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.data.name, '3D Printing');
      assert.deepEqual(r.data.goals, ['Teamwork', 'design thinking']);
      assert.equal(r.data.age_min, 8);
      assert.equal(r.data.age_max, 12);
    }
  });

  it('needs a name, sane ages and real numbers', () => {
    assert.match(error(validateProgram({})), /Name is required/);
    assert.match(error(validateProgram({ name: 'x', age_min: 14, age_max: 10 })), /Youngest age/);
    assert.match(error(validateProgram({ name: 'x', age_min: 'ten' })), /Youngest age must be a whole number/);
    assert.match(error(validateProgram({ name: 'x', goals: ['y'.repeat(41)] })), /Goals/);
    assert.match(error(validateProgram('nope')), /object/);
  });

  it('a partial update only touches what was sent, and can clear a field', () => {
    const r = validateProgram({ description: null }, { partial: true });
    assert.deepEqual(r, { ok: true, data: { description: null } });
    assert.match(error(validateProgram({ name: '  ' }, { partial: true })), /Name is required/);
  });
});

describe('validateActivity', () => {
  it('keeps based_on only when creating', () => {
    const created = validateActivity({ name: 'Marshmallow tower', based_on_id: 4, duration_minutes: '30' });
    assert.equal(created.ok && created.data.based_on_id, 4);
    assert.equal(created.ok && created.data.duration_minutes, 30);
    const edited = validateActivity({ name: 'Marshmallow tower', based_on_id: 4 }, { partial: true });
    assert.equal(edited.ok && 'based_on_id' in edited.data, false);
  });

  it('refuses a zero-minute activity', () => {
    assert.match(error(validateActivity({ name: 'x', duration_minutes: 0 })), /Length/);
  });
});

describe('validateRun', () => {
  it('needs a program and a name when created', () => {
    assert.match(error(validateRun({ name: 'Spring' })), /Program is required/);
    assert.match(error(validateRun({ program_id: 1 })), /Name is required/);
  });

  it('checks status and dates', () => {
    assert.match(error(validateRun({ program_id: 1, name: 'x', status: 'Done' })), /Status must be one of/);
    assert.match(error(validateRun({ program_id: 1, name: 'x', start_date: '2027-02-30' })), /real date/);
    assert.match(error(validateRun({ program_id: 1, name: 'x', start_date: '03/01/2027' })), /YYYY-MM-DD/);
    assert.match(error(validateRun({ program_id: 1, name: 'x', start_date: '2027-03-10', end_date: '2027-03-01' })), /End date/);
    const ok = validateRun({ program_id: 1, name: 'x', start_date: '2027-03-01', partner_id: '' });
    assert.equal(ok.ok, true);
    if (ok.ok) {
      assert.equal(ok.data.start_date?.toISOString().slice(0, 10), '2027-03-01');
      assert.equal(ok.data.partner_id, null);
      assert.equal('age_min' in ok.data, false, 'unsent ages stay unset so the program ages apply');
    }
  });

  it('cannot move a run to another program', () => {
    const r = validateRun({ program_id: 9, name: 'x' }, { partial: true });
    assert.equal(r.ok && 'program_id' in r.data, false);
  });
});

describe('validateActivityList', () => {
  it('keeps the order and notes only for runs', () => {
    assert.deepEqual(validateActivityList([{ activity_id: 3, notes: 'shorter' }, { activity_id: '1' }]), {
      ok: true,
      data: [
        { activity_id: 3, notes: null },
        { activity_id: 1, notes: null },
      ],
    });
    const run = validateActivityList([{ activity_id: 3, notes: ' shorter ' }], { withNotes: true });
    assert.equal(run.ok && run.data[0].notes, 'shorter');
  });

  it('refuses duplicates and bad ids', () => {
    assert.match(error(validateActivityList([{ activity_id: 1 }, { activity_id: 1 }])), /twice/);
    assert.match(error(validateActivityList([{ activity_id: 'x' }])), /Activity/);
    assert.match(error(validateActivityList([{}])), /needs an id/);
    assert.match(error(validateActivityList({})), /list/);
  });
});

describe('ages', () => {
  it('formats ranges', () => {
    assert.equal(formatAges(8, 12), '8–12');
    assert.equal(formatAges(10, 10), '10');
    assert.equal(formatAges(14, null), '14+');
    assert.equal(formatAges(null, 7), 'up to 7');
    assert.equal(formatAges(null, null), null);
  });

  it('treats a missing end as open', () => {
    assert.equal(agesOverlap(8, 12, 10, 14), true);
    assert.equal(agesOverlap(8, 12, 13, 18), false);
    assert.equal(agesOverlap(null, null, 5, 6), true);
    assert.equal(agesOverlap(14, null, null, 12), false);
  });
});

describe('suggestActivities', () => {
  const lib = [
    { id: 1, name: 'Toddler tower', goals: ['Teamwork'], age_min: 3, age_max: 5 },
    { id: 2, name: 'Bridge build', goals: ['Teamwork', 'Engineering'], age_min: 8, age_max: 14 },
    { id: 3, name: 'Name game', goals: ['Icebreaking'], age_min: null, age_max: null },
    { id: 4, name: 'Design sprint', goals: ['engineering'], age_min: 12, age_max: null },
    { id: 5, name: 'Already added', goals: ['Teamwork'], age_min: null, age_max: null },
  ];

  it('ranks by shared goals, leaves out ages that do not fit, and says why', () => {
    const out = suggestActivities(lib, { age_min: 10, age_max: 13, goals: ['teamwork', 'Engineering'] }, { exclude: [5] });
    assert.deepEqual(out.map((s) => s.activity.id), [2, 4]);
    assert.deepEqual(out[0].reasons, ['Goals: Teamwork, Engineering', 'Ages 8–14 fit']);
  });

  it('with no goals, only known age fits come up', () => {
    const out = suggestActivities(lib, { age_min: 4, age_max: 4 });
    assert.deepEqual(out.map((s) => s.activity.id), [1]);
  });

  it('with nothing to go on, suggests nothing', () => {
    assert.deepEqual(suggestActivities(lib, {}), []);
  });
});

describe('cleanTags and categoryChoices', () => {
  it('dedupes ignoring case', () => {
    assert.deepEqual(cleanTags(['A', ' a ', 'B  c', 3]), ['A', 'B c']);
    assert.throws(() => cleanTags(Array.from({ length: 21 }, (_, i) => `g${i}`)), /no more than 20/);
    assert.deepEqual(categoryChoices(['icebreaker', 'Zoom game']).slice(0, 3), ['Demo', 'Design challenge', 'Group project']);
    assert.equal(categoryChoices(['icebreaker']).filter((c) => c.toLowerCase() === 'icebreaker').length, 1);
  });
});
