-- CreateAccess Partnership Management Schema
-- Run this against your Neon database to initialize tables.

-- Status enum
CREATE TABLE IF NOT EXISTS partner_statuses (
  id SERIAL PRIMARY KEY,
  label TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO partner_statuses (label, color, sort_order) VALUES
  ('New', '#3b82f6', 1),
  ('In Conversation', '#8b5cf6', 2),
  ('Pending — CreateAccess 🏀', '#e85d3c', 3),
  ('Pending — Partner', '#f59e0b', 4),
  ('Active Partner', '#10b981', 5),
  ('Not a Fit / Closed', '#6b7280', 6)
ON CONFLICT (label) DO NOTHING;

-- Main partners/organizations table
CREATE TABLE IF NOT EXISTS partners (
  id SERIAL PRIMARY KEY,
  -- Section 1: Org info
  org_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_role TEXT,
  org_website TEXT,
  org_address TEXT,
  org_city TEXT,
  org_state TEXT,

  -- Section 2: Status
  status TEXT NOT NULL DEFAULT 'New' REFERENCES partner_statuses(label),

  -- Section 3: Program info
  program_structure TEXT,
  who_they_work_with TEXT,
  youth_ages TEXT,
  how_kids_connect TEXT,
  intake_message TEXT,
  recruitment_needed BOOLEAN,
  recruitment_notes TEXT,
  program_times TEXT,
  schedule_flexibility TEXT,
  desired_program_type TEXT,
  specific_project_request TEXT,
  wants_recommendations BOOLEAN DEFAULT FALSE,
  desired_timeline TEXT,
  firm_dates TEXT,

  -- Section 4: Tech + Space
  works_with_3d_tech TEXT, -- 'yes' | 'no' | 'interested'
  three_d_tech_specifics TEXT,
  hardware_inventory JSONB DEFAULT '[]'::jsonb, -- [{type, quantity, notes}]
  hardware_notes TEXT,
  available_computers TEXT,
  internet_availability TEXT,
  available_space TEXT,
  on_site_assistance BOOLEAN,
  on_site_assistance_notes TEXT,
  accessibility_limitations TEXT,
  general_tech_context TEXT,

  -- Meta
  source TEXT DEFAULT 'manual', -- 'intake_form' | 'manual'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_created_at ON partners(created_at DESC);

-- Conversation log / notes
CREATE TABLE IF NOT EXISTS partner_notes (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  author TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_notes_partner_id ON partner_notes(partner_id);

-- User accounts for internal access
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff', -- 'admin' | 'staff'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Form configuration (admin configurator)
CREATE TABLE IF NOT EXISTS form_config (
  id SERIAL PRIMARY KEY,
  section_key TEXT NOT NULL,
  section_label TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL, -- 'text' | 'textarea' | 'select' | 'boolean' | 'checklist'
  options JSONB DEFAULT '[]'::jsonb,
  visible BOOLEAN DEFAULT TRUE,
  required BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(section_key, field_key)
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_partners_updated_at ON partners;
CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
