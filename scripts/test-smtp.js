// Simple SMTP test script — run with `npm run test:smtp`
// Simple Resend test script — run with `npm run test:smtp`
require('dotenv').config();
const { Resend } = require('resend');

async function main() {
  const key = process.env.RESEND_API_KEY;
  const recipient = process.env.ADMIN_NOTIFICATION_EMAIL || null;
  if (!key) {
    console.error('Missing RESEND_API_KEY in environment. Check your .env');
    process.exit(1);
  }
  if (!recipient) {
    console.error('Missing admin recipient (ADMIN_NOTIFICATION_EMAIL)');
    process.exit(1);
  }

  const resend = new Resend(key);
  try {
    const { data, error } = await resend.emails.send({
      from: 'PartnerCRM <onboarding@resend.dev>',
      to: recipient,
      subject: 'CreateAccess Resend test',
      text: 'This is a test message from CreateAccess via Resend.',
      html: '<p>This is a test message from <strong>CreateAccess</strong> via Resend.</p>',
    });
    if (error) throw new Error(error.message || 'Resend error');
    console.log('Message queued:', data?.id || data);
  } catch (err) {
    console.error('Failed to send test email via Resend:', err);
    process.exit(2);
  }
}

main();
