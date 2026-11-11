-- CreateTable
CREATE TABLE "programs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "age_min" INTEGER,
    "age_max" INTEGER,
    "audience_notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_runs" (
    "id" SERIAL NOT NULL,
    "program_id" INTEGER NOT NULL,
    "partner_id" INTEGER,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Planned',
    "start_date" DATE,
    "end_date" DATE,
    "location" TEXT,
    "age_min" INTEGER,
    "age_max" INTEGER,
    "participant_count" INTEGER,
    "what_changed" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "program_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "category" TEXT,
    "goals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "age_min" INTEGER,
    "age_max" INTEGER,
    "duration_minutes" INTEGER,
    "group_size" TEXT,
    "materials" TEXT,
    "instructions" TEXT,
    "based_on_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_activities" (
    "id" SERIAL NOT NULL,
    "program_id" INTEGER NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "program_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "run_activities" (
    "id" SERIAL NOT NULL,
    "run_id" INTEGER NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "run_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_program_runs_program_id" ON "program_runs"("program_id");

-- CreateIndex
CREATE INDEX "idx_program_runs_partner_id" ON "program_runs"("partner_id");

-- CreateIndex
CREATE INDEX "idx_activities_based_on_id" ON "activities"("based_on_id");

-- CreateIndex
CREATE UNIQUE INDEX "program_activities_program_id_activity_id_key" ON "program_activities"("program_id", "activity_id");

-- CreateIndex
CREATE INDEX "idx_run_activities_run_id" ON "run_activities"("run_id");

-- AddForeignKey
ALTER TABLE "program_runs" ADD CONSTRAINT "program_runs_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_runs" ADD CONSTRAINT "program_runs_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_based_on_id_fkey" FOREIGN KEY ("based_on_id") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_activities" ADD CONSTRAINT "program_activities_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_activities" ADD CONSTRAINT "program_activities_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "run_activities" ADD CONSTRAINT "run_activities_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "program_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "run_activities" ADD CONSTRAINT "run_activities_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

