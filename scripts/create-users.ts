/**
 * Creates staff/admin accounts from users.local.json (gitignored — copy
 * users.example.json). Each person signs in with their email and the temporary
 * password, then must choose their own password before using the app.
 *
 *   npm run users:create
 *
 * Uses DATABASE_URL from .env.local. To create accounts in production, run it with
 * the production DATABASE_URL instead. Existing accounts are never changed.
 */
import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { hashPassword, MIN_PASSWORD_LENGTH } from '../lib/auth';

config({ path: ['.env.local', '.env'] });

const FILE = 'users.local.json';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type NewUser = { email: string; name: string; role: 'admin' | 'staff'; temporaryPassword: string };

function loadUsers(): NewUser[] {
  let raw: string;
  try {
    raw = readFileSync(FILE, 'utf8');
  } catch {
    throw new Error(`${FILE} not found. Copy users.example.json to ${FILE} and fill it in.`);
  }
  const list = JSON.parse(raw);
  if (!Array.isArray(list) || list.length === 0) throw new Error(`${FILE} must be a list of people`);

  return list.map((u: Partial<NewUser>, i: number) => {
    const where = `${FILE} entry ${i + 1}`;
    const email = String(u.email ?? '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) throw new Error(`${where}: "email" is not a valid email`);
    if (!u.name?.trim()) throw new Error(`${where}: "name" is required`);
    if (u.role !== 'admin' && u.role !== 'staff') throw new Error(`${where}: "role" must be "admin" or "staff"`);
    if (!u.temporaryPassword || u.temporaryPassword.length < MIN_PASSWORD_LENGTH) {
      throw new Error(`${where}: "temporaryPassword" must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }
    return { email, name: u.name.trim(), role: u.role, temporaryPassword: u.temporaryPassword };
  });
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set (.env.local)');
  const users = loadUsers();
  const prisma = new PrismaClient();

  try {
    for (const u of users) {
      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: u.email, mode: 'insensitive' } },
            { email: { equals: u.email, mode: 'insensitive' } },
          ],
        },
      });
      if (existing) {
        console.log(`skipped  ${u.email} (already has an account)`);
        continue;
      }

      await prisma.user.create({
        data: {
          username: u.email,
          // The address came from an admin, so it counts as verified: it receives
          // notifications and can be used for "Forgot password".
          email: u.email,
          email_verified: true,
          display_name: u.name,
          role: u.role,
          password_hash: await hashPassword(u.temporaryPassword),
          must_change_password: true,
        },
      });
      console.log(`created  ${u.email} (${u.role})`);
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log(`\nDone. Delete ${FILE} now; it holds the temporary passwords.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
