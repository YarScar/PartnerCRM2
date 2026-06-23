// Load local environment variables early so server code sees them.
// This is helpful in development when .env is present in the project root.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config({ path: '.env' });
} catch (e) {
  // ignore if dotenv isn't available
}

/** @type {import('next').NextConfig} */
// Disable Strict Mode in development to avoid double-rendering overhead.
// Enable it in production for safety.
const nextConfig = {
  reactStrictMode: process.env.NODE_ENV === 'production',
};

module.exports = nextConfig;
