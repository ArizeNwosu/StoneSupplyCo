-- Migration 002: add unique constraint to account_credentials
-- idempotent; safe to re-run
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.table_constraints
    WHERE  constraint_name = 'uq_creds_account_platform'
    AND    table_name      = 'account_credentials'
  ) THEN
    ALTER TABLE account_credentials
      ADD CONSTRAINT uq_creds_account_platform UNIQUE (account_id, platform);
  END IF;
END $$;
