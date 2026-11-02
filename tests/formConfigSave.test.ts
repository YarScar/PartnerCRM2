/// <reference types="node" />

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { storedOptions, uniqueId, validateFormSections } from '../lib/formConfigSave';

const field = (over: Record<string, unknown> = {}) => ({
  id: 'org_name',
  label: 'Organization Name',
  type: 'text',
  visible: true,
  required: true,
  ...over,
});

describe('validateFormSections', () => {
  it('accepts a normal form and normalizes options', () => {
    const result = validateFormSections([
      {
        id: 'org',
        label: ' Organization ',
        fields: [field(), field({ id: 'type', label: 'Type', type: 'select', options: { items: ['A', ' ', 'B'], meta: {} } })],
      },
    ]);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.sections[0].label, 'Organization');
      assert.deepEqual(result.sections[0].fields[1].options, ['A', 'B']);
      assert.equal(result.sections[0].fields[1].sort_order, 1);
    }
  });

  it('accepts an empty form (every section deleted)', () => {
    assert.deepEqual(validateFormSections([]), { ok: true, sections: [] });
  });

  it('refuses blank names, duplicates, bad ids and unknown types with a message', () => {
    const bad = (input: unknown) => {
      const r = validateFormSections(input);
      assert.equal(r.ok, false);
      return r.ok ? '' : r.error;
    };
    assert.match(bad({}), /list of sections/);
    assert.match(bad([{ id: 'a', label: '  ', fields: [] }]), /needs a name/);
    assert.match(bad([{ id: 'a', label: 'A', fields: [] }, { id: 'a', label: 'A', fields: [] }]), /Two sections/);
    assert.match(bad([{ id: 'a', label: 'A', fields: [field(), field()] }]), /two fields named/);
    assert.match(bad([{ id: 'a', label: 'A', fields: [field({ label: '' })] }]), /needs a name/);
    assert.match(bad([{ id: 'a', label: 'A', fields: [field({ id: 'Bad Id' })] }]), /invalid id/);
    assert.match(bad([{ id: 'a', label: 'A', fields: [field({ type: 'date' })] }]), /unknown type/);
  });
});

describe('storedOptions', () => {
  const f = (options: string[]) => ({ ...field(), type: 'select' as const, options, sort_order: 0, visible: true, required: false });
  it('keeps choices and the partner-form public flag', () => {
    assert.deepEqual(storedOptions(f(['A']), true), { items: ['A'], meta: { public: true } });
    assert.deepEqual(storedOptions(f([]), false), { meta: { public: false } });
    assert.deepEqual(storedOptions(f(['A']), undefined), ['A']);
    assert.equal(storedOptions(f([]), undefined), undefined);
  });
});

describe('uniqueId', () => {
  it('makes a new id from the label without clashing', () => {
    assert.equal(uniqueId('Contact Email', []), 'contact_email');
    assert.equal(uniqueId('Contact Email', ['contact_email']), 'contact_email_2');
    assert.equal(uniqueId('Contact Email', ['contact_email', 'contact_email_2']), 'contact_email_3');
    assert.equal(uniqueId('!!!', []), 'field');
  });
});
