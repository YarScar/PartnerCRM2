import { timingSafeEqual } from 'crypto';

// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` on every scheduled call.
// Without CRON_SECRET set, scheduled calls are refused.
export function isCronRequest(authorization: string | null, secret = process.env.CRON_SECRET): boolean {
  if (!secret || !authorization) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(authorization);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
