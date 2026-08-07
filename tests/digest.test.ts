/// <reference types="node" />

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeDigestForAI } from '../lib/digest';

describe('sanitizeDigestForAI', () => {
  it('removes identifying names and keeps only aggregated counts', () => {
    const input = {
      newIntakes: [{ organizationName: 'Bright Futures', contactName: 'Jane', createdAt: new Date('2026-08-06') }],
      statusChanges: [
        { organizationName: 'Bright Futures', contactName: 'Jane', status: 'Active Partner', updatedAt: new Date('2026-08-06') },
        { organizationName: 'Northside Youth', contactName: 'Sam', status: 'Pending Intake', updatedAt: new Date('2026-08-06') },
      ],
      upcomingTimelines: [{ organizationName: 'Northside Youth', contactName: 'Sam', timeline: '2026-08-15', firmDates: '2026-08-15' }],
      quietPartners: [{ organizationName: 'Eastside Group', contactName: 'Dana', lastNoteAt: null }],
      totalActive: 3,
    };

    const output = sanitizeDigestForAI(input as any);

    assert.equal(output.newIntakesCount, 1);
    assert.equal(output.statusChangesCount, 2);
    assert.equal(output.upcomingTimelineCount, 1);
    assert.equal(output.quietPartnersCount, 1);
    assert.equal(output.totalActive, 3);
    assert.deepEqual(output.statusChangeSummary, [
      { status: 'Active Partner', count: 1 },
      { status: 'Pending Intake', count: 1 },
    ]);
    assert.ok(!JSON.stringify(output).includes('Bright Futures'));
    assert.ok(!JSON.stringify(output).includes('Jane'));
  });
});
