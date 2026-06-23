import { prisma } from './db';

export type UserRole = 'admin' | 'staff';

export interface AuthUser {
  username: string;
  displayName: string;
  role: UserRole;
  email?: string;
}

export interface SessionPayload extends AuthUser {
  exp: number;
}

export const SESSION_COOKIE_NAME = 'createaccess_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const AUTH_SECRET = process.env.AUTH_SECRET || 'createaccess-dev-secret';

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
    new TextEncoder().encode(AUTH_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signPayload(payload: string) {
  const key = await importKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return toBase64Url(String.fromCharCode(...new Uint8Array(signature)));
}

async function verifySignature(payload: string, signature: string) {
  const key = await importKey();
  const signatureBytes = Uint8Array.from(fromBase64Url(signature), (char) => char.charCodeAt(0));
  return crypto.subtle.verify('HMAC', key, signatureBytes, new TextEncoder().encode(payload));
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}

/**
 * Authenticate user with database-backed credentials.
 * IMPORTANT: Passwords are hashed using SHA-256 (suitable for development).
 * For production, use bcrypt or similar with salt rounds.
 */
export async function authenticate(username: string, password: string): Promise<AuthUser | null> {
  const account = await prisma.user.findUnique({
    where: { username: username.trim() },
  });

  if (!account) return null;

  const passwordValid = await verifyPassword(password, account.password_hash);
  if (!passwordValid) return null;

  return {
    username: account.username,
    displayName: account.display_name,
    role: account.role as UserRole,
  };
}

/**
 * Change password for authenticated user using database.
 */
export async function changePassword(username: string, newPassword: string): Promise<boolean> {
  const passwordHash = await hashPassword(newPassword);

  try {
    await prisma.user.update({
      where: { username },
      data: { password_hash: passwordHash },
    });
    return true;
  } catch {
    return false;
  }
}

export async function createSessionToken(user: AuthUser): Promise<string> {
  const payload: SessionPayload = {
    ...user,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = await signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function getSessionFromToken(token?: string | null): Promise<AuthUser | null> {
  if (!token) return null;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const valid = await verifySignature(encodedPayload, signature);
  if (!valid) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return {
      username: payload.username,
      displayName: payload.displayName,
      role: payload.role,
      email: (payload as any).email,
    };
  } catch {
    return null;
  }
}

export function isAdmin(user: AuthUser | null | undefined) {
  return user?.role === 'admin';
}
