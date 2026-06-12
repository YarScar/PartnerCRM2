'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) setStatus('Missing token');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (newPassword !== confirm) return setStatus('Passwords do not match');
    setLoading(true);
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    if (res.ok) {
      setStatus('Password updated — you can now sign in');
      setTimeout(() => router.push('/login'), 1500);
    } else {
      const body = await res.json().catch(() => ({}));
      setStatus(body.error || 'An error occurred');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto py-16 px-6">
      <form onSubmit={handleSubmit} className="card space-y-4">
        <h2 className="text-2xl font-bold">Reset password</h2>
        <p className="text-sm text-ink/70">Set a new password for your account.</p>

        <label className="block">
          <span className="label-base">New password</span>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-base" />
        </label>

        <label className="block">
          <span className="label-base">Confirm password</span>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-base" />
        </label>

        {status && <p className="text-sm text-ink/70">{status}</p>}

        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={loading || !token}>
            {loading ? 'Updating...' : 'Set new password'}
          </button>
        </div>
      </form>
    </div>
  );
}
