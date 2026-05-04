-- Migration 002: add unique constraint to account_credentials
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_creds_account_platform'
  ) THEN
    ALTER TABLE account_credentials
      ADD CONSTRAINT uq_creds_account_platform UNIQUE (account_id, platform);
  END IF;
END $$;
