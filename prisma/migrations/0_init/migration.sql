-- CreateTable Partner
CREATE TABLE IF NOT EXISTS "partners" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "org_name" TEXT NOT NULL,
    "contact_name" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "contact_role" TEXT,
    "org_website" TEXT,
    "org_address" TEXT,
    "org_city" TEXT,
    "org_state" TEXT,
    "status" TEXT NOT NULL DEFAULT 'New',
    "program_structure" TEXT,
    "who_they_work_with" TEXT,
    "youth_ages" TEXT,
    "how_kids_connect" TEXT,
    "intake_message" TEXT,
    "recruitment_needed" BOOLEAN,
    "recruitment_notes" TEXT,
    "program_times" TEXT,
    "schedule_flexibility" TEXT,
    "desired_program_type" TEXT,
    "specific_project_request" TEXT,
    "wants_recommendations" BOOLEAN NOT NULL DEFAULT false,
    "desired_timeline" TEXT,
    "firm_dates" TEXT,
    "works_with_3d_tech" TEXT,
    "three_d_tech_specifics" TEXT,
    "hardware_inventory" JSONB,
    "hardware_notes" TEXT,
    "available_computers" TEXT,
    "internet_availability" TEXT,
    "available_space" TEXT,
    "on_site_assistance" BOOLEAN,
    "on_site_assistance_notes" TEXT,
    "accessibility_limitations" TEXT,
    "general_tech_context" TEXT,
    "source" TEXT DEFAULT 'manual',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable PartnerStatus
CREATE TABLE IF NOT EXISTS "partner_statuses" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL UNIQUE,
    "color" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable PartnerNote
CREATE TABLE IF NOT EXISTS "partner_notes" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "partner_id" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "author" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "partner_notes_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable User
CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL UNIQUE,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable FormConfig
CREATE TABLE IF NOT EXISTS "form_config" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "section_key" TEXT NOT NULL,
    "section_label" TEXT NOT NULL,
    "field_key" TEXT NOT NULL,
    "field_label" TEXT NOT NULL,
    "field_type" TEXT NOT NULL,
    "options" JSONB,
    "visible" BOOLEAN DEFAULT true,
    "required" BOOLEAN DEFAULT false,
    "sort_order" INTEGER DEFAULT 0,
    CONSTRAINT "form_config_section_key_field_key_key" UNIQUE("section_key", "field_key")
);

-- CreateIndex
CREATE INDEX "idx_partners_status" ON "partners"("status");
CREATE INDEX "idx_partners_created_at" ON "partners"("created_at" DESC);
CREATE INDEX "idx_partner_notes_partner_id" ON "partner_notes"("partner_id");
CREATE UNIQUE INDEX "idx_users_username" ON "users"("username");
