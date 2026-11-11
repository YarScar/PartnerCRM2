'use client';

import { useState } from 'react';

/** Sends JSON and keeps the saving flag and the server's error message for the form. */
export function useSave() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- each caller reads its own response shape
  const send = async (url: string, method: string, body?: unknown): Promise<Record<string, any> | null> => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not save. Try again.');
        return null;
      }
      return data;
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  return { saving, error, setError, send };
}
