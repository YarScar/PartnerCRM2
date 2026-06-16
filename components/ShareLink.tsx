'use client';

import { useEffect, useState } from 'react';

export function ShareLink({ path = '/intake' }: { path?: string }) {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      setUrl(window.location.origin.replace(/\/+$/, '') + path);
    } catch {
      setUrl(path);
    }
  }, [path]);

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
