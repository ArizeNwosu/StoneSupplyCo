create extension if not exists "pgcrypto";

-- cards
create table public.cards (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete set null,
  slug             text unique not null,
  title            text,
  unit             text not null default 'lbs' check (unit in ('lbs', 'kg')),
  start_weight     numeric not null,
  current_weight   numeric not null,
  goal_weight      numeric not null,
  start_date       date not null,
  method           text not null default '',
  habits           text[] not null default '{}',
  before_photo_url text not null default '',
  after_photo_url  text not null default '',
  watermarked      boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- weight entries (daily log for progress chart)
create table public.weight_entries (
  id       uuid primary key default gen_random_uuid(),
  card_id  uuid not null references public.cards(id) on delete cascade,
  date     date not null,
  weight   numeric not null,
  note     text,
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.cards enable row level security;
alter table public.weight_entries enable row level security;

-- Anyone can read any card (for shareable links)
create policy "cards_public_read" on public.cards
  for select using (true);

-- Anyone can insert a card (guest card creation)
create policy "cards_insert_anyone" on public.cards
  for insert with check (true);

-- Only owner can update/delete
create policy "cards_owner_update" on public.cards
  for update using (auth.uid() = user_id);

create policy "cards_owner_delete" on public.cards
  for delete using (auth.uid() = user_id);

-- Weight entries inherit card access
create policy "entries_public_read" on public.weight_entries
  for select using (true);

create policy "entries_insert_anyone" on public.weight_entries
  for insert with check (true);

create policy "entries_owner_modify" on public.weight_entries
  for update using (
    exists (select 1 from public.cards where id = card_id and user_id = auth.uid())
  );

create policy "entries_owner_delete" on public.weight_entries
  for delete using (
    exists (select 1 from public.cards where id = card_id and user_id = auth.uid())
  );

-- Storage bucket for photos
insert into storage.buckets (id, name, public) values ('card-photos', 'card-photos', false);

-- Anyone can upload photos (for guest card creation)
create policy "photos_upload_anyone" on storage.objects
  for insert with check (bucket_id = 'card-photos');

-- Anyone can read photos (signed URLs used)
create policy "photos_read_anyone" on storage.objects
  for select using (bucket_id = 'card-photos');
