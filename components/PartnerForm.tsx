'use client';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Partner, PARTNER_STATUSES, PROGRAM_TYPES } from '@/lib/types';
import { TextField, TextareaField, SelectField } from '@/components/FormFields';
import normalizeOptions from '@/lib/formConfigUtils';
import { HardwareChecklist } from '@/components/HardwareChecklist';
import { DynamicChecklist } from '@/components/DynamicChecklist';
import { Save, Loader2, Building2, Users, Cpu, HardDrive } from 'lucide-react';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'boolean' | 'checklist';
  visible: boolean;
  required: boolean;
  options?: string[] | { value: string; label: string }[];
  meta?: Record<string, any>;
}

interface FormSection {
  id: string;
  label: string;
  fields: FormField[];
}

interface Props {
  partner?: Partner;
  mode: 'create' | 'edit' | 'intake';
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

export function PartnerForm({ partner, mode }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<FormSection[]>(DEFAULT_CONFIG);

  const isIntake = mode === 'intake';

  // Load form config from database
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
        // Fall back to default
      }
    };
    loadConfig();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = {};

    formData.forEach((value, key) => {
      if (value === '') return;
      // Convert booleans
      if (key === 'wants_recommendations' || key === 'recruitment_needed' || key === 'on_site_assistance') {
        data[key] = value === 'true' ? true : value === 'false' ? false : null;
      } else if (key === 'hardware_inventory') {
        try {
          data[key] = JSON.parse(value as string);
        } catch {
          data[key] = [];
        }
      } else {
        data[key] = value;
      }
    });

    try {
      const endpoint =
        mode === 'create'
          ? '/api/partners'
          : mode === 'edit'
          ? `/api/partners/${partner!.id}`
          : '/api/intake';
      const method = mode === 'edit' ? 'PATCH' : 'POST';

      // Normalize arbitrary form keys to canonical DB keys before sending
      const normalizeKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      const canonical = (key: string) => {
        const k = normalizeKey(key);
        const map: Record<string, string> = {
          name: 'org_name',
          org: 'org_name',
          organization: 'org_name',
          email: 'contact_email',
          phone: 'contact_phone',
          contact: 'contact_name',
          message: 'intake_message',
        };
        return map[k] || k;
      };

      const mappedData: Record<string, any> = {};
      Object.entries(data).forEach(([k, v]) => {
        mappedData[canonical(k)] = v;
      });

      // eslint-disable-next-line no-console
      console.log('PartnerForm submitting to', endpoint, method, mappedData);

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mappedData),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to save');
      }

      const body = await res.json();

      if (isIntake) {
        setSubmitted(true);
      } else if (mode === 'create') {
        router.push(`/partners/${body.partner.id}`);
      } else {
        router.push(`/partners/${partner!.id}`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (submitted) {
    return (
      <div className="card text-center py-16">
        <div className="text-6xl mb-4">🏀</div>
        <h2 className="font-display text-3xl font-bold mb-2">Thanks for reaching out!</h2>
        <p className="text-ink/60 max-w-md mx-auto">
          We've received your information. A member of the CreateAccess team will be in touch soon.
        </p>
      </div>
    );
  }

  // Helper function to get partner value by field id
  const getFieldValue = (fieldId: string): any => {
    const key = fieldId as keyof Partner;
    return partner?.[key] ?? '';
  };

  // Helper function to render field based on type
  const renderField = (field: FormField, sectionNumber: string) => {
    if (!field.visible) return null;

    const commonProps = {
      label: field.label,
      name: field.id,
      required: field.required,
      defaultValue: getFieldValue(field.id),
    };

    switch (field.type) {
      case 'text':
        return (
          <TextField
            key={`${sectionNumber}-${field.id}`}
            {...commonProps}
            placeholder={field.label}
          />
        );
      case 'textarea':
        return (
          <TextareaField
            key={`${sectionNumber}-${field.id}`}
            {...commonProps}
            placeholder={field.label}
            rows={2}
          />
        );
      case 'boolean':
        return (
          <SelectField
            key={`${sectionNumber}-${field.id}`}
            {...commonProps}
            options={[
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' },
            ]}
            placeholder="Select..."
          />
        );
      case 'select':
        let options: readonly string[] | { value: string; label: string }[] = [];
        if (field.id === 'desired_program_type') {
          options = PROGRAM_TYPES;
        } else if (field.id === 'works_with_3d_tech') {
          options = [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'interested', label: 'Interested but not yet' },
          ];
        } else if (field.id === 'internet_availability') {
          options = [
            'Reliable WiFi throughout',
            'WiFi available but inconsistent',
            'Limited internet access',
            'No internet',
          ];
        } else if (field.options) {
          options = normalizeOptions(field.options);
        }
        return (
          <SelectField
            key={`${sectionNumber}-${field.id}`}
            {...commonProps}
            options={options}
            placeholder="Select..."
          />
        );
      case 'checklist':
        if (field.id === 'hardware_inventory') {
          return (
            <div key={`${sectionNumber}-${field.id}`}>
              <label className="label-base">{field.label}</label>
              <p className="text-xs text-ink/50 mb-3">
                Tap to select equipment you have on-site, then specify quantities and notes.
              </p>
              <HardwareChecklist
                name={field.id}
                defaultValue={partner?.hardware_inventory || []}
              />
            </div>
          );
        }
        return (
          <DynamicChecklist
            key={`${sectionNumber}-${field.id}`}
            name={field.id}
            label={field.label}
            options={normalizeOptions(field.options)}
            defaultValue={getFieldValue(field.id)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Status section for non-intake forms */}
      {!isIntake && (
        <FormSection number="02" title="Status">
          <SelectField
            label="Current Status"
            name="status"
            options={PARTNER_STATUSES}
            defaultValue={partner?.status || 'New'}
            required
          />
        </FormSection>
      )}

      {/* Dynamic sections from config */}
      {config.map((section, index) => {
        const visibleFields = section.fields.filter(f => f.visible);
        if (visibleFields.length === 0) return null;

        const sectionNumber = isIntake 
          ? String(index + 1).padStart(2, '0')
          : String(index + 2).padStart(2, '0');

        return (
          <FormSection key={section.id} number={sectionNumber} title={section.label}>
            <div className="space-y-4">
              {visibleFields.map(field => renderField(field, sectionNumber))}
            </div>
          </FormSection>
        );
      })}

      {error && (
        <div className="bg-court/10 border border-court/30 text-court-deep rounded-lg p-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 sticky bottom-4 bg-cream/80 backdrop-blur-md rounded-2xl border border-ink/10 p-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-ghost"
          disabled={saving}
        >
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {isIntake
            ? 'Submit Application'
            : mode === 'edit'
            ? 'Save Changes'
            : 'Create Partner'}
        </button>
      </div>
    </form>
  );
}

function FormSection({
  number,
  title,
  icon: Icon,
  children,
}: {
  number: string;
  title: string;
  icon?: any;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <div className="flex items-center gap-3 mb-5">
        <div className="text-[10px] uppercase tracking-widest text-ink/40 font-mono">
          {number}
        </div>
        <div className="h-px flex-1 bg-ink/10" />
        {Icon && <Icon size={16} className="text-ink/40" />}
        <h2 className="font-display text-2xl font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
