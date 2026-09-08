-- 100PEAKS initial schema — 100PEAKS_MASTER_SPEC.md §9, §23, §24.
-- Apply with: supabase db push  (or run in the SQL editor)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,20}$')
);

-- Create a profile row automatically on sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'username',
      'user_' || substr(replace(new.id::text, '-', ''), 1, 8)
    ),
    new.raw_user_meta_data ->> 'display_name'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- mountains
-- ---------------------------------------------------------------------------
create table if not exists public.mountains (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_ko text not null,
  name_en text,
  altitude_m integer,
  region text,
  latitude double precision not null,
  longitude double precision not null,
  verification_radius_m integer not null default 100,
  image_url text,
  mascot_key text,
  description text,
  display_order integer,
  created_at timestamptz not null default now()
);

create index if not exists mountains_display_order_idx on public.mountains (display_order);

-- ---------------------------------------------------------------------------
-- follows (mutual relation is derived, not stored)
-- ---------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create index if not exists follows_following_id_idx on public.follows (following_id);

-- ---------------------------------------------------------------------------
-- certification_sessions (one shared summit visit)
-- ---------------------------------------------------------------------------
create table if not exists public.certification_sessions (
  id uuid primary key default gen_random_uuid(),
  mountain_id uuid not null references public.mountains (id) on delete restrict,
  creator_user_id uuid not null references public.profiles (id) on delete cascade,
  photo_url text not null,
  latitude double precision not null,
  longitude double precision not null,
  gps_accuracy_m double precision,
  verification_radius_m integer not null,
  captured_at timestamptz not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  constraint certification_sessions_status_check
    check (status in ('active', 'completed', 'cancelled'))
);

create index if not exists certification_sessions_mountain_idx
  on public.certification_sessions (mountain_id, captured_at desc);
create index if not exists certification_sessions_creator_idx
  on public.certification_sessions (creator_user_id);

-- ---------------------------------------------------------------------------
-- certification_members (participants of a session)
-- ---------------------------------------------------------------------------
create table if not exists public.certification_members (
  certification_id uuid not null references public.certification_sessions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  invited_by uuid references public.profiles (id) on delete set null,
  status text not null,
  acceptance_latitude double precision,
  acceptance_longitude double precision,
  acceptance_accuracy_m double precision,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (certification_id, user_id),
  constraint certification_members_status_check
    check (status in ('invited', 'confirmed', 'declined', 'expired'))
);

create index if not exists certification_members_user_idx
  on public.certification_members (user_id, status);

-- ---------------------------------------------------------------------------
-- favorites
-- ---------------------------------------------------------------------------
create table if not exists public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  mountain_id uuid not null references public.mountains (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, mountain_id)
);

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------

-- A follows B and B follows A — spec §6.2.
create or replace function public.is_mutual_follow(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.follows where follower_id = a and following_id = b)
     and exists (select 1 from public.follows where follower_id = b and following_id = a);
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security — spec §24
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.mountains enable row level security;
alter table public.follows enable row level security;
alter table public.certification_sessions enable row level security;
alter table public.certification_members enable row level security;
alter table public.favorites enable row level security;

-- profiles: readable by authenticated users; writable by owner
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);
create policy "profiles_update_owner" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- mountains: readable by authenticated users; admin-managed (no client writes)
create policy "mountains_select_authenticated" on public.mountains
  for select to authenticated using (true);

-- follows: readable by authenticated users; insert/delete by follower owner
create policy "follows_select_authenticated" on public.follows
  for select to authenticated using (true);
create policy "follows_insert_owner" on public.follows
  for insert to authenticated with check (auth.uid() = follower_id);
create policy "follows_delete_owner" on public.follows
  for delete to authenticated using (auth.uid() = follower_id);

-- certification_sessions: readable for the social product; created by the creator
create policy "certification_sessions_select_authenticated" on public.certification_sessions
  for select to authenticated using (true);
create policy "certification_sessions_insert_creator" on public.certification_sessions
  for insert to authenticated with check (auth.uid() = creator_user_id);
create policy "certification_sessions_update_creator" on public.certification_sessions
  for update to authenticated using (auth.uid() = creator_user_id)
  with check (auth.uid() = creator_user_id);

-- certification_members: readable; creator may invite mutual friends (and add self);
-- invited user may update only their own row
create policy "certification_members_select_authenticated" on public.certification_members
  for select to authenticated using (true);
create policy "certification_members_insert_creator" on public.certification_members
  for insert to authenticated with check (
    exists (
      select 1 from public.certification_sessions s
      where s.id = certification_id and s.creator_user_id = auth.uid()
    )
    and (
      user_id = auth.uid()
      or public.is_mutual_follow(auth.uid(), user_id)
    )
  );
create policy "certification_members_update_own" on public.certification_members
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- favorites: owner-only mutation
create policy "favorites_select_owner" on public.favorites
  for select to authenticated using (auth.uid() = user_id);
create policy "favorites_insert_owner" on public.favorites
  for insert to authenticated with check (auth.uid() = user_id);
create policy "favorites_delete_owner" on public.favorites
  for delete to authenticated using (auth.uid() = user_id);
