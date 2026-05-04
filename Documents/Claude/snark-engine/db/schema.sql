CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Auth -----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS accounts (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                  TEXT UNIQUE NOT NULL,
  password_hash          TEXT NOT NULL,
  is_admin               BOOLEAN NOT NULL DEFAULT false,
  plan                   TEXT NOT NULL DEFAULT 'free',
  replies_used           INTEGER NOT NULL DEFAULT 0,
  replies_limit          INTEGER NOT NULL DEFAULT 100,
  voice_intensity        TEXT NOT NULL DEFAULT 'balanced',
  voice_extracted        BOOLEAN NOT NULL DEFAULT false,
  auto_post_enabled      BOOLEAN NOT NULL DEFAULT false,
  billing_period_start   DATE,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  created_at             TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS account_credentials (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id           UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  platform             TEXT NOT NULL,
  access_token         TEXT NOT NULL,
  platform_account_id  TEXT NOT NULL,
  username             TEXT,
  expires_at           TIMESTAMPTZ,
  connected_at         TIMESTAMPTZ DEFAULT now()
);

-- Content (populated in Plan 3 migration) ------------------------------------

CREATE TABLE IF NOT EXISTS comments (
  id                TEXT PRIMARY KEY,
  account_id        UUID REFERENCES accounts(id) ON DELETE CASCADE,
  post_id           TEXT NOT NULL,
  post_permalink    TEXT,
  parent_comment_id TEXT,
  username          TEXT NOT NULL,
  text              TEXT NOT NULL,
  timestamp         TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending',
  source            TEXT NOT NULL DEFAULT 'instagram',
  intent            TEXT,
  intent_confidence REAL,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS replies (
  id                 SERIAL PRIMARY KEY,
  account_id         UUID REFERENCES accounts(id) ON DELETE CASCADE,
  comment_id         TEXT NOT NULL REFERENCES comments(id),
  reply_text         TEXT NOT NULL,
  confidence_score   REAL,
  flagged_for_review BOOLEAN NOT NULL DEFAULT false,
  flag_reason        TEXT,
  status             TEXT NOT NULL DEFAULT 'pending',
  voice_intensity    TEXT,
  copyable_text      TEXT,
  scheduled_at       TIMESTAMPTZ,
  posted_at          TIMESTAMPTZ,
  created_at         TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  key        TEXT NOT NULL,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (account_id, key)
);

CREATE TABLE IF NOT EXISTS voice_examples (
  id         SERIAL PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  comment    TEXT NOT NULL,
  reply      TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'reply',
  intent     TEXT,
  active     BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes --------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_comments_account   ON comments(account_id);
CREATE INDEX IF NOT EXISTS idx_comments_intent    ON comments(intent);
CREATE INDEX IF NOT EXISTS idx_comments_status    ON comments(status);
CREATE INDEX IF NOT EXISTS idx_replies_account    ON replies(account_id);
CREATE INDEX IF NOT EXISTS idx_replies_status     ON replies(status);
CREATE INDEX IF NOT EXISTS idx_replies_scheduled  ON replies(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_voice_account      ON voice_examples(account_id);
CREATE INDEX IF NOT EXISTS idx_creds_account      ON account_credentials(account_id);
