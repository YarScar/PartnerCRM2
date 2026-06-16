/*
  Warnings:

  - A unique constraint covering the columns `[form_key,section_key,field_key]` on the table `form_config` will be added. If there are existing duplicate values, this will fail.

*/
-- Drop existing unique constraint (backing index is owned by the constraint)
ALTER TABLE "form_config" DROP CONSTRAINT IF EXISTS "form_config_section_key_field_key_key";
-- AlterTable
ALTER TABLE "form_config" ADD COLUMN     "form_key" TEXT NOT NULL DEFAULT 'partner';
-- CreateIndex
CREATE UNIQUE INDEX "form_config_form_key_section_key_field_key_key" ON "form_config"("form_key", "section_key", "field_key");
-- CreateIndex (only if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_users_username' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX "idx_users_username" ON "users"("username")';
  END IF;
END$$;
