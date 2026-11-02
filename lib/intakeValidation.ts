// Checks for the public, no-login intake form (app/api/intake/route.ts).

export const MAX_INTAKE_BYTES = 100_000;
const MAX_FIELD_CHARS = 5_000;
const MAX_ORG_NAME_CHARS = 200;
const HONEYPOT_FIELD = 'company_website';

export type IntakeCheck =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; status: number; error: string }
  // Looks like a bot: answer as if it worked, save and send nothing.
  | { ok: false; spam: true };

function tooLong(value: unknown): boolean {
  if (typeof value === 'string') return value.length > MAX_FIELD_CHARS;
  if (Array.isArray(value)) return value.length > 200 || value.some(tooLong);
  if (value && typeof value === 'object') return Object.values(value).some(tooLong);
  return false;
}

export function checkIntake(rawBody: string): IntakeCheck {
  if (new TextEncoder().encode(rawBody).length > MAX_INTAKE_BYTES) {
    return { ok: false, status: 413, error: 'Submission is too large' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return { ok: false, status: 400, error: 'Invalid submission' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, status: 400, error: 'Invalid submission' };
  }

  const { [HONEYPOT_FIELD]: trap, ...data } = parsed as Record<string, unknown>;
  if (typeof trap === 'string' && trap.trim() !== '') return { ok: false, spam: true };

  // Same fallbacks lib/partners.ts normalizePartnerKeys accepts.
  const orgName = data.org_name ?? data.name ?? data.organization ?? data.org;
  if (typeof orgName !== 'string' || !orgName.trim()) {
    return { ok: false, status: 400, error: 'Organization name is required' };
  }
  if (orgName.length > MAX_ORG_NAME_CHARS) {
    return { ok: false, status: 400, error: `Organization name must be ${MAX_ORG_NAME_CHARS} characters or fewer` };
  }
  if (tooLong(data)) {
    return { ok: false, status: 400, error: `Each answer must be ${MAX_FIELD_CHARS} characters or fewer` };
  }

  // These are set by the server, never by the public.
  delete data.id;
  delete data.status;
  delete data.source;
  delete data.notes;
  delete data.created_at;
  delete data.updated_at;

  return { ok: true, data };
}
