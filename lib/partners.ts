import { Prisma } from '@prisma/client';
import { hasDb, prisma } from './db';
import { Partner, PartnerNote, PartnerStatus } from './types';
import {
  getMockPartners,
  getMockPartner,
  addMockPartner,
  updateMockPartner,
  addMockNote,
  deleteMockPartner,
} from './mock-data';

/**
 * All partner CRUD goes through this module. If DATABASE_URL is set,
 * it queries Neon; otherwise it transparently uses the in-memory mock store.
 */

type PrismaPartnerWithNotes = Prisma.PartnerGetPayload<{
  include: { notes: { orderBy: { created_at: 'desc' } } };
}>;

function mapNote(note: PrismaPartnerWithNotes['notes'][number]): PartnerNote {
  return {
    ...note,
    author: note.author ?? undefined,
    created_at: note.created_at.toISOString(),
  };
}

function mapPartner(partner: PrismaPartnerWithNotes): Partner {
  return {
    ...partner,
    contact_name: partner.contact_name ?? undefined,
    contact_email: partner.contact_email ?? undefined,
    contact_phone: partner.contact_phone ?? undefined,
    contact_role: partner.contact_role ?? undefined,
    org_website: partner.org_website ?? undefined,
    org_address: partner.org_address ?? undefined,
    org_city: partner.org_city ?? undefined,
    org_state: partner.org_state ?? undefined,
    program_structure: partner.program_structure ?? undefined,
    who_they_work_with: partner.who_they_work_with ?? undefined,
    youth_ages: partner.youth_ages ?? undefined,
    how_kids_connect: partner.how_kids_connect ?? undefined,
    intake_message: partner.intake_message ?? undefined,
    recruitment_needed: partner.recruitment_needed ?? undefined,
    recruitment_notes: partner.recruitment_notes ?? undefined,
    program_times: partner.program_times ?? undefined,
    schedule_flexibility: partner.schedule_flexibility ?? undefined,
    desired_program_type: partner.desired_program_type ?? undefined,
    specific_project_request: partner.specific_project_request ?? undefined,
    desired_timeline: partner.desired_timeline ?? undefined,
    firm_dates: partner.firm_dates ?? undefined,
    works_with_3d_tech: (partner.works_with_3d_tech as 'yes' | 'no' | 'interested' | '') || '',
    three_d_tech_specifics: partner.three_d_tech_specifics ?? undefined,
    hardware_notes: partner.hardware_notes ?? undefined,
    available_computers: partner.available_computers ?? undefined,
    internet_availability: partner.internet_availability ?? undefined,
    available_space: partner.available_space ?? undefined,
    on_site_assistance_notes: partner.on_site_assistance_notes ?? undefined,
    accessibility_limitations: partner.accessibility_limitations ?? undefined,
    general_tech_context: partner.general_tech_context ?? undefined,
    status: partner.status as PartnerStatus,
    source: (partner.source as 'intake_form' | 'manual') || 'manual',
    hardware_inventory: (partner.hardware_inventory as unknown as Partner['hardware_inventory']) || [],
    created_at: partner.created_at.toISOString(),
    updated_at: partner.updated_at.toISOString(),
    notes: partner.notes.map(mapNote),
  };
}

export function toPrismaData(data: Partial<Partner>): Prisma.PartnerUncheckedCreateInput {
  return {
    org_name: data.org_name || '',
    contact_name: data.contact_name || null,
    contact_email: data.contact_email || null,
    contact_phone: data.contact_phone || null,
    contact_role: data.contact_role || null,
    org_website: data.org_website || null,
    org_address: data.org_address || null,
    org_city: data.org_city || null,
    org_state: data.org_state || null,
    status: data.status || 'New',
    program_structure: data.program_structure || null,
    who_they_work_with: data.who_they_work_with || null,
    youth_ages: data.youth_ages || null,
    how_kids_connect: data.how_kids_connect || null,
    intake_message: data.intake_message || null,
    recruitment_needed: data.recruitment_needed ?? null,
    recruitment_notes: data.recruitment_notes || null,
    program_times: data.program_times || null,
    schedule_flexibility: data.schedule_flexibility || null,
    desired_program_type: data.desired_program_type || null,
    specific_project_request: data.specific_project_request || null,
    wants_recommendations: data.wants_recommendations ?? false,
    desired_timeline: data.desired_timeline || null,
    firm_dates: data.firm_dates || null,
    works_with_3d_tech: data.works_with_3d_tech || null,
    three_d_tech_specifics: data.three_d_tech_specifics || null,
    hardware_inventory: (data.hardware_inventory as unknown as Prisma.JsonArray) || [],
    hardware_notes: data.hardware_notes || null,
    available_computers: data.available_computers || null,
    internet_availability: data.internet_availability || null,
    available_space: data.available_space || null,
    on_site_assistance: data.on_site_assistance ?? null,
    on_site_assistance_notes: data.on_site_assistance_notes || null,
    accessibility_limitations: data.accessibility_limitations || null,
    general_tech_context: data.general_tech_context || null,
    source: data.source || 'manual',
  };
}

