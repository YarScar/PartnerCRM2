import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT || 587),
  secure: process.env.EMAIL_SECURE === 'true' || false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function wrapHtml(bodyHtml: string, title = 'CreateAccess Weekly Digest', preheader = '') {
  // A simple responsive email template with a header, content card, and footer.
  return `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        /* Generic reset */
        body { margin:0; padding:0; background:#f6f5f2; color:#111827; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
        .container { max-width:720px; margin:24px auto; padding:16px; }
        .card { background:#ffffff; border-radius:12px; padding:24px; box-shadow:0 8px 18px rgba(17,24,39,0.06); }
        .header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; }
        .brand { display:flex; gap:12px; align-items:center; }
        .logo { width:44px; height:44px; border-radius:8px; background:linear-gradient(135deg,#f97316,#f59e0b); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; }
        h1 { margin:0; font-size:20px; color:#0f172a; }
        .subtitle { margin:4px 0 0; color:#6b7280; font-size:13px }
        .content { margin-top:12px; color:#0f172a; line-height:1.55; }
        .footer { margin-top:18px; color:#6b7280; font-size:13px; }
        .cta { display:inline-block; background:#0ea5a3; color:#fff; padding:10px 14px; border-radius:8px; text-decoration:none; font-weight:600 }
        @media (max-width:600px) {
          .container { padding:12px; }
          .card { padding:16px; }
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
            <div style="text-align:right;color:#6b7280;font-size:12px">${new Date().toLocaleDateString('en-US')}</div>
          </div>

          <div class="content">
            ${bodyHtml}
          </div>

          <div class="footer">
            <p style="margin:12px 0 0">Thanks — the CreateAccess team</p>
            <p style="margin:6px 0 0;color:#9ca3af;font-size:12px">If you no longer wish to receive these emails, update your notification preferences in the dashboard.</p>
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

  await transporter.sendMail({
    from: `CreateAccess <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
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

  for (const to of adminEmails) {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('SMTP credentials missing: EMAIL_USER or EMAIL_PASS');
        return;
      }
      await transporter.sendMail({
        from: `CreateAccess <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
        html,
      });
    } catch (err) {
      console.error('sendIntakeNotification error for', to, err);
    }
  }
}

export async function sendHtmlEmail(to: string[], subject: string, htmlContent: string): Promise<void> {
  const preheader = subject;
  const html = wrapHtml(htmlContent, subject, preheader);
  const text = htmlContent.replace(/<[^>]+>/g, '');
  for (const t of to) {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('SMTP credentials missing: EMAIL_USER or EMAIL_PASS');
        return;
      }
      await transporter.sendMail({
        from: `CreateAccess <${process.env.EMAIL_USER}>`,
        to: t,
        subject,
        text,
        html,
      });
    } catch (err) {
      console.error('sendHtmlEmail error for', t, err);
    }
  }
}
