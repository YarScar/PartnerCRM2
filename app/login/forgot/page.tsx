'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    });
    if (res.ok) {
      setStatus('If that account exists, an email was sent.');
    } else {
      const body = await res.json().catch(() => ({}));
      setStatus(body.error || 'An error occurred');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto py-16 px-6">
      <form onSubmit={handleSubmit} className="card space-y-4">
        <h2 className="text-2xl font-bold">Forgot password</h2>
        <p className="text-sm text-ink/70">Enter your username or email. If you enter an email we'll send your username and a reset link to that email.</p>

        <label className="block">
          <span className="label-base">Username or email</span>
          <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="input-base" />
        </label>

        {status && <p className="text-sm text-ink/70">{status}</p>}

        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Request reset'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.push('/login')}>
            Back
          </button>
        </div>
      </form>
    </div>
  );
}
