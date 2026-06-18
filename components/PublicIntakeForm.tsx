'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2, Mail, MessageSquare, Building2 } from 'lucide-react';
import normalizeOptions from '@/lib/formConfigUtils';

type FieldType = 'text' | 'textarea' | 'select' | 'boolean' | 'checklist';

export function PublicIntakeForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [config, setConfig] = useState<any[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/form-config?form=intake');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length) setConfig(data);
          else setConfig(null);
        }
      } catch (err) {
        console.error('Failed to load intake form config:', err);
        setConfig(null);
      }
    })();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const body: any = {};

    // If no config (legacy short form), build body generically
    if (!config) {
      formData.forEach((value, key) => {
        const existing = body[key];
        const val = String(value);
        if (existing === undefined) body[key] = val;
        else if (Array.isArray(existing)) existing.push(val);
        else body[key] = [existing, val];
      });
    } else {
      // Build body based on config field types so arrays/booleans are handled correctly
      for (const section of config) {
      for (const field of section.fields) {
        if (!field.visible) continue;
        const name = field.id;
        const type: FieldType = field.type;

        if (type === 'checklist') {
          const values = formData.getAll(name).map((v) => String(v));
          body[name] = values;
          continue;
        }

        if (type === 'boolean') {
          // checkbox present means true, absent means false
          body[name] = formData.get(name) !== null;
          continue;
        }

        // text, textarea, select
        const val = formData.get(name);
        body[name] = val === null ? null : String(val);
      }
      }
    }

    try {
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const bodyResp = await response.json().catch(() => ({}));
        setError(bodyResp.error || 'Unable to submit intake');
        setSaving(false);
        return;
      }

      setSubmitted(true);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Unable to submit intake');
      setSaving(false);
    }
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

  // If no config yet, render the old short form
  if (!config) {
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
            <input name="org_name" className="input-base pl-9" placeholder="Roxbury Youth Collective" required />
          </div>
        </label>

        <label className="block">
          <span className="label-base">What should we know?</span>
          <div className="relative">
            <MessageSquare size={16} className="absolute left-3 top-4 text-ink/40" />
            <textarea name="intake_message" className="input-base pl-9 min-h-[160px] resize-y" placeholder="Tell us anything helpful: goals, timeline, age group, equipment, or specific ideas." required />
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

  return (
    <form onSubmit={handleSubmit} className="card max-w-2xl mx-auto space-y-6">
      {config.map((section) => (
        <div key={section.id}>
          <div className="text-xs uppercase tracking-widest text-court font-semibold mb-2">{section.label}</div>
          <div className="space-y-4">
            {section.fields
              .filter((f: any) => (typeof f.public !== 'undefined' ? f.public : f.visible))
              .map((field: any) => {
                const name = field.id;
                const type: FieldType = field.type;
                if (type === 'textarea') {
                  return (
                    <label className="block" key={name}>
                      <span className="label-base">{field.label}</span>
                      <textarea name={name} className="input-base min-h-[120px]" placeholder={field.label} required={field.required} />
                    </label>
                  );
                }

                if (type === 'select') {
                  return (
                    <label className="block" key={name}>
                      <span className="label-base">{field.label}</span>
                      <select name={name} className="input-base" defaultValue="" required={field.required}>
                        <option value="" disabled>
                          Select…
                        </option>
                        {normalizeOptions(field.options).map((opt: string) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }

                if (type === 'boolean') {
                  return (
                    <label className="flex items-center gap-2" key={name}>
                      <input type="checkbox" name={name} value="true" className="accent-court" />
                      <span className="label-base">{field.label}</span>
                    </label>
                  );
                }

                if (type === 'checklist') {
                  return (
                    <div key={name}>
                      <div className="label-base mb-2">{field.label}</div>
                      <div className="space-y-2">
                        {normalizeOptions(field.options).map((opt: string, idx: number) => (
                          <label className="flex items-center gap-2" key={idx}>
                            <input type="checkbox" name={name} value={opt} className="accent-court" />
                            <span className="text-sm">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }

                // default: text
                return (
                  <label className="block" key={name}>
                    <span className="label-base">{field.label}</span>
                    <input name={name} className="input-base" placeholder={field.label} required={field.required} />
                  </label>
                );
              })}
          </div>
        </div>
      ))}

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>
        {saving ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
        {saving ? 'Submitting...' : 'Send intake'}
      </button>
    </form>
  );
}
