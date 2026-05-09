import { getDb } from './db';
import { Pool } from '@neondatabase/serverless';
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

export async function listPartners(): Promise<Partner[]> {
  const sql = getDb();
  if (!sql) return getMockPartners();

  const rows = await sql`
    SELECT p.*,
      COALESCE(
        (SELECT json_agg(n ORDER BY n.created_at DESC)
         FROM partner_notes n WHERE n.partner_id = p.id),
        '[]'::json
      ) AS notes
    FROM partners p
    ORDER BY p.updated_at DESC
  `;
  return rows as Partner[];
}

export async function getPartner(id: number): Promise<Partner | null> {
  const sql = getDb();
  if (!sql) return getMockPartner(id);

  const rows = await sql`
    SELECT p.*,
      COALESCE(
        (SELECT json_agg(n ORDER BY n.created_at DESC)
         FROM partner_notes n WHERE n.partner_id = p.id),
        '[]'::json
      ) AS notes
    FROM partners p
    WHERE p.id = ${id}
    LIMIT 1
  `;
  return (rows[0] as Partner) || null;
}

export async function createPartner(data: Partial<Partner>): Promise<Partner> {
  const sql = getDb();
  if (!sql) return addMockPartner(data);

  const rows = await sql`
    INSERT INTO partners (
      org_name, contact_name, contact_email, contact_phone, contact_role,
      org_website, org_city, org_state, status,
      program_structure, who_they_work_with, youth_ages, how_kids_connect, intake_message,
      recruitment_needed, recruitment_notes, program_times, schedule_flexibility,
      desired_program_type, specific_project_request, wants_recommendations,
      desired_timeline, firm_dates,
      works_with_3d_tech, three_d_tech_specifics, hardware_inventory, hardware_notes,
      available_computers, internet_availability, available_space,
      on_site_assistance, on_site_assistance_notes, accessibility_limitations,
      general_tech_context, source
    ) VALUES (
      ${data.org_name || ''}, ${data.contact_name || null}, ${data.contact_email || null},
      ${data.contact_phone || null}, ${data.contact_role || null},
      ${data.org_website || null}, ${data.org_city || null}, ${data.org_state || null},
      ${data.status || 'New'},
      ${data.program_structure || null}, ${data.who_they_work_with || null},
      ${data.youth_ages || null}, ${data.how_kids_connect || null}, ${data.intake_message || null},
      ${data.recruitment_needed ?? null}, ${data.recruitment_notes || null},
      ${data.program_times || null}, ${data.schedule_flexibility || null},
      ${data.desired_program_type || null}, ${data.specific_project_request || null},
      ${data.wants_recommendations ?? false},
      ${data.desired_timeline || null}, ${data.firm_dates || null},
      ${data.works_with_3d_tech || null}, ${data.three_d_tech_specifics || null},
      ${JSON.stringify(data.hardware_inventory || [])}, ${data.hardware_notes || null},
      ${data.available_computers || null}, ${data.internet_availability || null},
      ${data.available_space || null},
      ${data.on_site_assistance ?? null}, ${data.on_site_assistance_notes || null},
      ${data.accessibility_limitations || null},
      ${data.general_tech_context || null}, ${data.source || 'manual'}
    )
    RETURNING *
  `;
  return rows[0] as Partner;
}

export async function updatePartner(id: number, data: Partial<Partner>): Promise<Partner | null> {
  const sql = getDb();
  if (!sql) return updateMockPartner(id, data);

  // Build dynamic update — only set provided fields
  const fields = Object.entries(data).filter(
    ([k, v]) => v !== undefined && k !== 'id' && k !== 'created_at' && k !== 'updated_at' && k !== 'notes'
  );
  if (fields.length === 0) return getPartner(id);

  // Use Pool for parameterized text queries (neon() tagged template can't do dynamic SET clauses)
  const url = process.env.DATABASE_URL!;
  const pool = new Pool({ connectionString: url });
  try {
    const setClauses = fields.map(([k], i) => `${k} = $${i + 1}`);
    const values = fields.map(([k, v]) => {
      if (k === 'hardware_inventory') return JSON.stringify(v);
      return v;
    });

    const query = `UPDATE partners SET ${setClauses.join(', ')} WHERE id = $${fields.length + 1} RETURNING *`;
    const result = await pool.query(query, [...values, id]);
    return (result.rows[0] as Partner) || null;
  } finally {
    await pool.end();
  }
}

export async function deletePartner(id: number): Promise<boolean> {
  const sql = getDb();
  if (!sql) return deleteMockPartner(id);

  const rows = await sql`DELETE FROM partners WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}

export async function updatePartnerStatus(id: number, status: PartnerStatus): Promise<Partner | null> {
  return updatePartner(id, { status });
}

export async function addNote(partnerId: number, body: string, author?: string): Promise<PartnerNote> {
  const sql = getDb();
  if (!sql) return addMockNote(partnerId, body, author);

  const rows = await sql`
    INSERT INTO partner_notes (partner_id, body, author)
    VALUES (${partnerId}, ${body}, ${author || null})
    RETURNING *
  `;
  return rows[0] as PartnerNote;
}
