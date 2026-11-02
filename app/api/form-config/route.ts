import { NextRequest, NextResponse } from 'next/server';
import apiError from '@/lib/apiError';
import { prisma, hasDb } from '@/lib/db';
import { getSessionFromToken, isAdmin, SESSION_COOKIE_NAME } from '@/lib/auth';
import DEFAULT_FORM_CONFIG from '@/lib/defaultFormConfig';
import { storedOptions, validateFormSections } from '@/lib/formConfigSave';

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

    // Intake rows start with 'intake:'. Once the intake form has been saved, its own rows are
    // the whole form, so deleting a field in the intake editor really removes it. Before that,
    // show the partner-form fields marked public as a starting point.
    const intakeRows = all.filter((r) => r.section_key.startsWith('intake:'));
    let rows =
      form === 'intake'
        ? intakeRows.length > 0
          ? intakeRows
          : all.filter((r) => !r.section_key.startsWith('intake:') && (r.options as any)?.meta?.public === true)
        : all.filter((r) => !r.section_key.startsWith('intake:'));

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
  // GET stays public (the public intake form reads it); saving is admin-only.
  const user = await getSessionFromToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const url = new URL(req.url);
    const form = url.searchParams.get('form');
    const prefix = intakePrefix(form);

    const checked = validateFormSections(await req.json());
    if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
    const sections = checked.sections;

    // One transaction: a failure part-way leaves the previous config in place
    // instead of a half-deleted form.
    await prisma.$transaction(async (tx) => {
      // Which partner-form fields were public before this save (see the copy step below).
      const wasPublic = new Set<string>();
      if (form !== 'intake') {
        const previous = await tx.formConfig.findMany({ where: { section_key: { not: { startsWith: 'intake:' } } } });
        for (const r of previous) {
          if ((r.options as any)?.meta?.public === true) wasPublic.add(`${r.section_key}:${r.field_key}`);
        }
      }

      // Replace this form's rows only; the other form is untouched.
      if (form === 'intake') {
        await tx.formConfig.deleteMany({ where: { section_key: { startsWith: 'intake:' } } });
      } else {
        await tx.formConfig.deleteMany({ where: { section_key: { not: { startsWith: 'intake:' } } } });
      }

      for (const section of sections) {
        for (const field of section.fields) {
          const row = {
            section_label: section.label,
            field_key: field.id,
            field_label: field.label,
            field_type: field.type,
            options: storedOptions(field, form === 'intake' ? undefined : field.public),
            visible: field.visible,
            required: field.required,
            sort_order: field.sort_order,
          };
          await tx.formConfig.create({ data: { ...row, section_key: `${prefix}${section.id}` } });

          // Partner form only: "Public" copies the field onto the public intake form, and
          // un-ticking it removes that copy. Intake-only fields are never touched here.
          if (form !== 'intake') {
            const intakeKey = { section_key: `intake:${section.id}`, field_key: field.id };
            if (field.public) {
              const copy = { ...row, options: storedOptions(field, true) };
              await tx.formConfig.upsert({
                where: { section_key_field_key: intakeKey },
                update: copy,
                create: { ...copy, section_key: intakeKey.section_key },
              });
            } else if (wasPublic.has(`${section.id}:${field.id}`)) {
              await tx.formConfig.deleteMany({ where: intakeKey });
            }
          }
        }
      }
    }, { timeout: 30000 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return apiError(err);
  }
}
