import { NextRequest, NextResponse } from 'next/server';
import { prisma, hasDb } from '@/lib/db';
import DEFAULT_FORM_CONFIG from '@/lib/defaultFormConfig';

function intakePrefix(form: string | null) {
  return form === 'intake' ? 'intake:' : '';
}

export async function GET(req: NextRequest) {
  // If no DATABASE_URL is configured, return the local default config immediately
  if (!hasDb()) return NextResponse.json(DEFAULT_FORM_CONFIG);

  try {
    const url = new URL(req.url);
    const form = url.searchParams.get('form');
    const prefix = intakePrefix(form);

    const all = await prisma.formConfig.findMany({
      orderBy: [{ sort_order: 'asc' }],
    });

    // Filter rows by prefix: intake rows start with 'intake:', client rows do not
    const rows = all.filter((r) => {
      const isIntake = r.section_key.startsWith('intake:');
      return form === 'intake' ? isIntake : !isIntake;
    });

    const sections = new Map<string, any>();
    rows.forEach((row) => {
      const sectionKey = prefix ? row.section_key.replace(/^intake:/, '') : row.section_key;
      if (!sections.has(sectionKey)) {
        sections.set(sectionKey, {
          id: sectionKey,
          label: row.section_label,
          fields: [],
        });
      }
      const meta = row.options && (row.options as any).meta ? (row.options as any).meta : {};
      sections.get(sectionKey).fields.push({
        id: row.field_key,
        label: row.field_label,
        type: row.field_type as any,
        visible: row.visible ?? true,
        required: row.required ?? false,
        public: meta.public ?? undefined,
        options: row.options,
        sort_order: row.sort_order,
      });
    });

    return NextResponse.json(Array.from(sections.values()));
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const form = url.searchParams.get('form');
    const prefix = intakePrefix(form);

    const sections = await req.json();

    // Delete existing config for this form only
    if (form === 'intake') {
      await prisma.formConfig.deleteMany({ where: { section_key: { startsWith: 'intake:' } } });
    } else {
      await prisma.formConfig.deleteMany({ where: { section_key: { not: { startsWith: 'intake:' } } } });
    }

    // Insert new config (prefix section keys for intake when needed)
    let sortOrder = 0;
    for (const section of sections) {
      const sectionKey = `${prefix}${section.id}`;
      for (const field of section.fields) {
        // Support storing metadata inside options as { items?: [...], meta?: {...} }
        let optionsToStore: any = null;
        const hasOptionsArray = Array.isArray(field.options) && field.options.length > 0;
        const incomingMeta = (field as any).meta ? { ...(field as any).meta } : {};
        if (typeof (field as any).public !== 'undefined') incomingMeta.public = (field as any).public;
        const hasMeta = incomingMeta && Object.keys(incomingMeta).length > 0;
        if (hasOptionsArray && hasMeta) optionsToStore = { items: field.options, meta: incomingMeta };
        else if (hasMeta) optionsToStore = { meta: incomingMeta };
        else if (hasOptionsArray) optionsToStore = field.options;

        await prisma.formConfig.create({
          data: {
            section_key: sectionKey,
            section_label: section.label,
            field_key: field.id,
            field_label: field.label,
            field_type: field.type,
            options: optionsToStore,
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
