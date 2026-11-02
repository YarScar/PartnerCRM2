// Sends one test email through Resend with the app's settings — run with
// `npm run test:email -- you@example.org` (defaults to the first NOTIFICATION_EMAILS address).
require('dotenv').config({ path: ['.env.local', '.env'] });
const { Resend } = require('resend');

async function main() {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'PartnerCRM <onboarding@resend.dev>';
  const recipient =
    process.argv[2] ||
    (process.env.NOTIFICATION_EMAILS || process.env.ADMIN_NOTIFICATION_EMAIL || '').split(',')[0].trim();
  if (!key) {
    console.error('Missing RESEND_API_KEY in environment. Check your .env.local');
    process.exit(1);
  }
  if (!recipient) {
    console.error('No recipient: pass an address or set NOTIFICATION_EMAILS');
    process.exit(1);
  }
  if (!process.env.EMAIL_FROM) {
    console.warn('EMAIL_FROM is not set: using Resend test sender (delivers only to the Resend account owner)');
  }

  const resend = new Resend(key);
  try {
    const { data, error } = await resend.emails.send({
      from,
      to: recipient,
      subject: 'CreateAccess email test',
      text: 'This is a test message from CreateAccess via Resend.',
      html: '<p>This is a test message from <strong>CreateAccess</strong> via Resend.</p>',
    });
    if (error) throw new Error(error.message || 'Resend error');
    console.log(`Sent from ${from} to ${recipient}:`, data?.id || data);
  } catch (err) {
    console.error('Failed to send test email via Resend:', err);
    process.exit(2);
  }
}

main();
