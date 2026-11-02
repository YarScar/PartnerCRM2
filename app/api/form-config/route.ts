import { NextRequest, NextResponse } from 'next/server';
import apiError from '@/lib/apiError';
import { prisma } from '@/lib/db';
import { getSessionFromToken, isAdmin, SESSION_COOKIE_NAME } from '@/lib/auth';
import { loadFormSections } from '@/lib/formConfigLoad';
import { storedOptions, validateFormSections } from '@/lib/formConfigSave';

function intakePrefix(form: string | null) {
  return form === 'intake' ? 'intake:' : '';
}

// Public: the intake form page reads it. Saving (POST) is admin-only.
export async function GET(req: NextRequest) {
  try {
    const form = new URL(req.url).searchParams.get('form') === 'intake' ? 'intake' : 'partner';
    return NextResponse.json(await loadFormSections(form));
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
