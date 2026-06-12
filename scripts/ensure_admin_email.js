require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const email = 'yarascarlet45@gmail.com';

  console.log('Checking for user with email:', email);
  const userByEmail = await prisma.user.findUnique({ where: { email } }).catch(() => null);
  if (userByEmail) {
    console.log('Found user with that email:', JSON.stringify({ id: userByEmail.id, username: userByEmail.username, role: userByEmail.role }));
    await prisma.$disconnect();
    return;
  }

  console.log('No user found with that email. Looking for an admin account...');
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!admin) {
    console.error('No admin user found. Cannot assign email.');
    await prisma.$disconnect();
    process.exitCode = 2;
    return;
  }

  console.log('Admin user found:', JSON.stringify({ id: admin.id, username: admin.username }));
  console.log('Updating admin email to:', email);
  const updated = await prisma.user.update({ where: { id: admin.id }, data: { email } });
  console.log('Update result:', JSON.stringify({ id: updated.id, username: updated.username, email: updated.email }));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Script error:', e);
  process.exitCode = 1;
});
