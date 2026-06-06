-- Prevent duplicate snapshots for the same tracked account on the same timestamp.
-- This mirrors the existing unique constraint on PublicSnapshot.
-- WARNING: Run `DELETE FROM "Snapshot" WHERE ...` to remove any duplicates first
-- if applying to a database with existing data.
CREATE UNIQUE INDEX IF NOT EXISTS "Snapshot_trackedAccountId_takenAt_key"
  ON "Snapshot"("trackedAccountId", "takenAt");
