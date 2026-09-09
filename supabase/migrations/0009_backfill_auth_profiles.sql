-- Ensure every Supabase Auth user has exactly one public profile.
-- Existing profiles are preserved; only missing rows are inserted.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
  fallback_username text;
  resolved_display_name text;
begin
  requested_username := lower(trim(coalesce(new.raw_user_meta_data ->> 'username', '')));
  fallback_username := 'u_' || substr(md5(new.id::text), 1, 18);
  resolved_display_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');

  if requested_username !~ '^[a-z0-9_]{3,20}$'
    or exists (
      select 1
      from public.profiles profile
      where profile.username = requested_username
        and profile.id <> new.id
    )
  then
    requested_username := fallback_username;
  end if;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    requested_username,
    coalesce(resolved_display_name, requested_username)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

with missing_users as (
  select
    auth_user.id,
    auth_user.created_at,
    lower(trim(coalesce(auth_user.raw_user_meta_data ->> 'username', ''))) as requested_username,
    nullif(trim(coalesce(auth_user.raw_user_meta_data ->> 'display_name', '')), '') as display_name
  from auth.users auth_user
  left join public.profiles profile on profile.id = auth_user.id
  where profile.id is null
),
ranked_users as (
  select
    missing_user.*,
    row_number() over (
      partition by missing_user.requested_username
      order by missing_user.created_at, missing_user.id
    ) as requested_username_rank
  from missing_users missing_user
),
resolved_profiles as (
  select
    ranked_user.id,
    case
      when ranked_user.requested_username ~ '^[a-z0-9_]{3,20}$'
        and ranked_user.requested_username_rank = 1
        and not exists (
          select 1
          from public.profiles existing_profile
          where existing_profile.username = ranked_user.requested_username
        )
      then ranked_user.requested_username
      else 'u_' || substr(md5(ranked_user.id::text), 1, 18)
    end as username,
    ranked_user.display_name
  from ranked_users ranked_user
)
insert into public.profiles (id, username, display_name)
select
  resolved_profile.id,
  resolved_profile.username,
  coalesce(resolved_profile.display_name, resolved_profile.username)
from resolved_profiles resolved_profile
on conflict do nothing;
