'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, Lightbulb, Plus, Save, X } from 'lucide-react';
import { formatAges, suggestActivities, type SuggestTarget } from '@/lib/programs';
import { useSave } from './useSave';

export type PickableActivity = {
  id: number;
  name: string;
  summary: string | null;
  category: string | null;
  goals: string[];
  age_min: number | null;
  age_max: number | null;
  duration_minutes: number | null;
};

type Row = { activity: PickableActivity; notes: string };

/**
 * An ordered activity list: a program's usual plan, or what one run actually did.
 * Runs also keep a note per activity on how it was adapted. Suggestions come from
 * the audience's ages and the program's goals (lib/programs.ts suggestActivities).
 */
export function ActivityListEditor({
  saveUrl,
  initial,
  library,
  target,
  withNotes = false,
  emptyText,
}: {
  saveUrl: string;
  initial: Row[];
  library: PickableActivity[];
  target: SuggestTarget;
  withNotes?: boolean;
  emptyText: string;
}) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial.map(key)));
  const [search, setSearch] = useState('');
  // Suggestions stay behind a button so the list itself is what the page shows first.
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { saving, error, send } = useSave();
  const dirty = JSON.stringify(rows.map(key)) !== saved;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const inList = useMemo(() => rows.map((r) => r.activity.id), [rows]);
  const suggestions = useMemo(() => suggestActivities(library, target, { exclude: inList }), [library, target, inList]);
  const matches = search.trim()
    ? library
        .filter((a) => !inList.includes(a.id))
        .filter((a) => `${a.name} ${a.summary ?? ''} ${a.category ?? ''} ${a.goals.join(' ')}`.toLowerCase().includes(search.trim().toLowerCase()))
        .slice(0, 8)
    : [];

  const add = (activity: PickableActivity) => {
    setRows((cur) => [...cur, { activity, notes: '' }]);
    setSearch('');
  };
  const move = (i: number, by: number) =>
    setRows((cur) => {
      const next = [...cur];
      const [row] = next.splice(i, 1);
      next.splice(i + by, 0, row);
      return next;
    });

  const save = async () => {
    const body = rows.map((r) => ({ activity_id: r.activity.id, ...(withNotes ? { notes: r.notes } : {}) }));
    if (await send(saveUrl, 'PUT', body)) setSaved(JSON.stringify(rows.map(key)));
  };

  const totalMinutes = rows.reduce((sum, r) => sum + (r.activity.duration_minutes ?? 0), 0);

  return (
    <div className="space-y-5">
      {rows.length === 0 ? (
        <div className="text-sm text-ink/50">{emptyText}</div>
      ) : (
        <ol className="space-y-2">
          {rows.map((row, i) => (
            <li key={row.activity.id} className="border border-ink/10 rounded-xl px-4 py-3 bg-cream">
              <div className="flex items-start gap-3">
                <span className="text-xs font-mono text-ink/40 pt-1 w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <Link href={`/activities/${row.activity.id}`} className="font-semibold hover:text-court">
                    {row.activity.name}
                  </Link>
                  <div className="text-xs text-ink/50">
                    {[row.activity.category, row.activity.duration_minutes && `${row.activity.duration_minutes} min`, formatAges(row.activity.age_min, row.activity.age_max) && `Ages ${formatAges(row.activity.age_min, row.activity.age_max)}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                  {withNotes && (
                    <input
                      className="input-base !py-1.5 text-sm mt-2"
                      maxLength={2000}
                      value={row.notes}
                      placeholder="How we adapted it this time (optional)"
                      onChange={(e) => setRows((cur) => cur.map((r, j) => (j === i ? { ...r, notes: e.target.value } : r)))}
                    />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" className="btn-ghost !px-2" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" className="btn-ghost !px-2" aria-label="Move down" disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown size={14} />
                  </button>
                  <button type="button" className="btn-ghost !px-2 text-court" aria-label="Remove" onClick={() => setRows((cur) => cur.filter((_, j) => j !== i))}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
      {totalMinutes > 0 && <div className="text-xs text-ink/50">About {totalMinutes} minutes in total (activities with a length set).</div>}

      <div>
        <label className="label-base" htmlFor="activity-search">Add from the library</label>
        <input id="activity-search" className="input-base" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, type or goal" />
        {search.trim() && (
          <div className="mt-2 border border-ink/10 rounded-xl divide-y divide-ink/10 bg-cream">
            {matches.length === 0 ? (
              <div className="px-4 py-3 text-sm text-ink/50">
                Nothing matches. <Link href="/activities/new" className="underline">Add a new activity</Link>
              </div>
            ) : (
              matches.map((a) => (
                <button key={a.id} type="button" onClick={() => add(a)} className="w-full text-left px-4 py-2 hover:bg-court/5 flex items-center justify-between gap-3">
                  <span>
                    <span className="font-medium">{a.name}</span>
                    {a.summary && <span className="text-xs text-ink/50"> — {a.summary}</span>}
                  </span>
                  <Plus size={14} className="text-ink/40 shrink-0" />
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {suggestions.length > 0 && !showSuggestions && (
        <button type="button" className="btn-ghost text-court" onClick={() => setShowSuggestions(true)}>
          <Lightbulb size={14} /> Suggest activities ({suggestions.length})
        </button>
      )}

      {suggestions.length > 0 && showSuggestions && (
        <div className="rounded-xl border border-court/20 bg-court/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold mb-3">
            <Lightbulb size={15} className="text-court" />
            Suggested for this audience and these goals
          </div>
          <div className="space-y-2">
            {suggestions.map(({ activity, reasons }) => (
              <div key={activity.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/activities/${activity.id}`} className="font-medium text-sm hover:text-court">
                    {activity.name}
                  </Link>
                  <div className="text-xs text-ink/50">{reasons.join(' · ')}</div>
                </div>
                <button type="button" className="btn-ghost shrink-0" onClick={() => add(activity)}>
                  <Plus size={14} /> Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button type="button" className="btn-primary" disabled={saving || !dirty} onClick={save}>
          <Save size={14} />
          {saving ? 'Saving...' : 'Save activities'}
        </button>
        {dirty && <span className="text-xs text-court">Unsaved changes</span>}
        {error && <span className="text-sm text-court">{error}</span>}
      </div>
    </div>
  );
}

function key(r: Row) {
  return [r.activity.id, r.notes];
}
