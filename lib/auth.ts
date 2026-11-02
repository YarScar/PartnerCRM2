// Imported by middleware.ts (Edge runtime): keep Node-only modules out of this file.
import { prisma } from './db';

export type UserRole = 'admin' | 'staff';

export interface AuthUser {
  username: string;
  displayName: string;
  role: UserRole;
  email?: string;
  // Set for accounts created with a temporary password (scripts/create-users.ts):
  // middleware sends them to Settings until they choose their own.
  mustChangePassword?: boolean;
}

// Where someone who still has to replace their temporary password may go.
const ALLOWED_BEFORE_PASSWORD_CHANGE = ['/settings', '/api/account/change-password', '/api/auth/logout', '/api/auth/me', '/login'];

export function allowedBeforePasswordChange(pathname: string) {
  return ALLOWED_BEFORE_PASSWORD_CHANGE.includes(pathname);
}

export interface SessionPayload extends AuthUser {
  exp: number;
}

export const SESSION_COOKIE_NAME = 'createaccess_session';
// Keep sessions alive for a week so staff do not have to log in constantly.
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const SALT_ROUNDS = 12;
export const MIN_PASSWORD_LENGTH = 8;
const DEV_AUTH_SECRET = 'createaccess-dev-secret';

// Anyone who knows the signing secret can forge an admin session, so production
// refuses to run on the public dev fallback (or a short secret). Read per call,
// not at import, so `next build` works without the secret.
export function getAuthSecret(env: Record<string, string | undefined> = process.env): string {
  const secret = env.AUTH_SECRET?.trim();
  if (secret && secret.length >= 32) return secret;
  if (env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET must be set to a random string of at least 32 characters');
  }
  return secret || DEV_AUTH_SECRET;
}

function toBase64Url(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return atob(normalized + padding);
}

async function importKey() {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getAuthSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signPayload(payload: string) {
  // Sign the session so the browser cannot tamper with it.
  const key = await importKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return toBase64Url(String.fromCharCode(...new Uint8Array(signature)));
}

async function verifySignature(payload: string, signature: string) {
  // Check that the token was really created by this app.
  const key = await importKey();
  const signatureBytes = Uint8Array.from(fromBase64Url(signature), (char) => char.charCodeAt(0));
  return crypto.subtle.verify('HMAC', key, signatureBytes, new TextEncoder().encode(payload));
}

async function hashLegacyPassword(password: string): Promise<string> {
  // This matches the older password format so existing accounts still work.
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)));
}

export async function hashPassword(password: string): Promise<string> {
  // New passwords are hashed with bcrypt instead of the older SHA-256 helper.
  const bcrypt = (await import('bcryptjs')).default as typeof import('bcryptjs');
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash) return false;

  if (hash.startsWith('$2')) {
    // bcrypt hashes start with $2, so we can compare them directly.
    const bcrypt = (await import('bcryptjs')).default as typeof import('bcryptjs');
    return bcrypt.compare(password, hash);
  }

  // If a record still has an old hash, compare it the old way.
  const legacyHash = await hashLegacyPassword(password);
  return legacyHash === hash;
}

/**
 * Authenticate user with database-backed credentials (bcrypt; old SHA-256 hashes are
 * still accepted and upgraded on the next successful login).
 */
export async function authenticate(username: string, password: string): Promise<AuthUser | null> {
  // Look up the account first, then compare the password. Usernames are matched
  // case-insensitively so people whose username is their email can type it any way.
  const account = await prisma.user.findFirst({
    where: { username: { equals: username.trim(), mode: 'insensitive' } },
    select: {
      id: true,
      username: true,
      password_hash: true,
      display_name: true,
      role: true,
      email: true,
      must_change_password: true,
    },
  });

  if (!account) return null;

  const passwordValid = await verifyPassword(password, account.password_hash);
  if (!passwordValid) return null;

  // Upgrade an old unsalted SHA-256 hash to bcrypt now that we have the plain password.
  if (!account.password_hash.startsWith('$2')) {
    await prisma.user.update({ where: { id: account.id }, data: { password_hash: await hashPassword(password) } });
  }

  return {
    username: account.username,
    displayName: account.display_name,
    role: account.role as UserRole,
    email: account.email ?? undefined,
    mustChangePassword: account.must_change_password,
  };
}

/**
 * Set a user's own new password. Also clears the "must change password" flag set
 * for accounts created with a temporary password.
 */
export async function changePassword(username: string, newPassword: string): Promise<boolean> {
  // Re-hash the new password before storing it.
  const passwordHash = await hashPassword(newPassword);

  try {
    await prisma.user.update({
      where: { username },
      data: { password_hash: passwordHash, must_change_password: false },
    });
    return true;
  } catch {
    return false;
  }
}

export async function createSessionToken(user: AuthUser): Promise<string> {
  // Put the user info into a signed token for the session cookie.
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + SESSION_TTL_MS,
  };
  // btoa only takes Latin-1, so encode the JSON as UTF-8 bytes first: a display name
  // like "José" or "Nguyễn" would otherwise make login throw.
  const encodedPayload = toBase64Url(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(payload))));
  const signature = await signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function getSessionFromToken(token?: string | null): Promise<AuthUser | null> {
  if (!token) return null;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  try {
    // If the signature fails (or isn't even valid base64), treat the token like it never existed.
    if (!(await verifySignature(encodedPayload, signature))) return null;
    const bytes = Uint8Array.from(fromBase64Url(encodedPayload), (char) => char.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as SessionPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return {
      username: payload.username,
      displayName: payload.displayName,
      role: payload.role,
      email: payload.email,
      mustChangePassword: payload.mustChangePassword === true,
    };
  } catch {
    return null;
  }
}

export function isAdmin(user: AuthUser | null | undefined) {
  // Tiny helper so admin checks stay readable everywhere else.
  return user?.role === 'admin';
}
