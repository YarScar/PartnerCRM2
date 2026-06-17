'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password !== confirm) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) return setError(v);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const body = await res.json();
      if (!res.ok) {
        setError(body.error || 'Unable to reset password');
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Server error');
    }
    setSubmitting(false);
  };

  if (!token) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="card max-w-md mx-auto">
          <p className="mb-4">Invalid password reset link.</p>
          <Link href="/forgot-password" className="btn-primary">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="card max-w-md mx-auto">
        {success ? (
          <div>
            <h2 className="font-display text-2xl font-bold mb-2">Password updated!</h2>
            <p className="mb-4">You can now sign in with your new password.</p>
            <Link href="/login" className="btn-primary">Sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="font-display text-2xl font-bold mb-2">Reset your password</h2>
            <label className="block">
              <span className="label-base">New password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-base" required />
            </label>
            <label className="block">
              <span className="label-base">Confirm password</span>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-base" required />
            </label>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <div className="flex items-center gap-3">
              <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Updating...' : 'Update password'}</button>
              <Link href="/login" className="text-sm text-ink/60 hover:underline">Back to login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
