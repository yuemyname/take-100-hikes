-- Send one in-app and Expo push notification for each real shared
-- certification invitation. Existing unexpired invitations are backfilled so
-- the feature starts in a consistent state.

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type in ('new_follower', 'mutual_follow', 'certification_invite'));

create unique index if not exists notifications_certification_invite_unique
  on public.notifications (user_id, ((data ->> 'sessionId')))
  where type = 'certification_invite';

create or replace function public.create_certification_invite_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_name text;
  mountain_name text;
begin
  if new.status <> 'invited' or new.invited_by is null then
    return new;
  end if;

  select coalesce(nullif(trim(profile.display_name), ''), profile.username)
  into actor_name
  from public.profiles profile
  where profile.id = new.invited_by;

  select mountain.name_ko
  into mountain_name
  from public.certification_sessions session
  join public.mountains mountain on mountain.id = session.mountain_id
  where session.id = new.certification_id;

  insert into public.notifications (user_id, actor_id, type, title, body, data)
  values (
    new.user_id,
    new.invited_by,
    'certification_invite',
    '공동 인증 요청 🏔️',
    coalesce(actor_name, '친구') || '님이 ' || coalesce(mountain_name, '산') || ' 공동 인증을 요청했어요.',
    jsonb_build_object(
      'url', '/certification/join?sessionId=' || new.certification_id::text,
      'actorId', new.invited_by::text,
      'sessionId', new.certification_id::text,
      'type', 'certification_invite'
    )
  )
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists certification_members_create_invite_notification
  on public.certification_members;
create trigger certification_members_create_invite_notification
  after insert on public.certification_members
  for each row
  when (new.status = 'invited')
  execute function public.create_certification_invite_notification();

-- Backfill only invitations that can still be answered. The partial unique
-- index prevents a duplicate if this migration is replayed.
insert into public.notifications (user_id, actor_id, type, title, body, data)
select
  member.user_id,
  member.invited_by,
  'certification_invite',
  '공동 인증 요청 🏔️',
  coalesce(nullif(trim(inviter.display_name), ''), inviter.username, '친구')
    || '님이 ' || mountain.name_ko || ' 공동 인증을 요청했어요.',
  jsonb_build_object(
    'url', '/certification/join?sessionId=' || member.certification_id::text,
    'actorId', member.invited_by::text,
    'sessionId', member.certification_id::text,
    'type', 'certification_invite'
  )
from public.certification_members member
join public.certification_sessions session on session.id = member.certification_id
join public.mountains mountain on mountain.id = session.mountain_id
left join public.profiles inviter on inviter.id = member.invited_by
where member.status = 'invited'
  and member.invited_by is not null
  and now() <= session.captured_at + interval '24 hours'
on conflict do nothing;

comment on function public.create_certification_invite_notification() is
  'Creates one recipient-owned notification for each shared certification invitation.';
