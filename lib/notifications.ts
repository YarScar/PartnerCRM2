import type { Partner } from './types';

const DEFAULT_ADMIN_EMAIL = 'ykeme0086@launchpadphilly.org';

function getRecipient() {
  return process.env.ADMIN_NOTIFICATION_EMAIL || DEFAULT_ADMIN_EMAIL;
}

export async function notifyNewIntake(partner: Partner) {
  const recipient = getRecipient();
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.NOTIFICATION_FROM_EMAIL || 'CreateAccess <notifications@createaccess.local>';

  if (!apiKey) {
    console.warn(`[notifications] Intake received for ${partner.org_name}, but RESEND_API_KEY is not set.`);
    return { sent: false };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [recipient],
      subject: `New CreateAccess intake: ${partner.org_name}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5">
          <h2>New CreateAccess intake submission</h2>
          <p><strong>Organization:</strong> ${escapeHtml(partner.org_name)}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap">${escapeHtml(partner.intake_message || 'No message provided.')}</p>
          <p><strong>Status:</strong> ${escapeHtml(partner.status)}</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Failed to send intake notification: ${response.status} ${body}`);
  }

  return { sent: true };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
