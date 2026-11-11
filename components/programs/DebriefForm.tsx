'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, Save } from 'lucide-react';
import { ENGAGEMENT_LABELS, type DebriefStatus } from '@/lib/programs';
import { useSave } from './useSave';

export type DebriefValues = {
  attendance: string;
  engagement: string;
  went_well: string;
  to_improve: string;
  changes_next_time: string;
  highlights: string;
  follow_ups: string;
};

type Saved = DebriefValues & { submitted_by: string; updated_at: string };

const PROMPTS: { key: keyof DebriefValues; label: string; hint: string }[] = [
  { key: 'went_well', label: 'What went well', hint: 'What worked: activities, moments, setup' },
  { key: 'to_improve', label: 'What to improve', hint: 'What didn’t work or got in the way' },
  { key: 'changes_next_time', label: 'Changes for next time', hint: 'What we’ll do differently next session' },
  { key: 'highlights', label: 'Highlights and creator feedback', hint: 'Wins, quotes, standout work' },
  { key: 'follow_ups', label: 'Follow-ups', hint: 'Who needs to do what, e.g. “Liz: send slides to partner”' },
];

/**
 * The after-session debrief, a short after-action review. Shows the saved debrief when
 * there is one (with Edit), otherwise the form. A future session says it's too early.
 */
export function DebriefForm({
  sessionId,
  status,
  saved,
  plannedCount,
}: {
  sessionId: number;
  status: DebriefStatus;
  saved: Saved | null;
  plannedCount: number | null;
}) {
  const empty: DebriefValues = { attendance: '', engagement: '', went_well: '', to_improve: '', changes_next_time: '', highlights: '', follow_ups: '' };
  const [current, setCurrent] = useState<Saved | null>(saved);
  const [editing, setEditing] = useState(!saved);
  const [v, setV] = useState<DebriefValues>(saved ?? empty);
  const { saving, error, send } = useSave();
  const router = useRouter();
  const set = (patch: Partial<DebriefValues>) => setV((cur) => ({ ...cur, ...patch }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await send(`/api/sessions/${sessionId}/debrief`, 'PUT', {
      ...v,
      attendance: v.attendance === '' ? null : v.attendance,
      engagement: v.engagement === '' ? null : v.engagement,
    });
    if (data) {
      setCurrent({ ...v, submitted_by: data.debrief.submitted_by, updated_at: data.debrief.updated_at });
      setEditing(false);
      router.refresh(); // so the page's "Debrief due" badge updates too
    }
  };

  if (current && !editing) {
    const engagement = current.engagement ? Number(current.engagement) : null;
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span><span className="font-semibold">Attendance:</span> {current.attendance || '—'}{plannedCount != null && current.attendance && ` of ${plannedCount} expected`}</span>
            <span><span className="font-semibold">Engagement:</span> {engagement ? `${engagement}/5 · ${ENGAGEMENT_LABELS[engagement]}` : '—'}</span>
          </div>
          <button type="button" className="btn-ghost" onClick={() => setEditing(true)}>
            <Edit2 size={14} /> Edit debrief
          </button>
        </div>
        {PROMPTS.filter((p) => current[p.key]).map((p) => (
          <div key={p.key}>
            <div className="label-base">{p.label}</div>
            <div className="text-sm whitespace-pre-wrap">{current[p.key]}</div>
          </div>
        ))}
        <div className="text-xs text-ink/50">
          By {current.submitted_by} · {new Date(current.updated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {status === 'upcoming' && !current && (
        <div className="text-sm text-ink/60 bg-ink/5 rounded-lg px-4 py-3">
          This session hasn’t happened yet. Fill this in after it runs.
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label-base" htmlFor="attendance">Attendance (creators who came)</label>
          <input id="attendance" type="number" min={0} className="input-base" value={v.attendance} onChange={(e) => set({ attendance: e.target.value })} placeholder={plannedCount != null ? `${plannedCount} expected` : ''} />
        </div>
        <fieldset>
          <legend className="label-base">Engagement</legend>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                title={ENGAGEMENT_LABELS[n]}
                aria-pressed={v.engagement === String(n)}
                onClick={() => set({ engagement: v.engagement === String(n) ? '' : String(n) })}
                className={`w-10 h-10 rounded-full border text-sm font-semibold transition-colors ${v.engagement === String(n) ? 'bg-ink text-cream border-ink' : 'border-ink/20 hover:border-ink'}`}
              >
                {n}
              </button>
            ))}
            {v.engagement && <span className="self-center text-xs text-ink/60 ml-1">{ENGAGEMENT_LABELS[Number(v.engagement)]}</span>}
          </div>
        </fieldset>
      </div>
      {PROMPTS.map((p) => (
        <div key={p.key}>
          <label className="label-base" htmlFor={p.key}>{p.label}</label>
          <textarea id={p.key} className="input-base min-h-[80px]" value={v[p.key]} onChange={(e) => set({ [p.key]: e.target.value })} placeholder={p.hint} />
        </div>
      ))}
      {error && <div className="text-sm text-court">{error}</div>}
      <div className="flex gap-2">
        <button className="btn-primary" disabled={saving}>
          <Save size={14} />
          {saving ? 'Saving...' : current ? 'Save debrief' : 'Submit debrief'}
        </button>
        {current && (
          <button type="button" className="btn-ghost" onClick={() => { setV(current); setEditing(false); }}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
