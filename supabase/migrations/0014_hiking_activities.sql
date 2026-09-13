-- Private-by-default hiking diary and future HealthKit import foundation.
-- This migration does not change certification GPS, collection progress, or
-- verification-point data. Manual records can never enter pace rankings.

create table if not exists public.hiking_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  mountain_id uuid references public.mountains (id) on delete set null,
  certification_id uuid references public.certification_sessions (id) on delete set null,
  source text not null default 'manual',
  source_workout_id_hash text,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  moving_seconds integer not null,
  distance_m integer not null,
  elevation_gain_m integer,
  note text,
  visibility text not null default 'private',
  ranking_opt_in boolean not null default false,
  ranking_eligible boolean not null default false,
  pace_seconds_per_km numeric(10, 2)
    generated always as (round(moving_seconds::numeric * 1000 / distance_m::numeric, 2)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hiking_activities_source_check check (source in ('manual', 'healthkit')),
  constraint hiking_activities_visibility_check check (visibility in ('private', 'friends', 'public')),
  constraint hiking_activities_time_check check (ended_at > started_at),
  constraint hiking_activities_moving_seconds_check check (moving_seconds between 60 and 172800),
  constraint hiking_activities_distance_check check (distance_m between 100 and 200000),
  constraint hiking_activities_elevation_check check (elevation_gain_m is null or elevation_gain_m between 0 and 15000),
  constraint hiking_activities_note_check check (note is null or length(note) <= 500),
  constraint hiking_activities_source_id_check check (
    (source = 'manual' and source_workout_id_hash is null)
    or (source = 'healthkit' and source_workout_id_hash is not null)
  ),
  constraint hiking_activities_ranking_check check (
    not ranking_eligible
    or (source = 'healthkit' and certification_id is not null and ranking_opt_in)
  )
);

create index if not exists hiking_activities_user_started_idx
  on public.hiking_activities (user_id, started_at desc);
create index if not exists hiking_activities_mountain_ranking_idx
  on public.hiking_activities (mountain_id, pace_seconds_per_km)
  where ranking_eligible and ranking_opt_in;
create unique index if not exists hiking_activities_source_workout_unique
  on public.hiking_activities (user_id, source, source_workout_id_hash)
  where source_workout_id_hash is not null;
create unique index if not exists hiking_activities_user_certification_unique
  on public.hiking_activities (user_id, certification_id)
  where certification_id is not null;

-- A linked activity must point to a certification in which the same user is a
-- confirmed member. The mountain is filled from the certification when absent,
-- and conflicting mountain ids are rejected.
create or replace function public.validate_hiking_activity_certification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  linked_mountain_id uuid;
begin
  if new.certification_id is not null then
    select session.mountain_id
    into linked_mountain_id
    from public.certification_sessions session
    join public.certification_members member
      on member.certification_id = session.id
     and member.user_id = new.user_id
     and member.status = 'confirmed'
    where session.id = new.certification_id;

    if linked_mountain_id is null then
      raise exception 'activity certification must belong to a confirmed member';
    end if;

    if new.mountain_id is null then
      new.mountain_id := linked_mountain_id;
    elsif new.mountain_id <> linked_mountain_id then
      raise exception 'activity mountain must match certification mountain';
    end if;
  end if;

  if new.source = 'manual' then
    new.ranking_eligible := false;
  end if;

  return new;
end;
$$;

drop trigger if exists hiking_activities_validate_certification on public.hiking_activities;
create trigger hiking_activities_validate_certification
  before insert or update of certification_id, mountain_id, source, ranking_eligible
  on public.hiking_activities
  for each row execute function public.validate_hiking_activity_certification();

create or replace function public.touch_hiking_activity_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists hiking_activities_touch_updated_at on public.hiking_activities;
create trigger hiking_activities_touch_updated_at
  before update on public.hiking_activities
  for each row execute function public.touch_hiking_activity_updated_at();

alter table public.hiking_activities enable row level security;

-- Keep trusted ranking fields and HealthKit provenance out of direct client
-- writes. A later migration will expose a narrow import RPC for native data.
revoke all on public.hiking_activities from anon, authenticated;
grant select on public.hiking_activities to authenticated;
grant insert (
  user_id,
  mountain_id,
  certification_id,
  source,
  started_at,
  ended_at,
  moving_seconds,
  distance_m,
  elevation_gain_m,
  note,
  visibility,
  ranking_opt_in
) on public.hiking_activities to authenticated;
grant update (
  mountain_id,
  certification_id,
  started_at,
  ended_at,
  moving_seconds,
  distance_m,
  elevation_gain_m,
  note,
  visibility,
  ranking_opt_in
) on public.hiking_activities to authenticated;
grant delete on public.hiking_activities to authenticated;

drop policy if exists "hiking_activities_select_visible" on public.hiking_activities;
create policy "hiking_activities_select_visible" on public.hiking_activities
  for select to authenticated using (
    auth.uid() = user_id
    or visibility = 'public'
    or (visibility = 'friends' and public.is_mutual_follow(auth.uid(), user_id))
  );

drop policy if exists "hiking_activities_insert_manual_owner" on public.hiking_activities;
create policy "hiking_activities_insert_manual_owner" on public.hiking_activities
  for insert to authenticated with check (
    auth.uid() = user_id
    and source = 'manual'
    and source_workout_id_hash is null
    and not ranking_eligible
  );

drop policy if exists "hiking_activities_update_owner" on public.hiking_activities;
create policy "hiking_activities_update_owner" on public.hiking_activities
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "hiking_activities_delete_owner" on public.hiking_activities;
create policy "hiking_activities_delete_owner" on public.hiking_activities
  for delete to authenticated using (auth.uid() = user_id);

comment on table public.hiking_activities is
  'Private-by-default hiking aggregates. Raw HealthKit routes and health identifiers are never stored here.';
comment on column public.hiking_activities.pace_seconds_per_km is
  'Server-generated average moving pace. Clients cannot write computed pace.';
comment on column public.hiking_activities.ranking_eligible is
  'Trusted eligibility flag. Manual client inserts are always false.';

