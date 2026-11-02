'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BadgeCheck, Lock, Loader2, UserRound } from 'lucide-react';

export function SettingsClient({
  user,
  emailVerified,
  verifyResult,
}: {
  user: any;
  emailVerified: boolean;
  verifyResult?: 'success' | 'error';
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState(user.email || '');
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);

    const response = await fetch('/api/account/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error || 'Failed to change password');
      setSubmitting(false);
      return;
    }

    // First login with a temporary password: the app is unlocked now. Use a full page
    // load: the client router has cached "/dashboard → /settings" from before, and
    // would keep showing this page.
    if (user.mustChangePassword) {
      window.location.assign('/dashboard');
      return;
    }

    setSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSubmitting(false);
  };

  const handleSendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatus(null);
    try {
      const res = await fetch('/api/auth/request-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Failed to send verification');
      setEmailStatus('Verification email sent — check your inbox');
    } catch (err: any) {
      setEmailStatus(err?.message || 'Failed to send verification');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink mb-8"
      >
        <ArrowLeft size={14} />
        Back to dashboard
      </Link>

      <div className="mb-10">
        <div className="text-xs uppercase tracking-widest text-ink/50 mb-2">Account</div>
        <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight">Settings</h1>
      </div>

      {user.mustChangePassword && (
        <div className="card border-court/40 bg-court/5 mb-8">
          <h2 className="font-display text-xl font-bold">Welcome! Set your own password</h2>
          <p className="text-sm text-ink/70 mt-1">
            You signed in with a temporary password. Enter it as your current password below and choose a new
            one to open the rest of the app.
          </p>
        </div>
      )}

      <div className="grid gap-8">
        {/* Profile Info */}
        <div className="card space-y-6">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-ink/50 mb-3 font-semibold">
              Profile Information
            </div>
            <h2 className="font-display text-2xl font-bold mb-4">Your Account</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-widest text-ink/50">Username</div>
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <UserRound size={16} className="text-ink/40" />
                {user.username}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase tracking-widest text-ink/50">Display Name</div>
              <div className="text-sm font-medium">{user.displayName}</div>
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase tracking-widest text-ink/50">Email</div>
              <form onSubmit={handleSendVerification} className="flex gap-2 items-center">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-base"
                  placeholder="you@example.com"
                />
                {/* Only offer verification for an email that isn't already the verified one. */}
                {emailVerified && email.trim().toLowerCase() === (user.email || '').toLowerCase() ? (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 whitespace-nowrap">
                    <BadgeCheck size={16} />
                    Verified
                  </span>
                ) : (
                  <button className="btn-primary" type="submit">Send verification</button>
                )}
              </form>
              {verifyResult === 'success' && <div className="text-sm text-green-700">Email verified.</div>}
              {verifyResult === 'error' && (
                <div className="text-sm text-red-700">That verification link is invalid or expired. Send a new one.</div>
              )}
              {emailStatus && <div className="text-sm text-ink/60">{emailStatus}</div>}
            </div>

            <div className="space-y-2">
              <div className="text-xs uppercase tracking-widest text-ink/50">Role</div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-ink/5 border border-ink/15 text-xs font-semibold uppercase tracking-wider text-ink/70">
                {user.role}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="card space-y-6">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-ink/50 mb-3 font-semibold flex items-center gap-2">
              <Lock size={12} />
              Security
            </div>
            <h2 className="font-display text-2xl font-bold">Change Password</h2>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
            <label className="block">
              <span className="label-base">Current Password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="input-base"
                placeholder="••••••••"
                required
              />
            </label>

            <label className="block">
              <span className="label-base">New Password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="input-base"
                placeholder="••••••••"
                required
              />
              <p className="text-xs text-ink/50 mt-1">Must be at least 8 characters</p>
            </label>

            <label className="block">
              <span className="label-base">Confirm New Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="input-base"
                placeholder="••••••••"
                required
              />
            </label>

            {error && <p className="text-sm text-red-700 font-medium">{error}</p>}
            {success && (
              <p className="text-sm text-emerald-700 font-medium">✓ Password changed successfully</p>
            )}

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              {submitting ? 'Changing password...' : 'Change password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
