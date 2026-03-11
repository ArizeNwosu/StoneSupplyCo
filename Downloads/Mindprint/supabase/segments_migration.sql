-- Mindprint Segmented Replay Migration
-- Non-destructive addition on top of the current recordings + recording_chunks
-- schema. This keeps the restored rrweb flow working while enabling
-- multi-tool, multi-renderer replay sessions.

-- ─── Recordings extensions ───────────────────────────────────────────────────
ALTER TABLE recordings
  ADD COLUMN IF NOT EXISTS capture_strategy text DEFAULT 'segmented',
  ADD COLUMN IF NOT EXISTS primary_tool text,
  ADD COLUMN IF NOT EXISTS segment_count integer DEFAULT 0;

-- ─── Recording segments ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recording_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL REFERENCES recordings(session_id) ON DELETE CASCADE,
  segment_index integer NOT NULL,
  tool text NOT NULL,
  host text,
  url text,
  title text,
  capture_mode text NOT NULL, -- rrweb | semantic | screen
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_ms bigint DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE (session_id, segment_index)
);

-- ─── Segment artifacts ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS segment_artifacts (
  id bigserial PRIMARY KEY,
  session_id text NOT NULL REFERENCES recordings(session_id) ON DELETE CASCADE,
  segment_id uuid NOT NULL REFERENCES recording_segments(id) ON DELETE CASCADE,
  artifact_type text NOT NULL, -- rrweb_chunk | semantic_checkpoint | semantic_event | video
  chunk_index integer,
  payload jsonb,
  storage_url text,
  created_at timestamptz DEFAULT now()
);

-- ─── Segment markers ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS segment_markers (
  id bigserial PRIMARY KEY,
  session_id text NOT NULL REFERENCES recordings(session_id) ON DELETE CASCADE,
  segment_id uuid NOT NULL REFERENCES recording_segments(id) ON DELETE CASCADE,
  marker_type text NOT NULL,
  at_ms bigint NOT NULL,
  label text,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_segments_session
  ON recording_segments (session_id, segment_index);

CREATE INDEX IF NOT EXISTS idx_segment_artifacts_segment
  ON segment_artifacts (session_id, segment_id, artifact_type, chunk_index);

CREATE INDEX IF NOT EXISTS idx_segment_markers_segment
  ON segment_markers (session_id, segment_id, at_ms);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE recording_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_markers ENABLE ROW LEVEL SECURITY;

-- Public read for replay viewer
CREATE POLICY "Public read segments"
  ON recording_segments FOR SELECT
  USING (true);

CREATE POLICY "Public read segment artifacts"
  ON segment_artifacts FOR SELECT
  USING (true);

CREATE POLICY "Public read segment markers"
  ON segment_markers FOR SELECT
  USING (true);

-- Extension insert access using anon key
CREATE POLICY "Anon insert segments"
  ON recording_segments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anon insert segment artifacts"
  ON segment_artifacts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anon insert segment markers"
  ON segment_markers FOR INSERT
  WITH CHECK (true);
