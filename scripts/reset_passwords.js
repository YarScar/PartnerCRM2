require('dotenv').config();
const {PrismaClient} = require('@prisma/client');
const {createHash} = require('crypto');

async function main() {
  const p = new PrismaClient();
  try {
    const adminHash = createHash('sha256').update('admin1').digest('base64');
    await p.user.update({ where: { username: 'admin' }, data: { password_hash: adminHash } });
    console.log('admin password updated');
  } catch (e) {
    console.error('admin update error', e.message);
  }

  try {
    const staffHash = createHash('sha256').update('staff1').digest('base64');
    await p.user.update({ where: { username: 'staff' }, data: { password_hash: staffHash } });
    console.log('staff password updated');
  } catch (e) {
    console.error('staff update error', e.message);
  }

  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
