'use client';

import { Archive, RotateCcw } from 'lucide-react';
import { useSave } from './useSave';

/** Moves a program run into the partner's past programs (Completed), or back to current. */
export function ArchiveRunButton({ runId, past }: { runId: number; past: boolean }) {
  const { saving, error, send } = useSave();

  const toggle = async () => {
    if (await send(`/api/runs/${runId}`, 'PATCH', { status: past ? 'Active' : 'Completed' })) window.location.reload();
  };

  return (
    <>
      <button className="btn-ghost" onClick={toggle} disabled={saving}>
        {past ? <RotateCcw size={14} /> : <Archive size={14} />}
        {saving ? 'Saving...' : past ? 'Reopen program' : 'Move to past programs'}
      </button>
      {error && <span className="text-sm text-court">{error}</span>}
    </>
  );
}
