'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { TagInput } from './TagInput';
import { useSave } from './useSave';

export type ProgramFormValues = {
  id?: number;
  name: string;
  description: string;
  goals: string[];
  age_min: string;
  age_max: string;
  audience_notes: string;
};

export function ProgramForm({ initial, knownGoals }: { initial?: ProgramFormValues; knownGoals: string[] }) {
  const [v, setV] = useState<ProgramFormValues>(
    initial ?? { name: '', description: '', goals: [], age_min: '', age_max: '', audience_notes: '' }
  );
  const { saving, error, send } = useSave();
  const set = (patch: Partial<ProgramFormValues>) => setV((cur) => ({ ...cur, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { ...v, age_min: v.age_min || null, age_max: v.age_max || null };
    const data = v.id ? await send(`/api/programs/${v.id}`, 'PATCH', body) : await send('/api/programs', 'POST', body);
    if (data) window.location.assign(`/programs/${data.program.id}`);
  };

  return (
    <form onSubmit={submit} className="card space-y-5">
      <div>
        <label className="label-base" htmlFor="name">Program name *</label>
        <input id="name" className="input-base" required maxLength={200} value={v.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Intro to 3D Printing" />
      </div>
      <div>
        <label className="label-base" htmlFor="description">What it is</label>
        <textarea id="description" className="input-base min-h-[100px]" value={v.description} onChange={(e) => set({ description: e.target.value })} />
      </div>
      <div>
        <div className="label-base">Goals</div>
        <TagInput value={v.goals} onChange={(goals) => set({ goals })} suggestions={knownGoals} />
        <p className="text-xs text-ink/50 mt-1">What participants should get out of it. Used to suggest activities.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-base" htmlFor="age_min">Youngest age</label>
          <input id="age_min" type="number" min={0} max={120} className="input-base" value={v.age_min} onChange={(e) => set({ age_min: e.target.value })} />
        </div>
        <div>
          <label className="label-base" htmlFor="age_max">Oldest age</label>
          <input id="age_max" type="number" min={0} max={120} className="input-base" value={v.age_max} onChange={(e) => set({ age_max: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label-base" htmlFor="audience_notes">Audience notes</label>
        <textarea id="audience_notes" className="input-base min-h-[80px]" value={v.audience_notes} onChange={(e) => set({ audience_notes: e.target.value })} placeholder="Who it's for, experience level, anything to keep in mind" />
      </div>
      {error && <div className="text-sm text-court">{error}</div>}
      <div className="flex items-center gap-2">
        <button className="btn-primary" disabled={saving}>
          <Save size={14} />
          {saving ? 'Saving...' : v.id ? 'Save changes' : 'Create program'}
        </button>
        <button type="button" className="btn-ghost" onClick={() => history.back()} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
