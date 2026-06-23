// Simple SMTP test script — run with `npm run test:smtp`
require('dotenv').config();
const nodemailer = require('nodemailer');

async function main() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = String(process.env.EMAIL_SECURE || 'false') === 'true';
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const recipient = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_USER;

  if (!host || !user || !pass) {
    console.error('Missing EMAIL_HOST, EMAIL_USER or EMAIL_PASS in environment. Check your .env');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.NOTIFICATION_FROM_EMAIL || `CreateAccess <${user}>`,
      to: recipient,
      subject: 'CreateAccess SMTP test',
      text: 'This is a test message from your CreateAccess app. If you received it, SMTP is working.',
      html: '<p>This is a test message from your <strong>CreateAccess</strong> app. If you received it, SMTP is working.</p>',
    });
    console.log('Message sent:', info.messageId || info.response);
  } catch (err) {
    console.error('Failed to send test email:', err);
    process.exit(2);
  }
}

main();
