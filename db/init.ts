/**
 * Prisma setup script.
 * Run with: npm run db:init
 *
 * This script seeds required status rows after schema sync.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

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

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set.');
    process.exit(1);
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

  console.log('Prisma seed/setup complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
