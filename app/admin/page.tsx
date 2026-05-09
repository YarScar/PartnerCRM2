'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, GripVertical, Save } from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'boolean' | 'checklist';
  visible: boolean;
  required: boolean;
  options?: string[];
}

interface FormSection {
  id: string;
  label: string;
  fields: FormField[];
}

const DEFAULT_CONFIG: FormSection[] = [
  {
    id: 'org',
    label: 'Organization & Contact',
    fields: [
      { id: 'org_name', label: 'Organization Name', type: 'text', visible: true, required: true },
      { id: 'contact_name', label: 'Contact Name', type: 'text', visible: true, required: false },
      { id: 'contact_email', label: 'Contact Email', type: 'text', visible: true, required: false },
      { id: 'contact_phone', label: 'Contact Phone', type: 'text', visible: true, required: false },
      { id: 'org_website', label: 'Website', type: 'text', visible: true, required: false },
    ],
  },
  {
    id: 'program',
    label: 'Program & Approach',
    fields: [
      { id: 'program_structure', label: 'Program Structure', type: 'textarea', visible: true, required: false },
      { id: 'youth_ages', label: 'Youth Ages', type: 'text', visible: true, required: false },
      { id: 'how_kids_connect', label: 'How Kids Connect', type: 'text', visible: true, required: false },
      { id: 'recruitment_needed', label: 'Recruitment Needed', type: 'boolean', visible: true, required: false },
    ],
  },
  {
    id: 'request',
    label: "What They're Looking For",
    fields: [
      { id: 'desired_program_type', label: 'Desired Program Type', type: 'select', visible: true, required: false },
      { id: 'specific_project_request', label: 'Specific Project', type: 'textarea', visible: true, required: false },
      { id: 'wants_recommendations', label: 'Open to Recommendations', type: 'boolean', visible: true, required: false },
      { id: 'desired_timeline', label: 'Desired Timeline', type: 'text', visible: true, required: false },
      { id: 'firm_dates', label: 'Firm Dates', type: 'text', visible: true, required: false },
    ],
  },
  {
    id: 'tech',
    label: 'Tech & Space',
    fields: [
      { id: 'works_with_3d_tech', label: 'Works with 3D Tech', type: 'select', visible: true, required: false },
      { id: 'hardware_inventory', label: 'Hardware Inventory', type: 'checklist', visible: true, required: false },
      { id: 'available_computers', label: 'Available Computers', type: 'text', visible: true, required: false },
      { id: 'internet_availability', label: 'Internet / WiFi', type: 'select', visible: true, required: false },
      { id: 'available_space', label: 'Available Space', type: 'textarea', visible: true, required: false },
      { id: 'on_site_assistance', label: 'On-Site Assistance', type: 'boolean', visible: true, required: false },
    ],
  },
];

const STORAGE_KEY = 'createaccess.formConfig';

