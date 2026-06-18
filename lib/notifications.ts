import type { Partner } from './types';
import nodemailer from 'nodemailer';

const DEFAULT_ADMIN_EMAIL = 'ykeme0086@launchpadphilly.org';

function getRecipient() {
  return process.env.ADMIN_NOTIFICATION_EMAIL || DEFAULT_ADMIN_EMAIL;
}

export async function notifyNewIntake(partner: Partner) {
  const recipient = getRecipient();
  const fromEmail = process.env.NOTIFICATION_FROM_EMAIL || 'CreateAccess <notifications@createaccess.local>';
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = String(process.env.EMAIL_SECURE || 'false') === 'true';
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    console.warn(`[notifications] Intake received for ${partner.org_name}, but SMTP is not configured (EMAIL_HOST/EMAIL_USER/EMAIL_PASS).`);
    return { sent: false };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5">
      <h2>New CreateAccess intake submission</h2>
      <p><strong>Organization:</strong> ${escapeHtml(partner.org_name)}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap">${escapeHtml(partner.intake_message || 'No message provided.')}</p>
      <p><strong>Status:</strong> ${escapeHtml(partner.status)}</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: fromEmail,
    to: recipient,
    subject: `New CreateAccess intake: ${partner.org_name}`,
    html,
  });

  return { sent: Boolean(info.messageId), info: info.messageId };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
