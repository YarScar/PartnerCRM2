import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STATUSES = [
  { label: 'New', color: '#3b82f6', sort_order: 1 },
  { label: 'In Conversation', color: '#8b5cf6', sort_order: 2 },
  { label: 'Pending — CreateAccess 🏀', color: '#e85d3c', sort_order: 3 },
  { label: 'Pending — Partner', color: '#f59e0b', sort_order: 4 },
  { label: 'Active Partner', color: '#10b981', sort_order: 5 },
  { label: 'Not a Fit / Closed', color: '#6b7280', sort_order: 6 },
];

async function main() {
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
