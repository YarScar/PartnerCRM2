'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { SessionTask } from '@/lib/programs';
import { useSave } from './useSave';

/**
 * A session's to-do checklist. In a form (`onChange`) it edits the list; on the session
 * page (`saveUrl`) ticking a box saves straight away.
 */
export function TaskListEditor({
  value,
  onChange,
  saveUrl,
}: {
  value: SessionTask[];
  onChange?: (tasks: SessionTask[]) => void;
  saveUrl?: string;
}) {
  const [tasks, setTasks] = useState(value);
  const [draft, setDraft] = useState('');
  const { error, send } = useSave();
  const editable = Boolean(onChange);

  const update = async (next: SessionTask[]) => {
    const before = tasks;
    setTasks(next);
    onChange?.(next);
    if (saveUrl && !(await send(saveUrl, 'PATCH', { tasks: next }))) setTasks(before);
  };

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    update([...tasks, { text, done: false }]);
    setDraft('');
  };

  return (
    <div className="space-y-2">
      {tasks.length === 0 && !editable && <div className="text-sm text-ink/50">No tasks.</div>}
      <ul className="space-y-1.5">
        {tasks.map((t, i) => (
          <li key={i} className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-court"
              checked={t.done}
              aria-label={t.text}
              onChange={() => update(tasks.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}
            />
            <span className={`text-sm flex-1 ${t.done ? 'line-through text-ink/40' : ''}`}>{t.text}</span>
            {editable && (
              <button type="button" className="btn-ghost !px-2 text-court" aria-label={`Remove ${t.text}`} onClick={() => update(tasks.filter((_, j) => j !== i))}>
                <X size={14} />
              </button>
            )}
          </li>
        ))}
      </ul>
      {editable && (
        <div className="flex gap-2">
          <input
            className="input-base !py-1.5 text-sm"
            value={draft}
            maxLength={300}
            placeholder="Add a task, then Enter"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
          />
          <button type="button" className="btn-ghost" onClick={add}>
            <Plus size={14} /> Add
          </button>
        </div>
      )}
      {error && <div className="text-sm text-court">{error}</div>}
    </div>
  );
}
