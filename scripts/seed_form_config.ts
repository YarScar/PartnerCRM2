import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import DEFAULT_FORM_CONFIG from '../lib/defaultFormConfig';

const prisma = new PrismaClient();

async function main() {
  // remove existing non-intake config
  await prisma.formConfig.deleteMany({ where: { section_key: { not: { startsWith: 'intake:' } } } });

  let sortOrder = 0;
  for (const section of DEFAULT_FORM_CONFIG) {
    const sectionKey = section.id;
    for (const field of section.fields) {
      let optionsToStore: any = null;
      if (Array.isArray((field as any).options) && (field as any).options.length > 0) optionsToStore = (field as any).options;
      await prisma.formConfig.create({
        data: {
          section_key: sectionKey,
          section_label: section.label,
          field_key: field.id,
          field_label: field.label,
          field_type: (field as any).type,
          options: optionsToStore,
          visible: (field as any).visible,
          required: (field as any).required,
          sort_order: (field as any).sort_order ?? sortOrder,
        },
      });
      sortOrder += 1;
    }
  }

  console.log('Form config seeded.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
