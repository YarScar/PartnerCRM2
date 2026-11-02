import type { Partner } from './types';
import { prisma, hasDb } from './db';
import { sendHtmlEmail, sendIntakeNotification, type SendResult } from './email';
import { getDigestData, renderDigest } from './digest';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Comma-separated list. ADMIN_NOTIFICATION_EMAIL and ADMIN_EMAILS are the older names
// for the same setting and are still read so an existing deployment keeps working.
export function parseEmailList(...values: (string | undefined)[]): string[] {
  return values
    .flatMap((v) => (v || '').split(','))
    .map((s) => s.trim().toLowerCase())
    .filter((s) => EMAIL_RE.test(s));
}

// Who gets admin notifications: every admin whose email is verified (users.email is
// only set once the verification link is clicked), plus NOTIFICATION_EMAILS. Deduped.
export async function getAdminRecipients(): Promise<string[]> {
  const fromEnv = parseEmailList(
    process.env.NOTIFICATION_EMAILS,
    process.env.ADMIN_NOTIFICATION_EMAIL,
    process.env.ADMIN_EMAILS
  );
  let fromDb: string[] = [];
  if (hasDb()) {
    const admins = await prisma.user.findMany({
      where: { role: 'admin', email: { not: null }, email_verified: true },
      select: { email: true },
    });
    fromDb = parseEmailList(admins.map((a) => a.email ?? '').join(','));
  }
  return [...new Set([...fromDb, ...fromEnv])];
}

export type NotifyResult = SendResult & { skipped?: string };

export async function notifyNewIntake(partner: Partner): Promise<NotifyResult> {
  const recipients = await getAdminRecipients();
  if (recipients.length === 0) {
    console.error('intake notification skipped: no admin has a verified email and NOTIFICATION_EMAILS is empty', {
      partnerId: partner.id,
    });
    return { sent: [], failed: [], skipped: 'no recipients' };
  }

  const result = await sendIntakeNotification(recipients, {
    id: partner.id,
    organizationName: partner.org_name,
    contactName: partner.contact_name,
    contactEmail: partner.contact_email,
    contactPhone: partner.contact_phone,
    programType: partner.desired_program_type,
    timeline: partner.desired_timeline || partner.firm_dates || undefined,
    createdAt: partner.created_at ? new Date(partner.created_at) : new Date(),
  });
  if (result.failed.length > 0) {
    console.error('intake notification: some recipients failed', { partnerId: partner.id, failed: result.failed });
  }
  return result;
}

export async function sendWeeklyDigest(): Promise<NotifyResult> {
  const recipients = await getAdminRecipients();
  if (recipients.length === 0) return { sent: [], failed: [], skipped: 'no recipients' };

  const { html, text } = renderDigest(await getDigestData());
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return sendHtmlEmail(recipients, `CreateAccess Weekly Digest — ${dateStr}`, html, text);
}
