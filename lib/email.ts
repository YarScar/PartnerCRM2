import { Resend } from 'resend';
import ensureEnvLoaded from './loadEnv';

function getResend() {
  ensureEnvLoaded();
  return new Resend(process.env.RESEND_API_KEY);
}

function wrapHtml(bodyHtml: string, title = 'CreateAccess Weekly Digest', preheader = '') {
  // A responsive, branded email template that matches the webapp styles.
  return `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        /* Reset & base */
        body { margin:0; padding:0; background:#faf7f0; color:#0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
        .container { max-width:720px; margin:28px auto; padding:18px; }
        .card { background:#ffffff; border-radius:14px; padding:28px; box-shadow:0 10px 30px rgba(13,22,26,0.06); border:1px solid rgba(14,20,24,0.03); }

        /* Header */
        .header { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:16px; }
        .brand { display:flex; gap:14px; align-items:center; }
        .logo { width:48px; height:48px; border-radius:10px; background:linear-gradient(135deg,#e85d3c,#c2421f); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-family: 'Fraunces', Georgia, serif; font-size:18px }
        h1 { margin:0; font-size:20px; color:#0a0a0a; letter-spacing:-0.2px }
        .subtitle { margin:4px 0 0; color:#4b5563; font-size:13px }
        .date { color:#6b7280; font-size:13px; text-align:right }

        /* Content styles (markdown-generated) */
        .content { margin-top:14px; color:#0a0a0a; line-height:1.6; font-size:15px }
        .content h2 { color:#e85d3c; font-size:16px; margin:18px 0 8px; }
        .content h3 { color:#0a0a0a; margin:12px 0 6px }
        .content p { margin:8px 0 }
        .content ul { margin:8px 0 16px 20px; }
        .content li { margin:8px 0; }
        .stat { display:inline-block; background:#f7f5f0; padding:10px 12px; border-radius:8px; border:1px solid rgba(14,20,24,0.04); font-weight:600; color:#0a0a0a }

        /* CTA */
        .cta { display:inline-block; background:#e85d3c; color:#fff; padding:10px 16px; border-radius:10px; text-decoration:none; font-weight:700 }

        /* Footer */
        .footer { margin-top:20px; color:#6b7280; font-size:13px; }
        .small { color:#9ca3af; font-size:12px }

        @media (max-width:600px) {
          .container { padding:12px; }
          .card { padding:18px; }
          .header { flex-direction:column; align-items:flex-start }
          .date { text-align:left }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <div class="brand">
              <div class="logo">CA</div>
              <div>
                <h1>${title}</h1>
                ${preheader ? `<div class="subtitle">${preheader}</div>` : ''}
              </div>
            </div>
            <div class="date">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
          </div>

          <div class="content">
            ${bodyHtml}
          </div>

          <div class="footer">
            <p style="margin:12px 0 0">Thanks — the CreateAccess team</p>
            <p class="small" style="margin:6px 0 0">If you no longer wish to receive these emails, update your notification preferences in the dashboard.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const subject = 'Reset your CreateAccess password';
  const htmlBody = `
    <h2 style="color:#1a1a1a;margin:0 0 8px">Reset your CreateAccess password</h2>
    <p style="color:#1a1a1a;line-height:1.4">We received a request to reset your password. Click the button below to set a new password. If you didn't request this, you can ignore this email.</p>
    <div style="margin:24px 0;text-align:center">
      <a href="${resetUrl}" style="background:#f97316;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600">Reset password</a>
    </div>
    <p style="color:#6b6b6b;font-size:13px">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="color:#6b6b6b;font-size:13px;word-break:break-all">${resetUrl}</p>
  `;

  const html = wrapHtml(htmlBody);
  const text = `Reset your CreateAccess password\n\nOpen the link to reset your password: ${resetUrl}`;

  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is missing');
  const resend = getResend();
  const { data, error } = (await resend.emails.send({
    from: 'PartnerCRM <onboarding@resend.dev>',
    to,
    subject,
    html,
    text,
  })) as any;
  if (error) throw new Error(error.message || 'Resend error');
}

export async function sendIntakeNotification(adminEmails: string[], partner: {
  id: number | string;
  organizationName: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  programType?: string;
  timeline?: string;
  createdAt: Date;
}): Promise<void> {
  const subject = `New intake form — ${partner.organizationName}`;

  const rows = [
    ['Organization', partner.organizationName],
    ['Contact name', partner.contactName || ''],
    ['Contact email', partner.contactEmail || ''],
    ['Contact phone', partner.contactPhone || ''],
    ['Program type', partner.programType || ''],
    ['Timeline', partner.timeline || ''],
    ['Submitted', partner.createdAt.toISOString()],
  ];

  const table = `
    <table style="width:100%;border-collapse:collapse">${rows
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #f1f1f1;font-weight:600;width:35%">${k}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #f1f1f1">${v}</td>
      </tr>`
    )
    .join('')}
    </table>
  `;

  const viewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/partners/${partner.id}`;
  const htmlBody = `
    <h2 style="color:#1a1a1a;margin:0 0 8px">New CreateAccess intake submission</h2>
    ${table}
    <div style="margin:20px 0;text-align:center">
      <a href="${viewUrl}" style="background:#f97316;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600">View in Dashboard</a>
    </div>
  `;

  const html = wrapHtml(htmlBody);
  const text = `New intake: ${partner.organizationName}\nView: ${viewUrl}`;

  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is missing');
  const resend = getResend();
  for (const recipient of adminEmails) {
    try {
      const { data, error } = (await resend.emails.send({
        from: 'PartnerCRM <onboarding@resend.dev>',
        to: recipient,
        subject,
        html,
        text,
      })) as any;
      if (error) throw new Error(error.message || 'Resend error');
    } catch (err) {
      console.error('sendIntakeNotification error for', recipient, err);
    }
  }
}

export async function sendHtmlEmail(to: string[], subject: string, htmlContent: string): Promise<void> {
  const preheader = subject;
  const html = wrapHtml(htmlContent, subject, preheader);
  const text = htmlContent.replace(/<[^>]+>/g, '');
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is missing');
  const resend = getResend();
  for (const t of to) {
    try {
      const { data, error } = (await resend.emails.send({
        from: 'PartnerCRM <onboarding@resend.dev>',
        to: t,
        subject,
        html,
        text,
      })) as any;
      if (error) throw new Error(error.message || 'Resend error');
    } catch (err) {
      console.error('sendHtmlEmail error for', t, err);
    }
  }
}

export async function sendEmailVerification(to: string, verifyUrl: string): Promise<void> {
  const subject = 'Verify your email for CreateAccess';
  const htmlBody = `
    <h2 style="color:#1a1a1a;margin:0 0 8px">Verify your email address</h2>
    <p style="color:#1a1a1a;line-height:1.4">Click the button below to verify your email for CreateAccess. The link will expire in 24 hours.</p>
    <div style="margin:20px 0;text-align:center">
      <a href="${verifyUrl}" style="background:#f97316;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600">Verify email</a>
    </div>
    <p style="color:#6b6b6b;font-size:13px">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="color:#6b6b6b;font-size:13px;word-break:break-all">${verifyUrl}</p>
  `;

  const html = wrapHtml(htmlBody, subject, 'Verify your CreateAccess email');
  const text = `Verify your CreateAccess email: ${verifyUrl}`;

  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is missing');
  const resend = getResend();
  const { data, error } = (await resend.emails.send({
    from: 'PartnerCRM <onboarding@resend.dev>',
    to,
    subject,
    html,
    text,
  })) as any;
  if (error) throw new Error(error.message || 'Resend error');
}
