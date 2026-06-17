'use client';

import { useEffect, useState } from 'react';
import { marked } from 'marked';
import Link from 'next/link';

export default function AdminDigestPage() {
  const [markdown, setMarkdown] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/digest');
      const body = await res.json();
      setMarkdown(body.markdown || '');
      setData(body.data || null);
    } catch (err: any) {
      setToast({ type: 'error', msg: err?.message || 'Failed to generate digest' });
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch('/api/digest/send', { method: 'POST' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to send');
      setToast({ type: 'success', msg: 'Digest sent!' });
    } catch (err: any) {
      setToast({ type: 'error', msg: err?.message || 'Send failed' });
    }
    setSending(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Weekly Digest</h1>
          <p className="text-ink/60">AI-generated summary of the last 7 days</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="btn-ghost">{loading ? 'Generating…' : '↺ Regenerate'}</button>
          <button onClick={handleSend} className="btn-primary" disabled={sending}>{sending ? 'Sending…' : '✉ Email Admins'}</button>
        </div>
      </div>

      <div className="card bg-cream p-6 mb-6">
        <div dangerouslySetInnerHTML={{ __html: marked.parse(markdown || 'Nothing to report this week.') }} />
      </div>

      <details className="card p-4">
        <summary className="font-medium">Raw Data</summary>
        <pre className="mt-3 text-sm bg-white p-3 rounded overflow-auto">{JSON.stringify(data, null, 2)}</pre>
      </details>

      {toast && (
        <div className={`mt-4 ${toast.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{toast.msg}</div>
      )}
    </div>
  );
}
