import type { Partner } from './types';
import { sendIntakeNotification } from './email';

const DEFAULT_ADMIN_EMAIL = 'ykeme0086@launchpadphilly.org';

function getRecipient() {
  return process.env.ADMIN_NOTIFICATION_EMAIL || DEFAULT_ADMIN_EMAIL;
}

export async function notifyNewIntake(partner: Partner) {
  const recipient = getRecipient();
  const adminEmails = [recipient].filter(Boolean);
  if (adminEmails.length === 0) return { sent: false };

  const createdPartner = {
    id: (partner as any).id || partner.id,
    organizationName: partner.org_name,
    contactName: partner.contact_name,
    contactEmail: partner.contact_email,
    contactPhone: partner.contact_phone,
    programType: (partner as any).desired_program_type,
    timeline: (partner as any).desired_timeline || (partner as any).firm_dates || undefined,
    createdAt: partner.created_at ? new Date(partner.created_at) : new Date(),
  };

  try {
    await sendIntakeNotification(adminEmails, createdPartner as any);
    return { sent: true };
  } catch (err) {
    console.error('notifyNewIntake failed', err);
    return { sent: false, error: String(err ?? 'error') };
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