function normalizePartnerKeys(data: Partial<Partner>): Partial<Partner> {
  const out = { ...data } as any;
  if (!out.org_name) {
    if (out.name) out.org_name = out.name;
    else if (out.organization) out.org_name = out.organization;
    else if (out.org) out.org_name = out.org;
  }
  if (!out.contact_email && out.email) out.contact_email = out.email;
  if (!out.contact_phone && out.phone) out.contact_phone = out.phone;
  if (!out.contact_name && out.contact) out.contact_name = out.contact;
  if (!out.intake_message && out.message) out.intake_message = out.message;
  return out as Partial<Partner>;
}

function toPrismaUpdateData(data: Partial<Partner>): Prisma.PartnerUncheckedUpdateInput {
  const out: Prisma.PartnerUncheckedUpdateInput = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (key === 'id' || key === 'created_at' || key === 'updated_at' || key === 'notes') continue;
    if (key === 'hardware_inventory') {
      out.hardware_inventory = value as unknown as Prisma.JsonArray;
      continue;
    }
    (out as Record<string, unknown>)[key] = value;
  }
  return out;
}

export async function listPartners(): Promise<Partner[]> {
  if (!hasDb()) return getMockPartners();

  const rows = await prisma.partner.findMany({
    orderBy: { updated_at: 'desc' },
    include: { notes: { orderBy: { created_at: 'desc' } } },
  });
  return rows.map(mapPartner);
}

export async function getPartner(id: number): Promise<Partner | null> {
  if (!hasDb()) return getMockPartner(id);

  const partner = await prisma.partner.findUnique({
    where: { id },
    include: { notes: { orderBy: { created_at: 'desc' } } },
  });
  return partner ? mapPartner(partner) : null;
}

export async function createPartner(data: Partial<Partner>): Promise<Partner> {
  const normalized = normalizePartnerKeys(data);
  if (!hasDb()) return addMockPartner(normalized);

  const created = await prisma.partner.create({
    data: toPrismaData(normalized),
    include: { notes: { orderBy: { created_at: 'desc' } } },
  });
  return mapPartner(created);
}

export async function updatePartner(id: number, data: Partial<Partner>): Promise<Partner | null> {
  const normalized = normalizePartnerKeys(data);
  if (!hasDb()) return updateMockPartner(id, normalized);

  const updateData = toPrismaUpdateData(normalized);
  if (Object.keys(updateData).length === 0) return getPartner(id);

  try {
    const updated = await prisma.partner.update({
      where: { id },
      data: updateData,
      include: { notes: { orderBy: { created_at: 'desc' } } },
    });
    return mapPartner(updated);
  } catch {
    return null;
  }
}

export async function deletePartner(id: number): Promise<boolean> {
  if (!hasDb()) return deleteMockPartner(id);

  try {
    await prisma.partner.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

export async function updatePartnerStatus(id: number, status: PartnerStatus): Promise<Partner | null> {
  return updatePartner(id, { status });
}

export async function addNote(partnerId: number, body: string, author?: string): Promise<PartnerNote> {
  if (!hasDb()) return addMockNote(partnerId, body, author);

  const note = await prisma.partnerNote.create({
    data: {
      partner_id: partnerId,
      body,
      author: author || null,
    },
  });
  return {
    ...note,
    author: note.author ?? undefined,
    created_at: note.created_at.toISOString(),
  };
}
