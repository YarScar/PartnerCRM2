import { prisma, hasDb } from './db';
import DEFAULT_FORM_CONFIG from './defaultFormConfig';

export type LoadedField = {
  id: string;
  label: string;
  type: string;
  visible: boolean;
  required: boolean;
  public?: boolean;
  options: unknown;
  sort_order: number | null;
};
export type LoadedSection = { id: string; label: string; fields: LoadedField[] };

/**
 * The saved partner form or public intake form, as sections of fields in order.
 * Intake rows are stored with an "intake:" section prefix. Once the intake form has been
 * saved, its own rows are the whole form; before that, the partner-form fields marked
 * public are shown as a starting point.
 */
export async function loadFormSections(form: 'partner' | 'intake'): Promise<LoadedSection[]> {
  if (!hasDb()) return DEFAULT_FORM_CONFIG as unknown as LoadedSection[];

  const all = await prisma.formConfig.findMany({ orderBy: [{ sort_order: 'asc' }] });
  const isIntake = (r: { section_key: string }) => r.section_key.startsWith('intake:');
  const intakeRows = all.filter(isIntake);
  const rows =
    form === 'intake'
      ? intakeRows.length > 0
        ? intakeRows
        : all.filter((r) => !isIntake(r) && (r.options as any)?.meta?.public === true)
      : all.filter((r) => !isIntake(r));

  const sections = new Map<string, LoadedSection>();
  for (const row of rows) {
    const sectionKey = row.section_key.replace(/^intake:/, '');
    if (!sections.has(sectionKey)) sections.set(sectionKey, { id: sectionKey, label: row.section_label, fields: [] });
    const meta = (row.options as any)?.meta ?? {};
    sections.get(sectionKey)!.fields.push({
      id: row.field_key,
      label: row.field_label,
      type: row.field_type,
      visible: row.visible ?? true,
      required: row.required ?? false,
      public: meta.public ?? undefined,
      options: row.options,
      sort_order: row.sort_order,
    });
  }
  return Array.from(sections.values());
}
