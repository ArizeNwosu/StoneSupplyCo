-- scripts/visualizer-schema.sql
-- Run this in the Supabase SQL editor to set up visualizer tables.
--
-- MANUAL STEPS (Supabase Dashboard → Storage):
-- 1. Create bucket "visualizer-photos" — set to PRIVATE (photos contain user homes)
-- 2. Create bucket "visualizer-renders" — set to PUBLIC (renders are shared via links)

-- Sessions
create table if not exists visualizer_sessions (
  id uuid primary key default gen_random_uuid(),
  photo_url text not null,
  room_type text not null check (room_type in ('kitchen', 'bathroom')),
  render_count integer not null default 0,
  lead_captured boolean not null default false,
  created_at timestamptz not null default now()
);

-- Renders
create table if not exists visualizer_renders (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references visualizer_sessions(id) on delete cascade,
  render_url text not null,
  surfaces jsonb not null default '[]'::jsonb,
  share_token text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_visualizer_renders_share_token
  on visualizer_renders(share_token);

create index if not exists idx_visualizer_renders_session_id
  on visualizer_renders(session_id);

-- Leads
create table if not exists visualizer_leads (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references visualizer_sessions(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_visualizer_leads_session_id
  on visualizer_leads(session_id);

-- RPC for atomic render count increment
create or replace function increment_render_count(session_id uuid)
returns void as $$
  update visualizer_sessions
  set render_count = render_count + 1
  where id = session_id;
$$ language sql;
