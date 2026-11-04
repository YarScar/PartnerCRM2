-- DropForeignKey
ALTER TABLE "run_activities" DROP CONSTRAINT "run_activities_run_id_fkey";

-- DropForeignKey
ALTER TABLE "run_activities" DROP CONSTRAINT "run_activities_activity_id_fkey";

-- DropTable
DROP TABLE "run_activities";

-- CreateTable
CREATE TABLE "program_sessions" (
    "id" SERIAL NOT NULL,
    "run_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "title" TEXT,
    "start_time" TEXT,
    "end_time" TEXT,
    "arrival_time" TEXT,
    "location" TEXT,
    "description" TEXT,
    "creator_count" INTEGER,
    "audience_notes" TEXT,
    "development_team" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "facilitation_team" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "equipment" TEXT,
    "planning_doc_url" TEXT,
    "slides_url" TEXT,
    "shared_docs_url" TEXT,
    "other_links" TEXT,
    "tasks" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "program_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_activities" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "session_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_program_sessions_run_id_date" ON "program_sessions"("run_id", "date");

-- CreateIndex
CREATE INDEX "idx_session_activities_session_id" ON "session_activities"("session_id");

-- AddForeignKey
ALTER TABLE "program_sessions" ADD CONSTRAINT "program_sessions_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "program_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_activities" ADD CONSTRAINT "session_activities_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "program_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_activities" ADD CONSTRAINT "session_activities_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

