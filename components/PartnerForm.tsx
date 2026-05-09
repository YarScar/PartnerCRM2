'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Partner, PARTNER_STATUSES, PROGRAM_TYPES } from '@/lib/types';
import { TextField, TextareaField, SelectField } from '@/components/FormFields';
import { HardwareChecklist } from '@/components/HardwareChecklist';
import { Save, Loader2, Building2, Users, Cpu, HardDrive } from 'lucide-react';

interface Props {
  partner?: Partner;
  mode: 'create' | 'edit' | 'intake';
}

export function PartnerForm({ partner, mode }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isIntake = mode === 'intake';

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

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section 1: Org & Contact */}
      <FormSection number="01" title="Organization & Contact" icon={Building2}>
        <div className="grid md:grid-cols-2 gap-4">
          <TextField
            label="Organization Name"
            name="org_name"
            required
            defaultValue={partner?.org_name}
            placeholder="Roxbury Youth Collective"
          />
          <TextField
            label="Website"
            name="org_website"
            type="url"
            defaultValue={partner?.org_website}
            placeholder="https://..."
          />
          <TextField
            label="Primary Contact Name"
            name="contact_name"
            defaultValue={partner?.contact_name}
            placeholder="Full name"
          />
          <TextField
            label="Contact Role / Title"
            name="contact_role"
            defaultValue={partner?.contact_role}
            placeholder="Program Director"
          />
          <TextField
            label="Contact Email"
            name="contact_email"
            type="email"
            defaultValue={partner?.contact_email}
            placeholder="name@org.org"
          />
          <TextField
            label="Contact Phone"
            name="contact_phone"
            type="tel"
            defaultValue={partner?.contact_phone}
            placeholder="(555) 555-5555"
          />
          <TextField
            label="City"
            name="org_city"
            defaultValue={partner?.org_city}
          />
          <TextField
            label="State"
            name="org_state"
            defaultValue={partner?.org_state}
            placeholder="MA"
          />
        </div>
      </FormSection>

      {/* Section 2: Status (not on intake form) */}
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

      {/* Section 3: Program info */}
      <FormSection number={isIntake ? '02' : '03'} title="Program & Approach" icon={Users}>
        <div className="space-y-4">
          <TextareaField
            label="Program Structure"
            name="program_structure"
            defaultValue={partner?.program_structure}
            placeholder="Describe your programming — when, where, format..."
            rows={3}
          />
          <div className="grid md:grid-cols-2 gap-4">
            <TextareaField
              label="Who You Work With"
              name="who_they_work_with"
              defaultValue={partner?.who_they_work_with}
              placeholder="Demographics, community context..."
              rows={2}
            />
            <TextField
              label="Youth Ages"
              name="youth_ages"
              defaultValue={partner?.youth_ages}
              placeholder="11-18"
            />
            <TextField
              label="How Kids Connect with the Program"
              name="how_kids_connect"
              defaultValue={partner?.how_kids_connect}
              placeholder="Open enrollment, referral, recruitment..."
            />
            <SelectField
              label="Do Kids Need to Be Recruited?"
              name="recruitment_needed"
              options={[
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' },
              ]}
              defaultValue={
                partner?.recruitment_needed === true ? 'true' :
                partner?.recruitment_needed === false ? 'false' : ''
              }
              placeholder="Select..."
            />
            <TextField
              label="Program Times / Schedule"
              name="program_times"
              defaultValue={partner?.program_times}
              placeholder="Mon-Thu 3-6pm"
            />
            <TextField
              label="Schedule Flexibility"
              name="schedule_flexibility"
              defaultValue={partner?.schedule_flexibility}
              placeholder="Flexible / Limited / etc."
            />
          </div>
        </div>
      </FormSection>

      {/* What they want */}
      <FormSection number={isIntake ? '03' : '04'} title="What You're Looking For" icon={Cpu}>
        <div className="space-y-4">
          <SelectField
            label="Desired Program Type"
            name="desired_program_type"
            options={PROGRAM_TYPES}
            defaultValue={partner?.desired_program_type}
            placeholder="Select a focus..."
          />
          <TextareaField
            label="Specific Project Request"
            name="specific_project_request"
            defaultValue={partner?.specific_project_request}
            placeholder="Event support, workshop, showcase, custom activity..."
            rows={2}
          />
          <SelectField
            label="Open to CreateAccess Recommendations?"
            name="wants_recommendations"
            options={[
              { value: 'true', label: 'Yes — open to ideas' },
              { value: 'false', label: 'No — we have a specific request' },
            ]}
            defaultValue={
              partner?.wants_recommendations === true ? 'true' :
              partner?.wants_recommendations === false ? 'false' : ''
            }
            placeholder="Select..."
            hint="Some partners just want 'something cool' for students and need ideas."
          />
          <div className="grid md:grid-cols-2 gap-4">
            <TextField
              label="Desired Timeline"
              name="desired_timeline"
              defaultValue={partner?.desired_timeline}
              placeholder="Fall 2026, Summer only, Flexible..."
            />
            <TextField
              label="Firm Dates or Upcoming Events"
              name="firm_dates"
              defaultValue={partner?.firm_dates}
              placeholder="Showcase: April 25, 2026"
            />
          </div>
        </div>
      </FormSection>

      {/* Tech & Space */}
      <FormSection number={isIntake ? '04' : '05'} title="Tech & Space" icon={HardDrive}>
        <div className="space-y-4">
          <SelectField
            label="Do You Work with 3D Tech?"
            name="works_with_3d_tech"
            options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No' },
              { value: 'interested', label: 'Interested but not yet' },
            ]}
            defaultValue={partner?.works_with_3d_tech}
            placeholder="Select..."
          />
          <TextareaField
            label="3D Tech Specifics"
            name="three_d_tech_specifics"
            defaultValue={partner?.three_d_tech_specifics}
            placeholder="Printers, scanners, CAD software, student experience level..."
            rows={2}
          />

          <div>
            <label className="label-base">Hardware Inventory</label>
            <p className="text-xs text-ink/50 mb-3">
              Tap to select equipment you have on-site, then specify quantities and notes.
            </p>
            <HardwareChecklist
              name="hardware_inventory"
              defaultValue={partner?.hardware_inventory || []}
            />
          </div>

          <TextareaField
            label="Hardware Notes"
            name="hardware_notes"
            defaultValue={partner?.hardware_notes}
            placeholder="Device quality, age, limitations..."
            rows={2}
          />

          <div className="grid md:grid-cols-2 gap-4">
            <TextField
              label="Available Computers"
              name="available_computers"
              defaultValue={partner?.available_computers}
              placeholder="12 Chromebooks, 2 desktops..."
            />
            <SelectField
              label="Internet / WiFi"
              name="internet_availability"
              options={[
                'Reliable WiFi throughout',
                'WiFi available but inconsistent',
                'Limited internet access',
                'No internet',
              ]}
              defaultValue={partner?.internet_availability}
              placeholder="Select..."
            />
            <TextareaField
              label="Available Space / Lab Setup"
              name="available_space"
              defaultValue={partner?.available_space}
              placeholder="Classroom, lab, makerspace, open room..."
              rows={2}
            />
            <SelectField
              label="On-Site Assistance Available?"
              name="on_site_assistance"
              options={[
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' },
              ]}
              defaultValue={
                partner?.on_site_assistance === true ? 'true' :
                partner?.on_site_assistance === false ? 'false' : ''
              }
              placeholder="Select..."
            />
          </div>

          <TextareaField
            label="Accessibility / Logistical Limitations"
            name="accessibility_limitations"
            defaultValue={partner?.accessibility_limitations}
            placeholder="Transportation, supervision, scheduling constraints..."
            rows={2}
          />
          <TextareaField
            label="General Tech Context"
            name="general_tech_context"
            defaultValue={partner?.general_tech_context}
            placeholder="Broader tech context beyond 3D..."
            rows={2}
          />
        </div>
      </FormSection>

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
