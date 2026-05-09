export type UserRole = 'admin' | 'staff';

export interface AuthUser {
  username: string;
  displayName: string;
  role: UserRole;
}

interface AccountRecord extends AuthUser {
  password: string;
}

export interface SessionPayload extends AuthUser {
  exp: number;
}

export const SESSION_COOKIE_NAME = 'createaccess_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const AUTH_SECRET = process.env.AUTH_SECRET || 'createaccess-dev-secret';

const DEFAULT_ACCOUNTS: AccountRecord[] = [
  {
    username: process.env.ADMIN_ACCOUNT_USERNAME || 'admin',
    password: process.env.ADMIN_ACCOUNT_PASSWORD || 'admin123',
    displayName: 'Admin',
    role: 'admin',
  },
  {
    username: process.env.STAFF_ACCOUNT_USERNAME || 'staff',
    password: process.env.STAFF_ACCOUNT_PASSWORD || 'staff123',
    displayName: 'Staff',
    role: 'staff',
  },
];

let _accountsCache: AccountRecord[] | null = null;

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

export function getPublicAccountList() {
  return DEFAULT_ACCOUNTS.map(({ username, displayName, role }) => ({ username, displayName, role }));
}

export async function authenticate(username: string, password: string): Promise<AuthUser | null> {
  if (!_accountsCache) {
    _accountsCache = await Promise.all(
      DEFAULT_ACCOUNTS.map(async (acc) => ({
        ...acc,
        password: await hashPassword(acc.password),
      }))
    );
  }

  const account = _accountsCache.find((candidate) => candidate.username === username.trim());
  if (!account) return null;

  const passwordValid = await verifyPassword(password, account.password);
  if (!passwordValid) return null;

  return {
    username: account.username,
    displayName: account.displayName,
    role: account.role,
  };
}

export async function changePassword(username: string, newPassword: string): Promise<boolean> {
  if (!_accountsCache) {
    _accountsCache = await Promise.all(
      DEFAULT_ACCOUNTS.map(async (acc) => ({
        ...acc,
        password: await hashPassword(acc.password),
      }))
    );
  }

  const accountIdx = _accountsCache.findIndex((a) => a.username === username);
  if (accountIdx === -1) return false;

  const passwordHash = await hashPassword(newPassword);
  _accountsCache[accountIdx].password = passwordHash;
  return true;
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
    };
  } catch {
    return null;
  }
}

export function isAdmin(user: AuthUser | null | undefined) {
  return user?.role === 'admin';
}
