'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch (err) {
      // swallow errors to avoid leaking info
    }
    setSent(true);
    setSubmitting(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="card max-w-md mx-auto">
        <h2 className="font-display text-2xl font-bold mb-2">Forgot your password?</h2>
        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-ink/70">Enter your email and we'll send a password reset link if it's on file.</p>
            <label className="block">
              <span className="label-base">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-base"
                required
                autoComplete="email"
              />
            </label>
            <div className="flex items-center gap-3">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send reset link'}
              </button>
              <Link href="/login" className="text-sm text-ink/60 hover:underline">
                Back to login
              </Link>
            </div>
          </form>
        ) : (
          <div>
            <p className="mb-4">If that email is in our system, a reset link is on its way.</p>
            <Link href="/login" className="btn-primary">
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
