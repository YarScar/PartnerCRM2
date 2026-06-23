import { NextRequest, NextResponse } from 'next/server';
import apiError from '@/lib/apiError';
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

    // Filter rows by prefix: intake rows start with 'intake:'.
    // Also include non-prefixed rows that have options.meta.public === true when requesting the public intake.
    let rows = all.filter((r) => {
      const isIntake = r.section_key.startsWith('intake:');
      if (form === 'intake') {
        if (isIntake) return true;
        try {
          const meta = r.options && (r.options as any).meta;
          if (meta && meta.public === true) return true;
        } catch (e) {
          // ignore
        }
        return false;
      }
      return !isIntake;
    });

    // Deduplicate rows by normalized section + field, preferring explicit intake: rows when present.
    const deduped = new Map<string, any>();
    for (const r of rows) {
      const normalizedSection = r.section_key.replace(/^intake:/, '');
      const key = `${normalizedSection}:${r.field_key}`;
      const existing = deduped.get(key);
      if (!existing) {
        deduped.set(key, r);
        continue;
      }
      // prefer intake-prefixed row over non-prefixed
      const existingIsIntake = String(existing.section_key).startsWith('intake:');
      const thisIsIntake = String(r.section_key).startsWith('intake:');
      if (thisIsIntake && !existingIsIntake) {
        // If the non-intake (existing) row explicitly marks public=false, prefer it
        // so admin changes to not-public override any stale intake-prefixed copies.
        const existingMeta = existing.options && (existing.options as any).meta ? (existing.options as any).meta : {};
        if (existingMeta.public === false) {
          // keep existing non-intake row
        } else {
          deduped.set(key, r);
        }
      }
      if (existingIsIntake && !thisIsIntake) {
        // If the incoming non-intake row explicitly marks public=false, prefer it
        // to override any intake-prefixed copy.
        const thisMeta = r.options && (r.options as any).meta ? (r.options as any).meta : {};
        if (thisMeta.public === false) {
          deduped.set(key, r);
        }
      }
      // otherwise keep existing
    }
    rows = Array.from(deduped.values());

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
    return apiError(err);
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

        // If this field is marked public on the internal form, ensure an intake-prefixed
        // copy exists so it appears on the public intake. Use upsert to avoid duplicates.
        try {
          const intakeSectionKey = `intake:${section.id}`;
          if ((field as any).public) {
            // ensure meta.public is true for the intake copy
            const intakeMeta = (field as any).meta ? { ...(field as any).meta } : {};
            intakeMeta.public = true;
            let intakeOptions: any = null;
            const hasOptionsArray2 = Array.isArray(field.options) && field.options.length > 0;
            const hasMeta2 = intakeMeta && Object.keys(intakeMeta).length > 0;
            if (hasOptionsArray2 && hasMeta2) intakeOptions = { items: field.options, meta: intakeMeta };
            else if (hasMeta2) intakeOptions = { meta: intakeMeta };
            else if (hasOptionsArray2) intakeOptions = field.options;

            await prisma.formConfig.upsert({
              where: {
                section_key_field_key: {
                  section_key: intakeSectionKey,
                  field_key: field.id,
                },
              },
              update: {
                section_label: section.label,
                field_label: field.label,
                field_type: field.type,
                options: intakeOptions,
                visible: field.visible,
                required: field.required,
                sort_order: field.sort_order ?? sortOrder,
              },
              create: {
                section_key: intakeSectionKey,
                section_label: section.label,
                field_key: field.id,
                field_label: field.label,
                field_type: field.type,
                options: intakeOptions,
                visible: field.visible,
                required: field.required,
                sort_order: field.sort_order ?? sortOrder,
              },
            });
          } else if (typeof (field as any).public !== 'undefined' && (field as any).public === false) {
            // If the field is explicitly set to not public, remove any intake-prefixed copy
            await prisma.formConfig.deleteMany({
              where: {
                section_key: intakeSectionKey,
                field_key: field.id,
              },
            });
          }
        } catch (e) {
          // Non-fatal: log and continue so admin save doesn't fail if intake upsert/delete errors
          console.error('Failed to upsert/delete intake copy for field', field.id, e);
        }
        sortOrder += 1;
      }
    }

    // Cleanup: remove any intake-prefixed rows whose non-prefixed counterpart
    // is not explicitly public. This prevents stale intake copies from remaining
    // after an admin saves fields as not public.
    try {
      const nonIntakeRows = await prisma.formConfig.findMany({
        where: { section_key: { not: { startsWith: 'intake:' } } },
      });
      const nonIntakeMap = new Map<string, any>();
      nonIntakeRows.forEach((r) => {
        const key = `${r.section_key}:${r.field_key}`;
        const meta = r.options && (r.options as any).meta ? (r.options as any).meta : {};
        nonIntakeMap.set(key, meta.public === true);
      });

      const intakeRows = await prisma.formConfig.findMany({
        where: { section_key: { startsWith: 'intake:' } },
      });
      for (const r of intakeRows) {
        const normalizedSection = r.section_key.replace(/^intake:/, '');
        const key = `${normalizedSection}:${r.field_key}`;
        const shouldBePublic = nonIntakeMap.get(key) === true;
        if (!shouldBePublic) {
          await prisma.formConfig.deleteMany({ where: { section_key: r.section_key, field_key: r.field_key } });
        }
      }
    } catch (e) {
      console.error('Failed to cleanup intake-prefixed rows', e);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return apiError(err);
  }
}
