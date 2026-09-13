-- Keep even hashed HealthKit workout identifiers owner-only. Visible activity
-- rows expose aggregates, but not the per-workout duplicate-detection hash.

revoke select on public.hiking_activities from authenticated;
grant select (
  id,
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
  ranking_opt_in,
  ranking_eligible,
  pace_seconds_per_km,
  created_at,
  updated_at
) on public.hiking_activities to authenticated;

create or replace function public.get_my_healthkit_workout_hashes()
returns table (source_workout_id_hash text)
language sql
security definer
set search_path = ''
stable
as $$
  select activity.source_workout_id_hash
  from public.hiking_activities activity
  where activity.user_id = auth.uid()
    and activity.source = 'healthkit'
    and activity.source_workout_id_hash is not null;
$$;

revoke all on function public.get_my_healthkit_workout_hashes() from public;
grant execute on function public.get_my_healthkit_workout_hashes() to authenticated;

comment on function public.get_my_healthkit_workout_hashes() is
  'Owner-only duplicate detection. Hashes are excluded from visible activity column grants.';