export default function AdminPage() {
  const [config, setConfig] = useState<FormSection[]>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setConfig(JSON.parse(stored));
    } catch {}
  }, []);

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = () => {
    if (confirm('Reset to default form configuration?')) {
      setConfig(DEFAULT_CONFIG);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const updateField = (sectionId: string, fieldId: string, patch: Partial<FormField>) => {
    setConfig(
      config.map((s) =>
        s.id !== sectionId
          ? s
          : { ...s, fields: s.fields.map((f) => (f.id !== fieldId ? f : { ...f, ...patch })) }
      )
    );
  };

  const removeField = (sectionId: string, fieldId: string) => {
    setConfig(
      config.map((s) =>
        s.id !== sectionId ? s : { ...s, fields: s.fields.filter((f) => f.id !== fieldId) }
      )
    );
  };

  const addField = (sectionId: string) => {
    const label = prompt('New field label:');
    if (!label) return;
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    setConfig(
      config.map((s) =>
        s.id !== sectionId
          ? s
          : {
              ...s,
              fields: [
                ...s.fields,
                { id, label, type: 'text', visible: true, required: false },
              ],
            }
      )
    );
  };

  const addSection = () => {
    const label = prompt('New section label:');
    if (!label) return;
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    setConfig([...config, { id, label, fields: [] }]);
  };

  const removeSection = (sectionId: string) => {
    if (confirm('Remove this entire section and its fields?')) {
      setConfig(config.filter((s) => s.id !== sectionId));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-2">
        <div>
          <div className="text-xs uppercase tracking-widest text-ink/50 mb-2">
            Configuration
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight">
            Form Builder
          </h1>
        </div>
        <div className="flex gap-2 items-center">
          {saved && <span className="text-sm text-emerald-700 font-medium">✓ Saved</span>}
          <button onClick={reset} className="btn-ghost">
            Reset to Default
          </button>
          <button onClick={save} className="btn-primary">
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>
      <p className="text-ink/60 mb-10 max-w-2xl">
        Customize what fields appear on the partner intake form. Toggle visibility, mark fields as required,
        rename labels, or add new fields. Changes save to local storage in this prototype — wire to the{' '}
        <code className="text-xs bg-ink/5 px-1 py-0.5 rounded font-mono">form_config</code> table for production.
      </p>

      <div className="space-y-4">
        {config.map((section) => (
          <div key={section.id} className="card !p-0 overflow-hidden">
            <div className="flex items-center justify-between bg-ink/5 px-5 py-3 border-b border-ink/10">
              <input
                type="text"
                value={section.label}
                onChange={(e) =>
                  setConfig(
                    config.map((s) => (s.id === section.id ? { ...s, label: e.target.value } : s))
                  )
                }
                className="font-display font-bold text-xl bg-transparent focus:outline-none focus:bg-cream-soft px-2 py-1 rounded"
              />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => addField(section.id)}
                  className="btn-ghost !text-xs"
                >
                  <Plus size={12} /> Field
                </button>
                <button
                  onClick={() => removeSection(section.id)}
                  className="text-ink/40 hover:text-court p-1.5"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="divide-y divide-ink/10">
              {section.fields.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-ink/40 italic">
                  No fields. Click "+ Field" to add one.
                </div>
              ) : (
                section.fields.map((field) => (
                  <div
                    key={field.id}
                    className={`flex items-center gap-3 px-5 py-3 ${
                      !field.visible ? 'opacity-50' : ''
                    }`}
                  >
                    <GripVertical size={14} className="text-ink/30" />
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) =>
                        updateField(section.id, field.id, { label: e.target.value })
                      }
                      className="flex-1 bg-transparent focus:outline-none focus:bg-cream-soft px-2 py-1 rounded text-sm font-medium"
                    />
                    <select
                      value={field.type}
                      onChange={(e) =>
                        updateField(section.id, field.id, {
                          type: e.target.value as FormField['type'],
                        })
                      }
                      className="text-xs bg-cream-soft border border-ink/15 rounded px-2 py-1"
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="select">Select</option>
                      <option value="boolean">Yes/No</option>
                      <option value="checklist">Checklist</option>
                    </select>
                    <label className="flex items-center gap-1.5 text-xs text-ink/60">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) =>
                          updateField(section.id, field.id, { required: e.target.checked })
                        }
                        className="accent-court"
                      />
                      Required
                    </label>
                    <button
                      onClick={() =>
                        updateField(section.id, field.id, { visible: !field.visible })
                      }
                      className="text-ink/40 hover:text-ink p-1"
                      title={field.visible ? 'Hide' : 'Show'}
                    >
                      {field.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button
                      onClick={() => removeField(section.id, field.id)}
                      className="text-ink/40 hover:text-court p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}

        <button
          onClick={addSection}
          className="w-full card !p-6 border-dashed text-ink/50 hover:text-ink hover:border-court hover:text-court transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Add Section
        </button>
      </div>
    </div>
  );
}
