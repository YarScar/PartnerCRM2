'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Partner, PARTNER_STATUSES, PartnerStatus } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Cpu,
  HardDrive,
  Wifi,
  Building2,
  Users,
  Edit2,
  MessageSquarePlus,
  Send,
  Trash2,
} from 'lucide-react';

export function PartnerDetailClient({
  partner: initialPartner,
  canDelete = false,
}: {
  partner: Partner;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [partner, setPartner] = useState(initialPartner);
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteBody, setNoteBody] = useState('');
  const [noteAuthor, setNoteAuthor] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);

  const updateStatus = async (status: PartnerStatus) => {
    const res = await fetch(`/api/partners/${partner.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const { partner: updated } = await res.json();
      setPartner({ ...partner, ...updated });
    }
  };

  const submitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteBody.trim()) return;
    const res = await fetch(`/api/partners/${partner.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: noteBody, author: noteAuthor || undefined }),
    });
    if (res.ok) {
      const { note } = await res.json();
      setPartner({
        ...partner,
        notes: [note, ...(partner.notes || [])],
      });
      setNoteBody('');
      setShowAddNote(false);
      startTransition(() => router.refresh());
    }
  };

  const performDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/partners/${partner.id}`, { method: 'DELETE' });

    if (res.ok) {
      setShowDeleteConfirm(false);
      router.push('/partners');
      router.refresh();
      return;
    }

    setDeleting(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
          <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight">
            {partner.org_name}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Link href={`/partners/${partner.id}/edit`} className="btn-secondary">
              <Edit2 size={14} />
              Edit
            </Link>
            {canDelete && (
              <>
                <button onClick={() => setShowDeleteConfirm(true)} className="btn-ghost text-court" disabled={deleting}>
                  <Trash2 size={14} />
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
                {showDeleteConfirm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-cream rounded-lg p-6 max-w-md w-full">
                      <div className="mb-4 text-sm">Delete <strong>{partner.org_name}</strong>? This cannot be undone.</div>
                      <div className="flex justify-end gap-2">
                        <button className="btn-ghost" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>Cancel</button>
                        <button className="btn-primary" onClick={performDelete} disabled={deleting}>
                          {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap text-sm text-ink/60">
          {partner.contact_name && (
            <span>
              {partner.contact_name}
              {partner.contact_role && (
                <span className="text-ink/40"> · {partner.contact_role}</span>
              )}
            </span>
          )}
          {(partner.org_city || partner.org_state) && (
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {[partner.org_city, partner.org_state].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* Status changer */}
      <div className="card">
        <div className="text-[10px] uppercase tracking-widest text-ink/50 mb-3">Status</div>
        <div className="flex flex-wrap gap-2">
          {PARTNER_STATUSES.map((s) => {
            const active = partner.status === s;
            return (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={active}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                  ${active
                    ? 'bg-ink text-cream border-ink cursor-default'
                    : 'bg-cream-soft text-ink/70 border-ink/15 hover:border-ink/40 cursor-pointer'}`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contact & Org info */}
      <Section number="01" title="Contact & Organization" icon={Building2}>
        <Grid>
          <DataField label="Email" value={partner.contact_email} icon={Mail} link={partner.contact_email ? `mailto:${partner.contact_email}` : undefined} />
          <DataField label="Phone" value={partner.contact_phone} icon={Phone} link={partner.contact_phone ? `tel:${partner.contact_phone}` : undefined} />
          <DataField label="Website" value={partner.org_website} icon={Globe} link={partner.org_website} />
          <DataField label="Address" value={partner.org_address} icon={MapPin} />
        </Grid>
        {partner.intake_message && (
          <div className="mt-6 border-t border-ink/10 pt-5">
            <div className="text-[10px] uppercase tracking-widest text-ink/50 mb-2">
              Public Intake Message
            </div>
            <p className="text-sm text-ink/70 whitespace-pre-wrap">{partner.intake_message}</p>
          </div>
        )}
      </Section>

      {/* Program info */}
      <Section number="02" title="Program & Approach" icon={Users}>
        <Grid>
          <DataField label="Program Structure" value={partner.program_structure} fullWidth />
          <DataField label="Who They Work With" value={partner.who_they_work_with} />
          <DataField label="Youth Ages" value={partner.youth_ages} />
          <DataField label="How Kids Connect" value={partner.how_kids_connect} />
          <DataField
            label="Recruitment Needed?"
            value={
              partner.recruitment_needed === true
                ? 'Yes' + (partner.recruitment_notes ? ` — ${partner.recruitment_notes}` : '')
                : partner.recruitment_needed === false
                ? 'No'
                : undefined
            }
          />
          <DataField label="Program Times" value={partner.program_times} icon={Calendar} />
          <DataField label="Schedule Flexibility" value={partner.schedule_flexibility} />
        </Grid>
      </Section>

      {/* What they want */}
      <Section number="03" title="Partnership Request" icon={Cpu}>
        <Grid>
          <DataField label="Desired Program Type" value={partner.desired_program_type} fullWidth />
          <DataField label="Specific Project" value={partner.specific_project_request} fullWidth />
          <DataField
            label="Looking for Recommendations?"
            value={partner.wants_recommendations ? 'Yes — open to ideas' : 'No — has specific request'}
          />
          <DataField label="Desired Timeline" value={partner.desired_timeline} icon={Calendar} />
          <DataField label="Firm Dates" value={partner.firm_dates} fullWidth />
        </Grid>
      </Section>

      {/* Tech & Space */}
      <Section number="04" title="Tech & Space" icon={HardDrive}>
        <Grid>
          <DataField
            label="Works with 3D Tech"
            value={
              partner.works_with_3d_tech === 'yes' ? 'Yes' :
              partner.works_with_3d_tech === 'no' ? 'No' :
              partner.works_with_3d_tech === 'interested' ? 'Interested' : undefined
            }
          />
          <DataField label="3D Tech Specifics" value={partner.three_d_tech_specifics} />
          <DataField label="Available Computers" value={partner.available_computers} />
          <DataField label="Internet / WiFi" value={partner.internet_availability} icon={Wifi} />
          <DataField label="Available Space" value={partner.available_space} fullWidth />
          <DataField
            label="On-Site Assistance"
            value={
              partner.on_site_assistance === true
                ? 'Yes' + (partner.on_site_assistance_notes ? ` — ${partner.on_site_assistance_notes}` : '')
                : partner.on_site_assistance === false
                ? 'No'
                : undefined
            }
            fullWidth
          />
          <DataField label="Accessibility / Logistics" value={partner.accessibility_limitations} fullWidth />
          <DataField label="General Tech Context" value={partner.general_tech_context} fullWidth />
        </Grid>

        {partner.hardware_inventory && partner.hardware_inventory.length > 0 && (
          <div className="mt-6">
            <div className="text-[10px] uppercase tracking-widest text-ink/50 mb-3">
              Hardware Inventory
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {partner.hardware_inventory.map((item, i) => (
                <div key={i} className="bg-cream/40 border border-ink/10 rounded-lg p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-medium text-sm">{item.type}</div>
                    <div className="font-mono text-court font-bold">×{item.quantity}</div>
                  </div>
                  {item.notes && (
                    <div className="text-xs text-ink/60 mt-1">{item.notes}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {partner.hardware_notes && (
          <div className="mt-4 text-sm text-ink/70 italic border-l-2 border-court/40 pl-3">
            {partner.hardware_notes}
          </div>
        )}
      </Section>

      {/* Conversation log */}
      <Section number="05" title="Conversation Log" icon={MessageSquarePlus}>
        <div className="mb-4">
          {!showAddNote ? (
            <button onClick={() => setShowAddNote(true)} className="btn-secondary">
              <MessageSquarePlus size={14} />
              Add Note
            </button>
          ) : (
            <form onSubmit={submitNote} className="space-y-3">
              <textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="What happened? Decision, outreach attempt, follow-up..."
                rows={3}
                className="input-base resize-none"
                autoFocus
              />
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={noteAuthor}
                  onChange={(e) => setNoteAuthor(e.target.value)}
                  placeholder="Your name (optional)"
                  className="input-base flex-1"
                />
                <button type="submit" className="btn-primary" disabled={!noteBody.trim() || isPending}>
                  <Send size={14} />
                  Save Note
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddNote(false);
                    setNoteBody('');
                  }}
                  className="btn-ghost"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {partner.notes && partner.notes.length > 0 ? (
          <div className="space-y-3">
            {partner.notes.map((note) => (
              <div key={note.id} className="bg-cream/40 border-l-2 border-court rounded-r-lg p-4">
                <div className="text-sm whitespace-pre-wrap">{note.body}</div>
                <div className="mt-2 flex gap-3 text-[10px] uppercase tracking-wider text-ink/50">
                  {note.author && <span className="font-semibold">{note.author}</span>}
                  <span>{new Date(note.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink/50 italic">No conversation log entries yet.</p>
        )}
      </Section>
    </div>
  );
}

function Section({
  number,
  title,
  icon: Icon,
  children,
}: {
  number: string;
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <div className="flex items-center gap-3 mb-5">
        <div className="text-[10px] uppercase tracking-widest text-ink/40 font-mono">
          {number}
        </div>
        <div className="h-px flex-1 bg-ink/10" />
        <Icon size={16} className="text-ink/40" />
        <h2 className="font-display text-2xl font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">{children}</div>;
}

function DataField({
  label,
  value,
  icon: Icon,
  link,
  fullWidth,
}: {
  label: string;
  value?: string | null;
  icon?: any;
  link?: string;
  fullWidth?: boolean;
}) {
  if (!value) return null;
  const displayValue = link ? (
    <a
      href={link}
      target={link.startsWith('http') ? '_blank' : undefined}
      rel="noopener noreferrer"
      className="text-court hover:underline"
    >
      {value}
    </a>
  ) : (
    value
  );

  return (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-ink/50 mb-1">
        {Icon && <Icon size={10} />}
        {label}
      </div>
      <div className="text-sm leading-relaxed">{displayValue}</div>
    </div>
  );
}
