// Checks and normalizes a form-builder save (POST /api/form-config) before anything
// is written, so a bad save is refused with a message instead of half-applied.
import normalizeOptions from './formConfigUtils';

export const FIELD_TYPES = ['text', 'textarea', 'select', 'boolean', 'checklist'] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export type SavedField = {
  id: string;
  label: string;
  type: FieldType;
  visible: boolean;
  required: boolean;
  public?: boolean;
  options: string[];
  sort_order: number;
};
export type SavedSection = { id: string; label: string; fields: SavedField[] };

const ID_RE = /^[a-z0-9_]{1,80}$/;

export function validateFormSections(
  input: unknown
): { ok: true; sections: SavedSection[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: 'Expected a list of sections' };

  const sections: SavedSection[] = [];
  const sectionIds = new Set<string>();
  let total = 0;

  for (const [si, raw] of input.entries()) {
    const s = raw as Record<string, unknown>;
    const label = typeof s?.label === 'string' ? s.label.trim() : '';
    const id = typeof s?.id === 'string' ? s.id : '';
    if (!label) return { ok: false, error: `Section ${si + 1} needs a name` };
    if (!ID_RE.test(id)) return { ok: false, error: `Section "${label}" has an invalid id` };
    if (sectionIds.has(id)) return { ok: false, error: `Two sections are both named "${label}"` };
    if (!Array.isArray(s.fields)) return { ok: false, error: `Section "${label}" has no field list` };
    sectionIds.add(id);

    const fields: SavedField[] = [];
    const fieldIds = new Set<string>();
    for (const [fi, rawField] of s.fields.entries()) {
      const f = rawField as Record<string, unknown>;
      const fLabel = typeof f?.label === 'string' ? f.label.trim() : '';
      const fId = typeof f?.id === 'string' ? f.id : '';
      if (!fLabel) return { ok: false, error: `A field in "${label}" needs a name` };
      if (!ID_RE.test(fId)) return { ok: false, error: `Field "${fLabel}" has an invalid id` };
      if (fieldIds.has(fId)) return { ok: false, error: `"${label}" has two fields named "${fLabel}"` };
      if (!FIELD_TYPES.includes(f.type as FieldType)) {
        return { ok: false, error: `Field "${fLabel}" has an unknown type` };
      }
      fieldIds.add(fId);
      fields.push({
        id: fId,
        label: fLabel.slice(0, 200),
        type: f.type as FieldType,
        visible: f.visible !== false,
        required: f.required === true,
        public: typeof f.public === 'boolean' ? f.public : undefined,
        // Options can arrive as a list or in the stored { items, meta } shape.
        options: normalizeOptions(f.options)
          .map((o) => String(o).trim())
          .filter(Boolean),
        // Order is the order of the list as saved, so drag-to-reorder always sticks.
        sort_order: si * 1000 + fi,
      });
    }

    total += fields.length;
    sections.push({ id, label: label.slice(0, 120), fields });
  }

  if (sections.length > 50 || total > 300 || sections.some((s) => s.fields.length > 999)) {
    return { ok: false, error: 'Too many sections or fields' };
  }
  return { ok: true, sections };
}

// The `options` column: the list of choices, plus `meta.public` on the partner form.
export function storedOptions(field: SavedField, isPublic: boolean | undefined) {
  const meta = typeof isPublic === 'boolean' ? { public: isPublic } : null;
  if (meta) return field.options.length ? { items: field.options, meta } : { meta };
  return field.options.length ? field.options : undefined;
}

// Turns a label into a field/section id that isn't already taken: "Email" → "email", "email_2", …
export function uniqueId(label: string, taken: Iterable<string>): string {
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 70) || 'field';
  const used = new Set(taken);
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}_${n}`)) n += 1;
  return `${base}_${n}`;
}
