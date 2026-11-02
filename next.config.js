/** @type {import('next').NextConfig} */
// Disable Strict Mode in development to avoid double-rendering overhead.
// Enable it in production for safety.
const nextConfig = {
  reactStrictMode: process.env.NODE_ENV === 'production',
};

module.exports = nextConfig;
