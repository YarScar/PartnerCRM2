import 'dotenv/config';
import { createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { mockNotes, mockPartners } from '../lib/mock-data';
import { toPrismaData } from '../lib/partners';

const prisma = new PrismaClient();

const STATUSES = [
  { label: 'Pending Intake', color: '#f43f5e', sort_order: 1 },
  { label: 'New', color: '#3b82f6', sort_order: 2 },
  { label: 'In Conversation', color: '#8b5cf6', sort_order: 3 },
  { label: 'Pending — CreateAccess 🏀', color: '#e85d3c', sort_order: 4 },
  { label: 'Pending — Partner', color: '#f59e0b', sort_order: 5 },
  { label: 'Active Partner', color: '#10b981', sort_order: 6 },
  { label: 'Not a Fit / Closed', color: '#6b7280', sort_order: 7 },
];

const DEFAULT_ACCOUNTS = [
  {
    username: process.env.ADMIN_ACCOUNT_USERNAME || 'admin',
    display_name: 'Admin',
    role: 'admin' as const,
    password: process.env.ADMIN_ACCOUNT_PASSWORD || 'admin123',
  },
  {
    username: process.env.STAFF_ACCOUNT_USERNAME || 'staff',
    display_name: 'Staff',
    role: 'staff' as const,
    password: process.env.STAFF_ACCOUNT_PASSWORD || 'staff123',
  },
];

function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('base64');
}

async function resetSequence(tableName: string) {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), COALESCE((SELECT MAX(id) FROM "${tableName}"), 1), true)`
  );
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set.');
  }

  for (const status of STATUSES) {
    await prisma.partnerStatus.upsert({
      where: { label: status.label },
      update: {
        color: status.color,
        sort_order: status.sort_order,
      },
      create: status,
    });
  }

  for (const account of DEFAULT_ACCOUNTS) {
    await prisma.user.upsert({
      where: { username: account.username },
      update: {
        display_name: account.display_name,
        role: account.role,
        password_hash: hashPassword(account.password),
      },
      create: {
        username: account.username,
        display_name: account.display_name,
        role: account.role,
        password_hash: hashPassword(account.password),
      },
    });
  }

  for (const partner of mockPartners) {
    await prisma.partner.upsert({
      where: { id: partner.id },
      update: {
        ...toPrismaData(partner),
        created_at: new Date(partner.created_at),
        updated_at: new Date(partner.updated_at),
      },
      create: {
        id: partner.id,
        ...toPrismaData(partner),
        created_at: new Date(partner.created_at),
        updated_at: new Date(partner.updated_at),
      },
    });
  }

  for (const note of mockNotes) {
    await prisma.partnerNote.upsert({
      where: { id: note.id },
      update: {
        partner_id: note.partner_id,
        body: note.body,
        author: note.author ?? null,
        created_at: new Date(note.created_at),
      },
      create: {
        id: note.id,
        partner_id: note.partner_id,
        body: note.body,
        author: note.author ?? null,
        created_at: new Date(note.created_at),
      },
    });
  }

  await resetSequence('partner_statuses');
  await resetSequence('users');
  await resetSequence('partners');
  await resetSequence('partner_notes');

  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
