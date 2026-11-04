'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import type { SessionTask } from '@/lib/programs';
import { TagInput } from './TagInput';
import { TaskListEditor } from './TaskListEditor';
import { useSave } from './useSave';

export type SessionFormValues = {
  id?: number;
  run_id: number;
  date: string;
  title: string;
  start_time: string;
  end_time: string;
  arrival_time: string;
  location: string;
  description: string;
  creator_count: string;
  audience_notes: string;
  development_team: string[];
  facilitation_team: string[];
  equipment: string;
  planning_doc_url: string;
  slides_url: string;
  shared_docs_url: string;
  other_links: string;
  tasks: SessionTask[];
  notes: string;
};

/** Laid out in the same order as the team's program doc template. */
export function SessionForm({
  initial,
  knownNames,
  prefilledFrom,
}: {
  initial: SessionFormValues;
  knownNames: string[];
  prefilledFrom?: string;
}) {
  const [v, setV] = useState(initial);
  const { saving, error, send } = useSave();
  const set = (patch: Partial<SessionFormValues>) => setV((cur) => ({ ...cur, ...patch }));
  const editing = Boolean(v.id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const blank = (s: string) => (s === '' ? null : s);
    const body = {
      ...v,
      run_id: editing ? undefined : v.run_id,
      start_time: blank(v.start_time),
      end_time: blank(v.end_time),
      arrival_time: blank(v.arrival_time),
      creator_count: blank(v.creator_count),
    };
    const data = editing ? await send(`/api/sessions/${v.id}`, 'PATCH', body) : await send('/api/sessions', 'POST', body);
    if (data) window.location.assign(`/sessions/${data.session.id}`);
  };

  const text = (key: keyof SessionFormValues, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label-base" htmlFor={key}>{label}</label>
      <input id={key} className="input-base" value={v[key] as string} onChange={(e) => set({ [key]: e.target.value })} {...props} />
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      {prefilledFrom && (
        <div className="text-sm bg-court/5 border border-court/20 rounded-lg px-4 py-3">
          Filled in from the {prefilledFrom} session. Check the date and change what is different.
        </div>
      )}

      <section className="card space-y-4">
        <h2 className="font-display text-xl font-bold">When and where</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {text('date', 'Date *', { type: 'date', required: true })}
          <div className="md:col-span-2">{text('title', 'Session title', { maxLength: 200, placeholder: 'e.g. Week 3: First prints' })}</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {text('start_time', 'Program starts', { type: 'time' })}
          {text('end_time', 'Program ends', { type: 'time' })}
          <div className="col-span-2 md:col-span-1">{text('arrival_time', 'Team arrival time', { type: 'time' })}</div>
        </div>
        <p className="text-xs text-ink/50 -mt-2">Program time doesn’t include travel and setup.</p>
        {text('location', 'Location', { maxLength: 200 })}
      </section>

      <section className="card space-y-4">
        <h2 className="font-display text-xl font-bold">Program</h2>
        <div>
          <label className="label-base" htmlFor="description">Program description</label>
          <textarea id="description" className="input-base min-h-[100px]" value={v.description} onChange={(e) => set({ description: e.target.value })} />
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {text('creator_count', 'Creator count', { type: 'number', min: 0 })}
          <div className="md:col-span-2">{text('audience_notes', 'Audience (ages, who they are)', { maxLength: 1000 })}</div>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="font-display text-xl font-bold">Team</h2>
        <div>
          <div className="label-base">Development team</div>
          <TagInput value={v.development_team} onChange={(development_team) => set({ development_team })} suggestions={knownNames} placeholder="Type a name, then Enter" />
        </div>
        <div>
          <div className="label-base">Facilitation team</div>
          <TagInput value={v.facilitation_team} onChange={(facilitation_team) => set({ facilitation_team })} suggestions={knownNames} placeholder="Type a name, then Enter" />
        </div>
        <div>
          <label className="label-base" htmlFor="equipment">Equipment and needs</label>
          <textarea id="equipment" className="input-base min-h-[80px]" value={v.equipment} onChange={(e) => set({ equipment: e.target.value })} placeholder="Laptops, tech, handout prints, swag, etc." />
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="font-display text-xl font-bold">Documents</h2>
        {text('planning_doc_url', 'Program planning documents (link)', { type: 'url', placeholder: 'https://drive.google.com/...' })}
        {text('slides_url', 'Program slides (link)', { type: 'url', placeholder: 'https://docs.google.com/presentation/...' })}
        {text('shared_docs_url', 'Creator shared documents (link, if any)', { type: 'url' })}
        <div>
          <label className="label-base" htmlFor="other_links">Other docs</label>
          <textarea id="other_links" className="input-base min-h-[70px]" value={v.other_links} onChange={(e) => set({ other_links: e.target.value })} placeholder="One per line. Links become clickable." />
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="font-display text-xl font-bold">General tasks</h2>
        <TaskListEditor value={v.tasks} onChange={(tasks) => set({ tasks })} />
      </section>

      <section className="card space-y-4">
        <h2 className="font-display text-xl font-bold">Misc program notes</h2>
        <textarea id="notes" aria-label="Misc program notes" className="input-base min-h-[120px]" value={v.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Everything else goes here" />
      </section>

      {!editing && <p className="text-xs text-ink/50">The session starts with the program’s usual activities. You can change them on the next page.</p>}
      {error && <div className="text-sm text-court">{error}</div>}
      <button className="btn-primary" disabled={saving}>
        <Save size={14} />
        {saving ? 'Saving...' : editing ? 'Save changes' : 'Create session'}
      </button>
    </form>
  );
}
