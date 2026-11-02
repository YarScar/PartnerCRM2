'use client';

import { useState, useSyncExternalStore } from 'react';

const noSubscribe = () => () => {};

export function ShareLink({ path = '/intake' }: { path?: string }) {
  // The site's own origin is only known in the browser; the server renders the bare path.
  const origin = useSyncExternalStore(noSubscribe, () => window.location.origin.replace(/\/+$/, ''), () => '');
  // Default to the public-facing intake path
  const url = origin + (path || '/public/intake');
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input readOnly value={url} className="input-base flex-1" aria-label="Public intake URL" />
      <button onClick={copy} className="btn-ghost" aria-label="Copy public intake link">
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
