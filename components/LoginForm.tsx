'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Lock, UserRound } from 'lucide-react';

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error || 'Unable to log in');
      setSubmitting(false);
      return;
    }

    router.replace(nextPath || '/dashboard');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="card max-w-md w-full space-y-5">
      <div>
        <div className="text-xs uppercase tracking-widest text-ink/50 mb-2">Account Login</div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Sign in</h1>
        <p className="text-sm text-ink/60 mt-2">
          Use your staff or admin account to open the internal workspace.
        </p>
      </div>

      <label className="block">
        <span className="label-base">Username</span>
        <div className="relative">
          <UserRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="input-base pl-9"
            autoComplete="username"
            placeholder="admin"
          />
        </div>
      </label>

      <label className="block">
        <span className="label-base">Password</span>
        <div className="relative">
          <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input-base pl-9"
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>
      </label>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button type="submit" className="btn-primary w-full justify-center" disabled={submitting}>
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
        {submitting ? 'Signing in...' : 'Enter workspace'}
      </button>
    </form>
  );
}
