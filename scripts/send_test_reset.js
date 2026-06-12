require('dotenv').config();
const crypto = require('crypto');
const fetch = globalThis.fetch || require('node-fetch');

async function toBase64Url(input) {
  return Buffer.from(input).toString('base64url');
}

async function signPayload(encodedPayload, secret) {
  const hmac = crypto.createHmac('sha256', secret).update(encodedPayload).digest();
  return Buffer.from(hmac).toString('base64url');
}

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  const authSecret = process.env.AUTH_SECRET || 'createaccess-dev-secret';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const recipient = 'yarascarlet45@gmail.com';
  const username = 'admin';

  if (!apiKey) {
    console.error('RESEND_API_KEY not set in .env');
    process.exit(1);
  }

  const payload = { username, exp: Date.now() + 1000 * 60 * 60 };
  const encodedPayload = await toBase64Url(JSON.stringify(payload));
  const signature = await signPayload(encodedPayload, authSecret);
  const token = `${encodedPayload}.${signature}`;
  const resetUrl = `${baseUrl}/login/reset?token=${encodeURIComponent(token)}`;

  const from = process.env.NOTIFICATION_FROM_EMAIL || 'CreateAccess <notifications@createaccess.local>';
  const html = `\n    <div style="font-family: Arial, sans-serif; line-height: 1.5">\n      <h2>Password reset requested (test)</h2>\n      <p>A password reset was requested for the account <strong>${username}</strong>.</p>\n      <p>Use this link to set a new password (expires in 1 hour):</p>\n      <p><a href="${resetUrl}">${resetUrl}</a></p>\n    </div>\n  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [recipient], subject: `Test password reset for ${username}`, html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('Resend error', res.status, body);
    process.exit(1);
  }

  console.log('Test reset email sent to', recipient);
  console.log('Token (for manual use):', token);
}

main().catch((e) => {
  console.error('Script error', e);
  process.exit(1);
});
