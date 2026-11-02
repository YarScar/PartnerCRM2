'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDigestPage() {
  // Built and escaped on the server by lib/digest.ts renderDigest (same as the email).
  const [html, setHtml] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/digest');
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to generate digest');
      setHtml(body.html || '');
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
      const failed: { to: string }[] = body.failed || [];
      setToast(
        failed.length > 0
          ? { type: 'error', msg: `Sent to ${body.sentTo.join(', ')}. Failed for ${failed.map((f) => f.to).join(', ')}.` }
          : { type: 'success', msg: `Digest sent to ${body.sentTo.join(', ')}.` }
      );
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
          <p className="text-ink/60">Summary of the last 7 days</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="btn-ghost">{loading ? 'Loading…' : '↺ Refresh'}</button>
          <button onClick={handleSend} className="btn-primary" disabled={sending}>{sending ? 'Sending…' : '✉ Email Admins'}</button>
        </div>
      </div>

      <div className="card bg-cream p-6 mb-6">
        <div className="[&_h2]:font-semibold [&_h2]:mt-4 [&_h2:first-child]:mt-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_p]:my-2 [&_.stat]:mt-4 [&_.stat]:font-semibold" dangerouslySetInnerHTML={{ __html: html }} />
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
