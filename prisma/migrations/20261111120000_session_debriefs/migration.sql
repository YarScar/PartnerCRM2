-- CreateTable
CREATE TABLE "session_debriefs" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "attendance" INTEGER,
    "engagement" INTEGER,
    "went_well" TEXT,
    "to_improve" TEXT,
    "changes_next_time" TEXT,
    "highlights" TEXT,
    "follow_ups" TEXT,
    "submitted_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "session_debriefs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_debriefs_session_id_key" ON "session_debriefs"("session_id");

-- AddForeignKey
ALTER TABLE "session_debriefs" ADD CONSTRAINT "session_debriefs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "program_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

