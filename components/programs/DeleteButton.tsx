'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useSave } from './useSave';

/** Admin-only delete with a confirm step; goes to `after` when done. */
export function DeleteButton({ url, after, what, warning }: { url: string; after: string; what: string; warning?: string }) {
  const [confirming, setConfirming] = useState(false);
  const { saving, error, send } = useSave();

  const performDelete = async () => {
    if (await send(url, 'DELETE')) window.location.assign(after);
  };

  return (
    <>
      <button onClick={() => setConfirming(true)} className="btn-ghost text-court">
        <Trash2 size={14} />
        Delete
      </button>
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-cream rounded-lg p-6 max-w-md w-full space-y-4">
            <div className="text-sm">
              Delete <strong>{what}</strong>? This cannot be undone.
              {warning && <div className="mt-2 text-ink/60">{warning}</div>}
            </div>
            {error && <div className="text-sm text-court">{error}</div>}
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setConfirming(false)} disabled={saving}>
                Cancel
              </button>
              <button className="btn-primary" onClick={performDelete} disabled={saving}>
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
