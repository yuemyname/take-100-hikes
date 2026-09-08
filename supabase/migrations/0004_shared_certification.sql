-- 100PEAKS shared certification — 100PEAKS_MASTER_SPEC.md §6.

-- ---------------------------------------------------------------------------
-- Session status follows its members: 'active' while anyone is still invited,
-- 'completed' once every invitation is answered. Runs as definer because only
-- the creator may update sessions directly (spec §23).
-- ---------------------------------------------------------------------------
create or replace function public.sync_session_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pending integer;
begin
  select count(*) into pending
  from public.certification_members
  where certification_id = new.certification_id and status = 'invited';

  update public.certification_sessions
  set status = case when pending = 0 then 'completed' else 'active' end
  where id = new.certification_id and status <> 'cancelled';

  return new;
end;
$$;

drop trigger if exists certification_members_sync_session on public.certification_members;
create trigger certification_members_sync_session
  after insert or update of status on public.certification_members
  for each row execute function public.sync_session_status();

-- ---------------------------------------------------------------------------
-- Invited members may only move to confirmed or declined, and only within
-- 24 hours of the capture (UI: 최대 24시간). Anything later becomes expired.
-- ---------------------------------------------------------------------------
create or replace function public.guard_member_transition()
returns trigger
language plpgsql
as $$
declare
  captured timestamptz;
begin
  if old.status <> 'invited' then
    raise exception 'invitation already answered';
  end if;
  if new.status not in ('confirmed', 'declined', 'expired') then
    raise exception 'invalid member status transition';
  end if;
  select captured_at into captured from public.certification_sessions where id = new.certification_id;
  if new.status in ('confirmed', 'declined') and now() > captured + interval '24 hours' then
    new.status := 'expired';
  end if;
  return new;
end;
$$;

drop trigger if exists certification_members_guard_transition on public.certification_members;
create trigger certification_members_guard_transition
  before update of status on public.certification_members
  for each row execute function public.guard_member_transition();

-- Housekeeping for a scheduled job (pg_cron or an edge function): expire stale invitations.
create or replace function public.expire_stale_invitations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  changed integer;
begin
  update public.certification_members m
  set status = 'expired'
  from public.certification_sessions s
  where m.certification_id = s.id
    and m.status = 'invited'
    and now() > s.captured_at + interval '24 hours';
  get diagnostics changed = row_count;
  return changed;
end;
$$;

create index if not exists certification_members_invited_idx
  on public.certification_members (user_id) where status = 'invited';
