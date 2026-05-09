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
    created_at: note.created_at.toISOString(),
  };
}

function mapPartner(partner: PrismaPartnerWithNotes): Partner {
  return {
    ...partner,
    status: partner.status as PartnerStatus,
    source: (partner.source as 'intake_form' | 'manual') || 'manual',
    works_with_3d_tech: (partner.works_with_3d_tech as 'yes' | 'no' | 'interested' | '') || '',
    hardware_inventory: (partner.hardware_inventory as Partner['hardware_inventory']) || [],
    created_at: partner.created_at.toISOString(),
    updated_at: partner.updated_at.toISOString(),
    notes: partner.notes.map(mapNote),
  };
}

function toPrismaData(data: Partial<Partner>): Prisma.PartnerUncheckedCreateInput {
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
    hardware_inventory: (data.hardware_inventory as Prisma.JsonArray) || [],
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

function toPrismaUpdateData(data: Partial<Partner>): Prisma.PartnerUncheckedUpdateInput {
  const out: Prisma.PartnerUncheckedUpdateInput = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (key === 'id' || key === 'created_at' || key === 'updated_at' || key === 'notes') continue;
    if (key === 'hardware_inventory') {
      out.hardware_inventory = value as Prisma.JsonArray;
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
  if (!hasDb()) return addMockPartner(data);

  const created = await prisma.partner.create({
    data: toPrismaData(data),
    include: { notes: { orderBy: { created_at: 'desc' } } },
  });
  return mapPartner(created);
}

export async function updatePartner(id: number, data: Partial<Partner>): Promise<Partner | null> {
  if (!hasDb()) return updateMockPartner(id, data);

  const updateData = toPrismaUpdateData(data);
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
    created_at: note.created_at.toISOString(),
  };
}
