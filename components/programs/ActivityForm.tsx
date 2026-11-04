'use client';

import { useId, useState } from 'react';
import { Save } from 'lucide-react';
import { TagInput } from './TagInput';
import { useSave } from './useSave';

export type ActivityFormValues = {
  id?: number;
  name: string;
  summary: string;
  category: string;
  goals: string[];
  age_min: string;
  age_max: string;
  duration_minutes: string;
  group_size: string;
  materials: string;
  instructions: string;
  based_on_id?: number | null;
};

export const EMPTY_ACTIVITY: ActivityFormValues = {
  name: '',
  summary: '',
  category: '',
  goals: [],
  age_min: '',
  age_max: '',
  duration_minutes: '',
  group_size: '',
  materials: '',
  instructions: '',
};

export function ActivityForm({
  initial,
  basedOnName,
  knownGoals,
  categories,
}: {
  initial?: ActivityFormValues;
  basedOnName?: string;
  knownGoals: string[];
  categories: string[];
}) {
  const [v, setV] = useState<ActivityFormValues>(initial ?? EMPTY_ACTIVITY);
  const { saving, error, send } = useSave();
  const categoryList = useId();
  const set = (patch: Partial<ActivityFormValues>) => setV((cur) => ({ ...cur, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      ...v,
      age_min: v.age_min || null,
      age_max: v.age_max || null,
      duration_minutes: v.duration_minutes || null,
    };
    const data = v.id ? await send(`/api/activities/${v.id}`, 'PATCH', body) : await send('/api/activities', 'POST', body);
    if (data) window.location.assign(`/activities/${data.activity.id}`);
  };

  return (
    <form onSubmit={submit} className="card space-y-5">
      {basedOnName && (
        <div className="text-sm bg-court/5 border border-court/20 rounded-lg px-4 py-3">
          New twist on <strong>{basedOnName}</strong>. Change what is different this time; the original stays as it is.
        </div>
      )}
      <div>
        <label className="label-base" htmlFor="name">Activity name *</label>
        <input id="name" className="input-base" required maxLength={200} value={v.name} onChange={(e) => set({ name: e.target.value })} />
      </div>
      <div>
        <label className="label-base" htmlFor="summary">One-line summary</label>
        <input id="summary" className="input-base" maxLength={1000} value={v.summary} onChange={(e) => set({ summary: e.target.value })} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label-base" htmlFor="category">Type</label>
          <input id="category" list={categoryList} className="input-base" maxLength={80} value={v.category} onChange={(e) => set({ category: e.target.value })} placeholder="e.g. Icebreaker" />
          <datalist id={categoryList}>
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="label-base" htmlFor="duration">Length (minutes)</label>
          <input id="duration" type="number" min={1} max={1440} className="input-base" value={v.duration_minutes} onChange={(e) => set({ duration_minutes: e.target.value })} />
        </div>
      </div>
      <div>
        <div className="label-base">Goals</div>
        <TagInput value={v.goals} onChange={(goals) => set({ goals })} suggestions={knownGoals} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="label-base" htmlFor="age_min">Youngest age</label>
          <input id="age_min" type="number" min={0} max={120} className="input-base" value={v.age_min} onChange={(e) => set({ age_min: e.target.value })} />
        </div>
        <div>
          <label className="label-base" htmlFor="age_max">Oldest age</label>
          <input id="age_max" type="number" min={0} max={120} className="input-base" value={v.age_max} onChange={(e) => set({ age_max: e.target.value })} />
        </div>
        <div className="col-span-2 md:col-span-1">
          <label className="label-base" htmlFor="group_size">Group size</label>
          <input id="group_size" className="input-base" maxLength={80} value={v.group_size} onChange={(e) => set({ group_size: e.target.value })} placeholder="e.g. pairs, 10–20" />
        </div>
      </div>
      <div>
        <label className="label-base" htmlFor="materials">Materials</label>
        <textarea id="materials" className="input-base min-h-[80px]" value={v.materials} onChange={(e) => set({ materials: e.target.value })} />
      </div>
      <div>
        <label className="label-base" htmlFor="instructions">How to run it</label>
        <textarea id="instructions" className="input-base min-h-[160px]" value={v.instructions} onChange={(e) => set({ instructions: e.target.value })} />
      </div>
      {error && <div className="text-sm text-court">{error}</div>}
      <button className="btn-primary" disabled={saving}>
        <Save size={14} />
        {saving ? 'Saving...' : v.id ? 'Save changes' : basedOnName ? 'Save twist' : 'Add to library'}
      </button>
    </form>
  );
}
