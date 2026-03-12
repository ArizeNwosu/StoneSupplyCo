-- ─────────────────────────────────────────────────────────────────────────────
-- Callmate — Supabase Schema
-- Run this in the Supabase SQL Editor: https://app.supabase.com → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text,
  gender        text,
  age_range     text,
  anxiety_severity text,
  anxiety_triggers jsonb not null default '[]',
  life_impact   jsonb not null default '[]',
  call_streak   integer not null default 0,
  tier          text not null default 'free',
  trial_start_date bigint,
  dark_mode     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles add column if not exists anxiety_severity text;
alter table public.profiles add column if not exists anxiety_triggers jsonb not null default '[]';
alter table public.profiles add column if not exists life_impact jsonb not null default '[]';
alter table public.profiles add column if not exists call_streak integer not null default 0;

-- ─── Scripts ─────────────────────────────────────────────────────────────────
create table if not exists public.scripts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  description   text not null,
  tone          text not null,
  opening       text not null,
  main_ask      text not null,
  branch_x      jsonb,
  branch_y      jsonb,
  extra_branches jsonb not null default '[]',
  close         text not null,
  timestamp     bigint not null,
  created_at    timestamptz not null default now()
);

create index if not exists scripts_user_id_idx on public.scripts(user_id);

-- ─── Reflections ─────────────────────────────────────────────────────────────
create table if not exists public.reflections (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  script_id     uuid not null references public.scripts(id) on delete cascade,
  feedback      text not null,
  timestamp     bigint not null,
  created_at    timestamptz not null default now()
);

create index if not exists reflections_user_id_idx on public.reflections(user_id);

-- ─── Anxiety Ratings ─────────────────────────────────────────────────────────
create table if not exists public.anxiety_ratings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  script_id     uuid not null references public.scripts(id) on delete cascade,
  rating        integer not null check (rating >= 1 and rating <= 5),
  timestamp     bigint not null,
  created_at    timestamptz not null default now()
);

create index if not exists anxiety_ratings_user_id_idx on public.anxiety_ratings(user_id);

-- ─── Personas ────────────────────────────────────────────────────────────────
create table if not exists public.personas (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  context       text not null,
  created_at    timestamptz not null default now()
);

create index if not exists personas_user_id_idx on public.personas(user_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.scripts        enable row level security;
alter table public.reflections    enable row level security;
alter table public.anxiety_ratings enable row level security;
alter table public.personas       enable row level security;

-- Profiles
create policy "profiles: own read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: own insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles: own update" on public.profiles for update using (auth.uid() = id);

-- Scripts
create policy "scripts: own all" on public.scripts for all using (auth.uid() = user_id);

-- Reflections
create policy "reflections: own all" on public.reflections for all using (auth.uid() = user_id);

-- Anxiety ratings
create policy "anxiety_ratings: own all" on public.anxiety_ratings for all using (auth.uid() = user_id);

-- Personas
create policy "personas: own all" on public.personas for all using (auth.uid() = user_id);

-- ─── Auto-create profile on signup ───────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
