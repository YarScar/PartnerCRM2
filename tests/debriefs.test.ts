/// <reference types="node" />

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { debriefStatus, validateDebrief, validateRun } from '../lib/programs';
import { debriefsDue, groupRunsByPartner } from '../lib/programGroups';
import type { RunListing } from '../lib/programsData';

const error = (r: { ok: boolean; error?: string }) => (r.ok ? '' : r.error ?? '');
const d = (s: string) => new Date(`${s}T00:00:00Z`);

describe('validateDebrief', () => {
  it('keeps the answers and trims them', () => {
    const r = validateDebrief({ attendance: '14', engagement: 4, went_well: ' Map walk ', follow_ups: '' });
    assert.deepEqual(r, {
      ok: true,
      data: { attendance: 14, engagement: 4, went_well: 'Map walk', to_improve: null, changes_next_time: null, highlights: null, follow_ups: null },
    });
  });

  it('refuses an empty debrief and out-of-range ratings', () => {
    assert.match(error(validateDebrief({ went_well: '  ' })), /at least one/);
    assert.match(error(validateDebrief({ engagement: 6 })), /Engagement/);
    assert.match(error(validateDebrief({ attendance: -1 })), /Attendance/);
  });
});

describe('debriefStatus', () => {
  it('is due on or after the session day, upcoming before, done once written', () => {
    assert.equal(debriefStatus(d('2026-11-10'), false, '2026-11-11'), 'due');
    assert.equal(debriefStatus(d('2026-11-11'), false, '2026-11-11'), 'due');
    assert.equal(debriefStatus(d('2026-11-12'), false, '2026-11-11'), 'upcoming');
    assert.equal(debriefStatus(d('2026-11-10'), true, '2026-11-11'), 'done');
  });
});

describe('add a program with a new library program', () => {
  it('takes a library program or a new name, not neither or both', () => {
    assert.equal(validateRun({ new_program_name: '3D Design Club', name: '2026–2027', partner_id: 2 }).ok, true);
    assert.match(error(validateRun({ name: '2026–2027' })), /Choose a program or name a new one/);
    assert.match(error(validateRun({ program_id: 1, new_program_name: 'X', name: 'y' })), /not both/);
  });
});

describe('groupRunsByPartner', () => {
  const run = (id: number, partner: { id: number; org_name: string } | null, status: string, sessions: [string, boolean][]): RunListing =>
    ({
      id,
      name: `run ${id}`,
      status,
      partner,
      program: { id: 1, name: 'Club' },
      sessions: sessions.map(([date, debriefed], i) => ({ id: id * 10 + i, date: d(date), title: null, debrief: debriefed ? { id: 1 } : null })),
    }) as unknown as RunListing;
  const launchpad = { id: 1, org_name: 'Launchpad' };
  const abc = { id: 2, org_name: 'ABC Library' };

  it('groups by partner A–Z with our own last, splits current and past, counts debriefs due', () => {
    const groups = groupRunsByPartner(
      [
        run(1, launchpad, 'Active', [['2026-11-04', true], ['2026-11-11', false], ['2026-11-18', false]]),
        run(2, launchpad, 'Completed', [['2026-03-04', false]]),
        run(3, null, 'Planned', []),
        run(4, abc, 'Active', [['2026-11-01', false]]),
      ],
      '2026-11-11'
    );
    assert.deepEqual(groups.map((g) => g.name), ['ABC Library', 'Launchpad', 'Our own programs']);
    const lp = groups[1];
    assert.deepEqual([lp.current.length, lp.past.length, lp.debriefsDue], [1, 1, 1], 'past programs do not count as due');
    assert.equal(lp.nextSession?.toISOString().slice(0, 10), '2026-11-11');
    assert.equal(debriefsDue(run(5, null, 'Active', [['2026-11-12', false]]), '2026-11-11'), 0);
  });
});
