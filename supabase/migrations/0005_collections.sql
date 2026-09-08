-- 100PEAKS multi-collection model.
-- Adds Forestry Service 100 / BAC 100 challenge layers without changing existing certification records.

create table if not exists public.collections (
  id text primary key,
  name_ko text not null,
  short_name_ko text not null,
  description text,
  source_url text,
  target_count integer not null default 100,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.verification_points (
  id uuid primary key default gen_random_uuid(),
  mountain_id uuid not null references public.mountains (id) on delete cascade,
  name_ko text not null,
  latitude double precision,
  longitude double precision,
  verification_radius_m integer not null default 100,
  coordinate_status text not null default 'pending',
  source_note text,
  created_at timestamptz not null default now(),
  constraint verification_points_coordinate_status_check
    check (coordinate_status in ('pending', 'verified', 'retired')),
  constraint verification_points_coordinates_together_check
    check ((latitude is null and longitude is null) or (latitude is not null and longitude is not null))
);

create table if not exists public.collection_mountains (
  collection_id text not null references public.collections (id) on delete cascade,
  mountain_id uuid not null references public.mountains (id) on delete cascade,
  verification_point_id uuid references public.verification_points (id) on delete set null,
  display_order integer not null,
  source_label text,
  created_at timestamptz not null default now(),
  primary key (collection_id, mountain_id),
  unique (collection_id, display_order)
);

alter table public.profiles
  add column if not exists primary_collection_id text references public.collections (id) on delete set null;

create index if not exists collection_mountains_collection_order_idx
  on public.collection_mountains (collection_id, display_order);
create index if not exists verification_points_mountain_idx
  on public.verification_points (mountain_id);

insert into public.collections (id, name_ko, short_name_ko, description, source_url, target_count, display_order)
values
  ('forest_service_100', '산림청 100대 명산', '산림청 100', '산림청이 선정한 대한민국 100대 명산 컬렉션', null, 100, 1),
  ('bac_100', 'BAC 명산100 기준', 'BAC 100', 'BLACKYAK CLUB 명산100 기준 컬렉션', 'https://bac.blackyak.com/BAC/ChallengeProgram/114', 100, 2)
on conflict (id) do update set
  name_ko = excluded.name_ko,
  short_name_ko = excluded.short_name_ko,
  description = excluded.description,
  source_url = excluded.source_url,
  target_count = excluded.target_count,
  display_order = excluded.display_order;

alter table public.collections enable row level security;
alter table public.collection_mountains enable row level security;
alter table public.verification_points enable row level security;

create policy "collections_select_authenticated" on public.collections
  for select to authenticated using (is_active = true);
create policy "collection_mountains_select_authenticated" on public.collection_mountains
  for select to authenticated using (true);
create policy "verification_points_select_authenticated" on public.verification_points
  for select to authenticated using (true);

-- profiles_update_owner from 0001 already protects primary_collection_id changes as part of the user's own profile.

comment on table public.collections is 'Challenge definitions such as Forestry Service 100 and BAC 100.';
comment on table public.collection_mountains is 'Membership/order of mountains in each challenge. A mountain may belong to multiple collections.';
comment on table public.verification_points is 'Named summit/checkpoint used for GPS verification; coordinates must not be guessed.';
