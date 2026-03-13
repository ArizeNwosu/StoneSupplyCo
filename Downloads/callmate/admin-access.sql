-- Admin access allowlist for Callmate
-- Run this in the Supabase SQL Editor.

create table if not exists public.admin_users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  is_active     boolean not null default true,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create unique index if not exists admin_users_email_lower_idx on public.admin_users ((lower(email)));

alter table public.admin_users enable row level security;

drop policy if exists "admin_users: own email lookup" on public.admin_users;
create policy "admin_users: own email lookup"
  on public.admin_users
  for select
  using (
    auth.role() = 'authenticated'
    and lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  );

-- Example:
-- insert into public.admin_users (email, notes)
-- values ('you@example.com', 'Founder account')
-- on conflict (email) do update
-- set is_active = excluded.is_active,
--     notes = excluded.notes,
--     updated_at = now();
