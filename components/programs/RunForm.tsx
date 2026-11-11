'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { RUN_STATUSES } from '@/lib/programs';
import { useSave } from './useSave';

export type RunFormValues = {
  id?: number;
  program_id: string;
  partner_id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  location: string;
  age_min: string;
  age_max: string;
  participant_count: string;
  what_changed: string;
  notes: string;
  jira_epic?: string;
  jira_label?: string;
};

type Option = { id: number; name: string };

/** The "+ New program…" choice: the program is created in the library with the run. */
const NEW_PROGRAM = 'new';

export function RunForm({
  initial,
  programs,
  partners,
}: {
  initial: RunFormValues;
  programs: Option[];
  partners: Option[];
}) {
  const [v, setV] = useState<RunFormValues>(initial);
  const [newProgramName, setNewProgramName] = useState('');
  const { saving, error, send } = useSave();
  const creatingProgram = v.program_id === NEW_PROGRAM;
  const set = (patch: Partial<RunFormValues>) => setV((cur) => ({ ...cur, ...patch }));
  const editing = Boolean(v.id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const blankToNull = (s: string) => (s === '' ? null : s);
    const body = {
      ...v,
      program_id: editing || creatingProgram ? undefined : v.program_id,
      new_program_name: !editing && creatingProgram ? newProgramName : undefined,
      partner_id: blankToNull(v.partner_id),
      start_date: blankToNull(v.start_date),
      end_date: blankToNull(v.end_date),
      participant_count: blankToNull(v.participant_count),
      // On a new run, blank ages mean "use the program's ages".
      age_min: v.age_min === '' ? (editing ? null : undefined) : v.age_min,
      age_max: v.age_max === '' ? (editing ? null : undefined) : v.age_max,
    };
    const data = editing ? await send(`/api/runs/${v.id}`, 'PATCH', body) : await send('/api/runs', 'POST', body);
    if (data) window.location.assign(`/runs/${data.run.id}`);
  };

  return (
    <form onSubmit={submit} className="card space-y-5">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label-base" htmlFor="program">Program *</label>
          <select id="program" className="input-base" required disabled={editing} value={v.program_id} onChange={(e) => set({ program_id: e.target.value })}>
            <option value="">Choose a program</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
            {!editing && <option value={NEW_PROGRAM}>+ New program…</option>}
          </select>
          {creatingProgram && (
            <input
              className="input-base mt-2"
              required
              maxLength={200}
              autoFocus
              value={newProgramName}
              onChange={(e) => setNewProgramName(e.target.value)}
              placeholder="New program name, e.g. 3D Design Club"
              aria-label="New program name"
            />
          )}
        </div>
        <div>
          <label className="label-base" htmlFor="partner">Partner</label>
          <select id="partner" className="input-base" value={v.partner_id} onChange={(e) => set({ partner_id: e.target.value })}>
            <option value="">No partner (our own)</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label className="label-base" htmlFor="name">Term or label *</label>
          <input id="name" className="input-base" required maxLength={200} value={v.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. 2026–2027, or 09/30 one-day event" />
        </div>
        <div>
          <label className="label-base" htmlFor="status">Status</label>
          <select id="status" className="input-base" value={v.status} onChange={(e) => set({ status: e.target.value })}>
            {RUN_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-base" htmlFor="start">Start date</label>
          <input id="start" type="date" className="input-base" value={v.start_date} onChange={(e) => set({ start_date: e.target.value })} />
        </div>
        <div>
          <label className="label-base" htmlFor="end">End date</label>
          <input id="end" type="date" className="input-base" value={v.end_date} onChange={(e) => set({ end_date: e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="col-span-2">
          <label className="label-base" htmlFor="location">Location</label>
          <input id="location" className="input-base" maxLength={200} value={v.location} onChange={(e) => set({ location: e.target.value })} />
        </div>
        <div>
          <label className="label-base" htmlFor="age_min">Youngest age</label>
          <input id="age_min" type="number" min={0} max={120} className="input-base" value={v.age_min} onChange={(e) => set({ age_min: e.target.value })} placeholder={editing ? '' : 'Program’s'} />
        </div>
        <div>
          <label className="label-base" htmlFor="age_max">Oldest age</label>
          <input id="age_max" type="number" min={0} max={120} className="input-base" value={v.age_max} onChange={(e) => set({ age_max: e.target.value })} placeholder={editing ? '' : 'Program’s'} />
        </div>
      </div>
      <div className="md:w-1/3">
        <label className="label-base" htmlFor="count">Participants</label>
        <input id="count" type="number" min={0} className="input-base" value={v.participant_count} onChange={(e) => set({ participant_count: e.target.value })} />
      </div>
      <div>
        <label className="label-base" htmlFor="what_changed">What’s different from last time</label>
        <textarea id="what_changed" className="input-base min-h-[100px]" value={v.what_changed} onChange={(e) => set({ what_changed: e.target.value })} placeholder="e.g. Shorter sessions, younger group, added a showcase at the end" />
      </div>
      <div>
        <label className="label-base" htmlFor="notes">Notes</label>
        <textarea id="notes" className="input-base min-h-[80px]" value={v.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="How it went, what to do next time" />
      </div>
      <fieldset className="space-y-2">
        <legend className="label-base">Jira (optional)</legend>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            className="input-base"
            value={v.jira_epic ?? ''}
            onChange={(e) => set({ jira_epic: e.target.value })}
            placeholder="Epic key, e.g. CA-12"
            aria-label="Jira epic key"
          />
          <input
            className="input-base"
            value={v.jira_label ?? ''}
            onChange={(e) => set({ jira_label: e.target.value })}
            placeholder="or a label, e.g. geo-club-2026"
            aria-label="Jira label"
          />
        </div>
        <p className="text-xs text-ink/50">The program and its sessions show this epic’s or label’s Jira tasks (read-only).</p>
      </fieldset>
      {!editing && <p className="text-xs text-ink/50">Add the dated sessions on the next page.</p>}
      {error && <div className="text-sm text-court">{error}</div>}
      <div className="flex items-center gap-2">
        <button className="btn-primary" disabled={saving}>
          <Save size={14} />
          {saving ? 'Saving...' : editing ? 'Save changes' : 'Add program'}
        </button>
        <button type="button" className="btn-ghost" onClick={() => history.back()} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
