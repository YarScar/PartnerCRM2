import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const config = await prisma.formConfig.findMany({
      orderBy: [{ sort_order: 'asc' }],
    });

    // Transform flat structure into nested sections
    const sections = new Map();
    config.forEach(row => {
      if (!sections.has(row.section_key)) {
        sections.set(row.section_key, {
          id: row.section_key,
          label: row.section_label,
          fields: [],
        });
      }
      sections.get(row.section_key).fields.push({
        id: row.field_key,
        label: row.field_label,
        type: row.field_type as any,
        visible: row.visible ?? true,
        required: row.required ?? false,
        options: row.options,
          sort_order: row.sort_order,
      });
    });

    return NextResponse.json(Array.from(sections.values()));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sections = await req.json();

    // Delete all existing config
    await prisma.formConfig.deleteMany({});

    // Insert new config
    let sortOrder = 0;
    for (const section of sections) {
      for (const field of section.fields) {
        await prisma.formConfig.create({
          data: {
            section_key: section.id,
            section_label: section.label,
            field_key: field.id,
            field_label: field.label,
            field_type: field.type,
            options: field.options || null,
            visible: field.visible,
            required: field.required,
            sort_order: field.sort_order ?? sortOrder,
          },
        });
        sortOrder += 1;
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
