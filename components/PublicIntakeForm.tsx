'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Mail, MessageSquare, Building2 } from 'lucide-react';

export function PublicIntakeForm() {
  const router = useRouter();
  const [orgName, setOrgName] = useState('');
  const [intakeMessage, setIntakeMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch('/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        org_name: orgName,
        intake_message: intakeMessage,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error || 'Unable to submit intake');
      setSaving(false);
      return;
    }

    setSubmitted(true);
    router.refresh();
  };

  if (submitted) {
    return (
      <div className="card max-w-2xl mx-auto text-center py-14 space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-court/15 text-court mx-auto">
          <Mail size={22} />
        </div>
        <h2 className="font-display text-3xl font-bold">Thanks. We got it.</h2>
        <p className="text-ink/60 max-w-lg mx-auto">
          Your organization was added as a pending intake. The CreateAccess team will review it and follow up.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card max-w-2xl mx-auto space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-court font-semibold mb-2">
          Short Intake
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          Tell us who you are.
        </h2>
        <p className="text-sm text-ink/60 mt-2">
          This public form is intentionally short. We’ll review the intake, notify the team, and then add more detail later.
        </p>
      </div>

      <label className="block">
        <span className="label-base">Organization Name</span>
        <div className="relative">
          <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            value={orgName}
            onChange={(event) => setOrgName(event.target.value)}
            className="input-base pl-9"
            placeholder="Roxbury Youth Collective"
            required
          />
        </div>
      </label>

      <label className="block">
        <span className="label-base">What should we know?</span>
        <div className="relative">
          <MessageSquare size={16} className="absolute left-3 top-4 text-ink/40" />
          <textarea
            value={intakeMessage}
            onChange={(event) => setIntakeMessage(event.target.value)}
            className="input-base pl-9 min-h-[160px] resize-y"
            placeholder="Tell us anything helpful: goals, timeline, age group, equipment, or specific ideas."
            required
          />
        </div>
      </label>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>
        {saving ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
        {saving ? 'Submitting...' : 'Send intake'}
      </button>
    </form>
  );
}
