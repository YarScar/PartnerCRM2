-- 20260618013651_add_partner_properties is an empty placeholder (its SQL was applied
-- to production by hand), so a database built from these migrations alone had no
-- "properties" column. IF NOT EXISTS makes this a no-op where it already exists.
ALTER TABLE "partners" ADD COLUMN IF NOT EXISTS "properties" JSONB;
