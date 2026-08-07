import { NextRequest } from 'next/server';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const limitStore = new Map<string, RateLimitEntry>();

function getClientIdentifier(req: NextRequest, prefix: string) {
  // Use IP-ish info so one client cannot spam the same action forever.
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || req.headers.get('x-real-ip') || 'unknown';
  return `${prefix}:${ip}`;
}

export function getRateLimitKey(req: NextRequest, prefix: string) {
  // Prefix keeps each endpoint separate in the in-memory store.
  return getClientIdentifier(req, prefix);
}

export function checkRateLimit(key: string, limit = 5, windowMs = 15 * 60 * 1000) {
  // This is a simple in-memory limit, which is enough for a small app.
  const now = Date.now();
  const entry = limitStore.get(key);

  if (!entry || now > entry.resetAt) {
    limitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}
