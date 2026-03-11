-- Mindprint Supabase Schema
-- Run this in your Supabase SQL editor (Database → SQL Editor → New query)
-- This is the restored rrweb-first baseline schema.
-- For the non-destructive segmented replay extension, run:
--   supabase/segments_migration.sql

-- ─── Recordings ──────────────────────────────────────────────────────────────
-- One row per recording session.
CREATE TABLE IF NOT EXISTS recordings (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      text        UNIQUE NOT NULL,
  created_at      timestamptz DEFAULT now(),
  url             text,
  title           text,
  duration_ms     bigint      DEFAULT 0,
  ai_interactions jsonb       DEFAULT '[]'::jsonb,
  metadata        jsonb       DEFAULT '{}'::jsonb
);

-- ─── Recording chunks ────────────────────────────────────────────────────────
-- rrweb events are uploaded in batches of 200 and stored as JSON arrays.
-- Ordering by chunk_index reconstructs the original event stream.
CREATE TABLE IF NOT EXISTS recording_chunks (
  id          bigserial   PRIMARY KEY,
  session_id  text        NOT NULL REFERENCES recordings(session_id) ON DELETE CASCADE,
  chunk_index integer     NOT NULL,
  events      jsonb       NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (session_id, chunk_index)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_recording_chunks_session
  ON recording_chunks (session_id, chunk_index);

CREATE INDEX IF NOT EXISTS idx_recordings_created_at
  ON recordings (created_at DESC);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- Enable RLS on both tables so only authenticated users can write,
-- but anonymous reads are allowed (for the public viewer).
ALTER TABLE recordings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE recording_chunks ENABLE ROW LEVEL SECURITY;

-- Allow public read (viewer can fetch recordings without auth)
CREATE POLICY "Public read recordings"
  ON recordings FOR SELECT
  USING (true);

CREATE POLICY "Public read chunks"
  ON recording_chunks FOR SELECT
  USING (true);

-- Allow the extension to insert using the anon key
-- (tighten this to authenticated users once you add auth)
CREATE POLICY "Anon insert recordings"
  ON recordings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anon insert chunks"
  ON recording_chunks FOR INSERT
  WITH CHECK (true);
