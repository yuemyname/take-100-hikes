-- Read-only HealthKit import, certification attachment, and privacy-aware pace ranking.
-- Raw workout routes, heart rate, calories, and exact health identifiers are not stored.

-- Imported HealthKit metrics and certification links are trusted server fields.
-- Owners may only edit diary copy, visibility, and the explicit rank opt-in flag.
revoke update on public.hiking_activities from authenticated;
grant update (note, visibility) on public.hiking_activities to authenticated;

create or replace function public.import_healthkit_activity(
  p_source_workout_id_hash text,
  p_started_at timestamptz,
  p_ended_at timestamptz,
  p_moving_seconds integer,
  p_distance_m integer,
  p_elevation_gain_m integer default null,
  p_visibility text default 'private'
)
returns public.hiking_activities
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  imported public.hiking_activities%rowtype;
begin
  if uid is null then
    raise exception 'authentication required';
  end if;
  if p_source_workout_id_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid workout identifier hash';
  end if;
  if p_visibility not in ('private', 'friends', 'public') then
    raise exception 'invalid visibility';
  end if;

  insert into public.hiking_activities (
    user_id,
    source,
    source_workout_id_hash,
    started_at,
    ended_at,
    moving_seconds,
    distance_m,
    elevation_gain_m,
    visibility,
    ranking_opt_in,
    ranking_eligible
  ) values (
    uid,
    'healthkit',
    lower(p_source_workout_id_hash),
    p_started_at,
    p_ended_at,
    p_moving_seconds,
    p_distance_m,
    p_elevation_gain_m,
    p_visibility,
    false,
    false
  )
  on conflict do nothing
  returning * into imported;

  if imported.id is null then
    select activity.*
    into imported
    from public.hiking_activities activity
    where activity.user_id = uid
      and activity.source = 'healthkit'
      and activity.source_workout_id_hash = lower(p_source_workout_id_hash);
  end if;

  return imported;
end;
$$;

create or replace function public.attach_healthkit_activity_to_certification(
  p_activity_id uuid,
  p_certification_id uuid
)
returns public.hiking_activities
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  activity public.hiking_activities%rowtype;
  linked_mountain_id uuid;
  captured_at timestamptz;
  eligible boolean;
begin
  if uid is null then
    raise exception 'authentication required';
  end if;

  select current_activity.*
  into activity
  from public.hiking_activities current_activity
  where current_activity.id = p_activity_id
    and current_activity.user_id = uid
  for update;

  if activity.id is null or activity.source <> 'healthkit' then
    raise exception 'HealthKit activity not found';
  end if;

  select session.mountain_id, session.captured_at
  into linked_mountain_id, captured_at
  from public.certification_sessions session
  join public.certification_members member
    on member.certification_id = session.id
   and member.user_id = uid
   and member.status = 'confirmed'
  where session.id = p_certification_id;

  if linked_mountain_id is null then
    raise exception 'confirmed certification not found';
  end if;

  eligible := activity.distance_m between 1000 and 100000
    and activity.moving_seconds between 600 and 86400
    and activity.pace_seconds_per_km between 180 and 3600
    and captured_at between activity.started_at - interval '2 hours'
                        and activity.ended_at + interval '4 hours';

  update public.hiking_activities
  set mountain_id = linked_mountain_id,
      certification_id = p_certification_id,
      ranking_eligible = eligible,
      ranking_opt_in = false
  where id = p_activity_id
  returning * into activity;

  return activity;
end;
$$;

create or replace function public.set_hiking_activity_ranking_opt_in(
  p_activity_id uuid,
  p_opt_in boolean
)
returns public.hiking_activities
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  activity public.hiking_activities%rowtype;
begin
  if uid is null then
    raise exception 'authentication required';
  end if;

  select current_activity.*
  into activity
  from public.hiking_activities current_activity
  where current_activity.id = p_activity_id
    and current_activity.user_id = uid
  for update;

  if activity.id is null then
    raise exception 'activity not found';
  end if;
  if p_opt_in and (not activity.ranking_eligible or activity.visibility = 'private') then
    raise exception 'eligible activity with friends or public visibility required';
  end if;

  update public.hiking_activities
  set ranking_opt_in = p_opt_in
  where id = p_activity_id
  returning * into activity;

  return activity;
end;
$$;

create or replace function public.get_mountain_pace_leaderboard(
  p_mountain_id uuid,
  p_scope text default 'friends'
)
returns table (
  rank bigint,
  activity_id uuid,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  pace_seconds_per_km numeric,
  moving_seconds integer,
  distance_m integer,
  started_at timestamptz
)
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'authentication required';
  end if;
  if p_scope not in ('friends', 'public') then
    raise exception 'invalid leaderboard scope';
  end if;

  return query
  with visible as (
    select distinct on (activity.user_id)
      activity.id,
      activity.user_id,
      profile.username,
      profile.display_name,
      profile.avatar_url,
      activity.pace_seconds_per_km,
      activity.moving_seconds,
      activity.distance_m,
      activity.started_at
    from public.hiking_activities activity
    join public.profiles profile on profile.id = activity.user_id
    where activity.mountain_id = p_mountain_id
      and activity.ranking_eligible
      and activity.ranking_opt_in
      and (
        (p_scope = 'public' and activity.visibility = 'public')
        or (
          p_scope = 'friends'
          and (
            activity.user_id = uid
            or (
              activity.visibility in ('friends', 'public')
              and public.is_mutual_follow(uid, activity.user_id)
            )
          )
        )
      )
    order by activity.user_id, activity.pace_seconds_per_km, activity.started_at
  ), ranked as (
    select
      row_number() over (order by visible.pace_seconds_per_km, visible.started_at) as position,
      visible.*
    from visible
  )
  select
    ranked.position,
    ranked.id,
    ranked.user_id,
    ranked.username,
    ranked.display_name,
    ranked.avatar_url,
    ranked.pace_seconds_per_km,
    ranked.moving_seconds,
    ranked.distance_m,
    ranked.started_at
  from ranked
  order by ranked.position
  limit 100;
end;
$$;

revoke all on function public.import_healthkit_activity(text, timestamptz, timestamptz, integer, integer, integer, text) from public;
revoke all on function public.attach_healthkit_activity_to_certification(uuid, uuid) from public;
revoke all on function public.set_hiking_activity_ranking_opt_in(uuid, boolean) from public;
revoke all on function public.get_mountain_pace_leaderboard(uuid, text) from public;

grant execute on function public.import_healthkit_activity(text, timestamptz, timestamptz, integer, integer, integer, text) to authenticated;
grant execute on function public.attach_healthkit_activity_to_certification(uuid, uuid) to authenticated;
grant execute on function public.set_hiking_activity_ranking_opt_in(uuid, boolean) to authenticated;
grant execute on function public.get_mountain_pace_leaderboard(uuid, text) to authenticated;

comment on function public.get_mountain_pace_leaderboard(uuid, text) is
  'Returns one best opted-in verified HealthKit pace per visible user. Raw routes and GPS are never exposed.';
