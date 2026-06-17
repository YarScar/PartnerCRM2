// Load local environment variables early so server code sees them.
// This is helpful in development when .env is present in the project root.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config({ path: '.env' });
} catch (e) {
  // ignore if dotenv isn't available
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;
