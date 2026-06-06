-- Add nullable password column to User for email+password auth
-- Existing rows remain NULL (magic-link users unaffected)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password" TEXT;
