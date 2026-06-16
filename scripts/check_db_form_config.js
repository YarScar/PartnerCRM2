(async function(){
  try{
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const rows = await prisma.formConfig.findMany({ orderBy: { sort_order: 'asc' } });
    console.log('FormConfig rows count:', rows.length);
    console.log(rows.slice(-10));
    await prisma.$disconnect();
  }catch(err){
    console.error('DB query error:', err);
    process.exit(1);
  }
})();
