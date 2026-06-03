-- Add unique constraint to prevent duplicate PublicSnapshot rows per account+timestamp
-- Prevents concurrent backfill runs from inserting exact-timestamp duplicates
CREATE UNIQUE INDEX IF NOT EXISTS "PublicSnapshot_publicAccountId_takenAt_key"
  ON "PublicSnapshot"("publicAccountId", "takenAt");
