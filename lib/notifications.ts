import type { Partner } from './types';

const DEFAULT_ADMIN_EMAIL = 'yarascarlet45@gmail.com';

function getRecipient() {
  return process.env.ADMIN_NOTIFICATION_EMAIL || DEFAULT_ADMIN_EMAIL;
}

async function sendViaResend(opts: { from: string; to: string[]; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: 'no-resend-key' };
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: opts.from, to: opts.to, subject: opts.subject, html: opts.html }),
  });

  // Capture response body (text and JSON if possible) for debugging
  const bodyText = await response.text().catch(() => '');
  let bodyJson: any = null;
  try {
    bodyJson = bodyText ? JSON.parse(bodyText) : null;
  } catch (e) {
    bodyJson = null;
  }

  const result = { status: response.status, bodyText, bodyJson };
  if (!response.ok) {
    console.warn('[notifications] resend API error', { status: response.status, bodyText, bodyJson });
    return { sent: false, ...result };
  }

  console.log('[notifications] resend API accepted', { status: response.status, bodyJson });
  return { sent: true, ...result };
}

async function sendViaSmtp(opts: { from: string; to: string[]; subject: string; html: string }) {
  // Support generic SMTP and Gmail app password via env vars.
  const host = process.env.SMTP_HOST || process.env.GMAIL_SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || process.env.GMAIL_SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE || 'true') === 'true';
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_PASS;

  if (!user || !pass) return { sent: false, reason: 'no-smtp-credentials' };

  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

  const info = await transporter.sendMail({ from: opts.from, to: opts.to.join(','), subject: opts.subject, html: opts.html });
  return { sent: true, info };
}

async function sendMail(opts: { from: string; to: string[]; subject: string; html: string }) {
  // Prefer Resend API if configured, otherwise fallback to SMTP (Gmail-compatible).
  const from = opts.from;

  const resendResult = await sendViaResend(opts).catch((e) => ({ sent: false, reason: e?.message }));
  if (resendResult.sent) return { sent: true, via: 'resend' };

  const smtpResult = await sendViaSmtp(opts).catch((e) => ({ sent: false, reason: e?.message }));
  if (smtpResult.sent) return { sent: true, via: 'smtp', info: (smtpResult as any).info };

  console.warn('[notifications] email not sent', { resendResult, smtpResult });
  return { sent: false, resendResult, smtpResult };
}

export async function notifyNewIntake(partner: Partner) {
  const recipient = getRecipient();
  const fromEmail = process.env.NOTIFICATION_FROM_EMAIL || 'CreateAccess <notifications@createaccess.local>';

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5">
      <h2>New CreateAccess intake submission</h2>
      <p><strong>Organization:</strong> ${escapeHtml(partner.org_name)}</p>
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap">${escapeHtml(partner.intake_message || 'No message provided.')}</p>
      <p><strong>Status:</strong> ${escapeHtml(partner.status)}</p>
    </div>
  `;

  const result = await sendMail({ from: fromEmail, to: [recipient], subject: `New CreateAccess intake: ${partner.org_name}`, html });
  if (!result.sent) throw new Error(`Failed to send intake notification: ${JSON.stringify(result)}`);
  return { sent: true };
}

export async function sendPasswordResetEmail(username: string, token: string, recipientEmail?: string) {
  const recipient = recipientEmail || getRecipient();
  const fromEmail = process.env.NOTIFICATION_FROM_EMAIL || 'CreateAccess <notifications@createaccess.local>';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const resetUrl = `${baseUrl}/login/reset?token=${encodeURIComponent(token)}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5">
      <h2>Password reset requested</h2>
      <p>A password reset was requested for the account <strong>${escapeHtml(username)}</strong>.</p>
      <p>Click the link below to set a new password (link expires in 1 hour):</p>
      <p><a href="${escapeHtml(resetUrl)}">Reset account password</a></p>
    </div>
  `;

  const result = await sendMail({ from: fromEmail, to: [recipient], subject: `Password reset requested for ${username}`, html });
  if (!result.sent) {
    console.warn('[notifications] password reset not sent', result);
    return { sent: false };
  }
  return { sent: true };
}

export async function sendUsernameEmail(username: string, email: string) {
  const fromEmail = process.env.NOTIFICATION_FROM_EMAIL || 'CreateAccess <notifications@createaccess.local>';
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5">
      <h2>Account username</h2>
      <p>The username associated with this email is: <strong>${escapeHtml(username)}</strong></p>
    </div>
  `;

  const result = await sendMail({ from: fromEmail, to: [email], subject: `Your ${process.env.NEXT_PUBLIC_APP_NAME || 'CreateAccess'} account username`, html });
  if (!result.sent) {
    console.warn('[notifications] username email not sent', result);
    return { sent: false };
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
