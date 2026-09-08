-- 100PEAKS certification — 100PEAKS_MASTER_SPEC.md §5, §14, §15, §23.

-- ---------------------------------------------------------------------------
-- Photo storage: one public bucket, users may only write under their own id.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('certifications', 'certifications', true, 10485760, array['image/jpeg', 'image/png', 'image/heic'])
on conflict (id) do nothing;

create policy "certifications_photos_public_read" on storage.objects
  for select to public using (bucket_id = 'certifications');

create policy "certifications_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'certifications' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "certifications_photos_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'certifications' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- Server-side recheck of the summit radius (spec §14: never trust the client).
-- ---------------------------------------------------------------------------
create or replace function public.distance_meters(lat1 double precision, lng1 double precision, lat2 double precision, lng2 double precision)
returns double precision
language sql
immutable
as $$
  select 2 * 6371000 * asin(least(1, sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  )));
$$;

-- Sessions: the creator's capture must be inside the mountain's radius.
-- A tolerance equal to the reported GPS accuracy (capped at 50 m) is allowed.
create or replace function public.check_session_within_radius()
returns trigger
language plpgsql
as $$
declare
  m public.mountains%rowtype;
  d double precision;
begin
  select * into m from public.mountains where id = new.mountain_id;
  if not found then
    raise exception 'unknown mountain';
  end if;
  new.verification_radius_m := coalesce(m.verification_radius_m, 100);
  d := public.distance_meters(new.latitude, new.longitude, m.latitude, m.longitude);
  if d > new.verification_radius_m + least(coalesce(new.gps_accuracy_m, 0), 50) then
    raise exception 'outside verification radius: % m', round(d);
  end if;
  return new;
end;
$$;

drop trigger if exists certification_sessions_radius_check on public.certification_sessions;
create trigger certification_sessions_radius_check
  before insert on public.certification_sessions
  for each row execute function public.check_session_within_radius();

-- Members: a confirmed participant must also be inside the radius (spec §6.6).
create or replace function public.check_member_within_radius()
returns trigger
language plpgsql
as $$
declare
  s public.certification_sessions%rowtype;
  m public.mountains%rowtype;
  d double precision;
begin
  if new.status <> 'confirmed' then
    return new;
  end if;
  if new.acceptance_latitude is null or new.acceptance_longitude is null then
    raise exception 'confirmed members must report their summit position';
  end if;
  select * into s from public.certification_sessions where id = new.certification_id;
  select * into m from public.mountains where id = s.mountain_id;
  d := public.distance_meters(new.acceptance_latitude, new.acceptance_longitude, m.latitude, m.longitude);
  if d > s.verification_radius_m + least(coalesce(new.acceptance_accuracy_m, 0), 50) then
    raise exception 'outside verification radius: % m', round(d);
  end if;
  if new.confirmed_at is null then
    new.confirmed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists certification_members_radius_check on public.certification_members;
create trigger certification_members_radius_check
  before insert or update of status on public.certification_members
  for each row execute function public.check_member_within_radius();
