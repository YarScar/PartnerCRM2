'use client';

import { useState, useEffect, useRef } from 'react';
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

export default function AdminPage() {
  const [config, setConfig] = useState<FormSection[]>(DEFAULT_CONFIG);
  const [promptState, setPromptState] = useState<{
    open: boolean;
    message: string;
    defaultValue?: string;
    resolve?: (value: string | null) => void;
  }>({ open: false, message: '' });

  const showPrompt = (message: string, defaultValue?: string) =>
    new Promise<string | null>((resolve) => {
      setPromptState({ open: true, message, defaultValue, resolve });
    });

  const closePrompt = (value: string | null) => {
    if (promptState.resolve) promptState.resolve(value);
    setPromptState({ open: false, message: '' });
  };
  const promptInputRef = useRef<HTMLInputElement | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draggingField, setDraggingField] = useState<{ sectionId: string; fieldId: string } | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/form-config');
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
        }
      } catch (err) {
        console.error('Failed to load form config:', err);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const save = async () => {
    try {
      const orderedConfig = config.map((section, sectionIndex) => ({
        ...section,
        fields: section.fields.map((field, fieldIndex) => ({
          ...field,
          sort_order: sectionIndex * 100 + fieldIndex,
        })),
      }));

      const res = await fetch('/api/form-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderedConfig),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save form config:', err);
    }
  };

  const reset = async () => {
    if (confirm('Reset to default form configuration?')) {
      setConfig(DEFAULT_CONFIG);
      try {
        const orderedDefaults = DEFAULT_CONFIG.map((section, sectionIndex) => ({
          ...section,
          fields: section.fields.map((field, fieldIndex) => ({
            ...field,
            sort_order: sectionIndex * 100 + fieldIndex,
          })),
        }));

        await fetch('/api/form-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderedDefaults),
        });
      } catch (err) {
        console.error('Failed to reset form config:', err);
      }
    }
  };

  const moveField = (sectionId: string, sourceFieldId: string, targetFieldId: string) => {
    setConfig((current) =>
      current.map((section) => {
        if (section.id !== sectionId) return section;

        const sourceIndex = section.fields.findIndex((field) => field.id === sourceFieldId);
        const targetIndex = section.fields.findIndex((field) => field.id === targetFieldId);
        if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return section;

        const nextFields = [...section.fields];
        const [moved] = nextFields.splice(sourceIndex, 1);
        nextFields.splice(targetIndex, 0, moved);
        return { ...section, fields: nextFields };
      })
    );
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

  const addField = async (sectionId: string) => {
    let label: string | null = null;
    try {
      // prefer native prompt if available
      if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
        label = window.prompt('New field label:');
      } else {
        label = await showPrompt('New field label:');
      }
    } catch {
      label = await showPrompt('New field label:');
    }
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

  const addSection = async () => {
    let label: string | null = null;
    try {
      if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
        label = window.prompt('New section label:');
      } else {
        label = await showPrompt('New section label:');
      }
    } catch {
      label = await showPrompt('New section label:');
    }
    if (!label) return;
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    setConfig([...config, { id, label, fields: [] }]);
  };

  const editFieldOptions = async (sectionId: string, fieldId: string) => {
    const section = config.find(s => s.id === sectionId);
    if (!section) return;
    const field = section.fields.find(f => f.id === fieldId);
    if (!field) return;
    
    const currentOptions = (field.options || []).join('\n');
    let newOptions: string | null = null;
    try {
      if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
        newOptions = window.prompt('Enter options, one per line:', currentOptions);
      } else {
        newOptions = await showPrompt('Enter options, one per line:', currentOptions);
      }
    } catch {
      newOptions = await showPrompt('Enter options, one per line:', currentOptions);
    }
    if (newOptions === null) return;
    
    const optionsArray = newOptions.split('\n').filter(o => o.trim()).map(o => o.trim());
    updateField(sectionId, fieldId, { options: optionsArray });
  };

  const addFieldOption = async (sectionId: string, fieldId: string) => {
    let label: string | null = null;
    try {
      if (typeof window !== 'undefined' && typeof window.prompt === 'function') {
        label = window.prompt('New option label:');
      } else {
        label = await showPrompt('New option label:');
      }
    } catch {
      label = await showPrompt('New option label:');
    }
    if (!label?.trim()) return;

    const section = config.find((s) => s.id === sectionId);
    const field = section?.fields.find((f) => f.id === fieldId);
    if (!field) return;

    updateField(sectionId, fieldId, {
      options: [...(field.options || []), label.trim()],
    });
  };

  const updateFieldOption = (sectionId: string, fieldId: string, optionIndex: number, value: string) => {
    const section = config.find((s) => s.id === sectionId);
    const field = section?.fields.find((f) => f.id === fieldId);
    if (!field) return;

    const nextOptions = [...(field.options || [])];
    nextOptions[optionIndex] = value;
    updateField(sectionId, fieldId, { options: nextOptions.filter(Boolean) });
  };

  const removeFieldOption = (sectionId: string, fieldId: string, optionIndex: number) => {
    const section = config.find((s) => s.id === sectionId);
    const field = section?.fields.find((f) => f.id === fieldId);
    if (!field) return;

    updateField(sectionId, fieldId, {
      options: (field.options || []).filter((_, index) => index !== optionIndex),
    });
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
        rename labels, or add new fields. Changes save to the database.
      </p>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-ink/50">Loading form configuration...</div>
        ) : (
          <>
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
                    draggable
                    onDragStart={() => setDraggingField({ sectionId: section.id, fieldId: field.id })}
                    onDragEnd={() => setDraggingField(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (!draggingField) return;
                      moveField(section.id, draggingField.fieldId, field.id);
                      setDraggingField(null);
                    }}
                    className={`flex items-center gap-3 px-5 py-3 ${
                      !field.visible ? 'opacity-50' : ''
                    } ${
                      draggingField?.sectionId === section.id && draggingField?.fieldId === field.id
                        ? 'bg-court/10'
                        : ''
                    }`}
                  >
                    <button
                      type="button"
                      onMouseDown={() => setDraggingField({ sectionId: section.id, fieldId: field.id })}
                      className="cursor-grab active:cursor-grabbing text-ink/30"
                      aria-label="Drag to reorder"
                    >
                      <GripVertical size={14} />
                    </button>
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
                    {(field.type === 'select' || field.type === 'checklist') && (
                      <div className="ml-auto w-72 space-y-2">
                        {(field.options || []).map((option, optionIndex) => (
                          <div key={`${field.id}-${optionIndex}`} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) =>
                                updateFieldOption(section.id, field.id, optionIndex, e.target.value)
                              }
                              className="flex-1 text-xs bg-cream-soft border border-ink/15 rounded px-2 py-1"
                              placeholder="Option label"
                            />
                            <button
                              type="button"
                              onClick={() => removeFieldOption(section.id, field.id, optionIndex)}
                              className="text-ink/40 hover:text-court p-1"
                              title="Remove item"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addFieldOption(section.id, field.id)}
                          className="text-xs text-court-deep hover:text-court font-medium"
                        >
                          + Add item
                        </button>
                      </div>
                    )}
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
          </>
        )}
      </div>
    {promptState.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => closePrompt(null)} />
            <div className="bg-white p-4 rounded shadow max-w-md w-full z-60">
              <div className="mb-2 font-medium">{promptState.message}</div>
              <input
                ref={promptInputRef}
                defaultValue={promptState.defaultValue || ''}
                className="w-full border px-2 py-1 rounded"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    closePrompt((e.target as HTMLInputElement).value);
                  } else if (e.key === 'Escape') {
                    closePrompt(null);
                  }
                }}
                autoFocus
              />
              <div className="mt-3 flex justify-end gap-2">
                <button className="btn-ghost" onClick={() => closePrompt(null)}>
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={() => closePrompt(promptInputRef.current ? promptInputRef.current.value : null)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
