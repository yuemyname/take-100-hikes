-- 100PEAKS social notifications: in-app history, Expo push tokens, and
-- server-side delivery for new-follow / mutual-follow events.
-- No certification, collection, mountain, or GPS data is changed here.

create extension if not exists pg_net;

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint push_tokens_platform_check check (platform in ('ios', 'android')),
  constraint push_tokens_token_not_blank_check check (length(trim(expo_push_token)) > 0)
);

create index if not exists push_tokens_user_idx on public.push_tokens (user_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_type_check check (type in ('new_follower', 'mutual_follow'))
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

alter table public.push_tokens enable row level security;
alter table public.notifications enable row level security;

revoke insert, update on public.push_tokens from anon, authenticated;
grant select, delete on public.push_tokens to authenticated;

revoke insert, delete, update on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

drop policy if exists "push_tokens_select_owner" on public.push_tokens;
create policy "push_tokens_select_owner" on public.push_tokens
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "push_tokens_delete_owner" on public.push_tokens;
create policy "push_tokens_delete_owner" on public.push_tokens
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "notifications_select_recipient" on public.notifications;
create policy "notifications_select_recipient" on public.notifications
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "notifications_update_recipient" on public.notifications;
create policy "notifications_update_recipient" on public.notifications
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- A token may move to another signed-in user on the same device. The client
-- cannot write arbitrary token rows; this RPC always binds it to auth.uid().
create or replace function public.register_push_token(push_token text, device_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if length(trim(coalesce(push_token, ''))) = 0 then
    raise exception 'push token is required';
  end if;
  if device_platform not in ('ios', 'android') then
    raise exception 'unsupported push platform';
  end if;

  insert into public.push_tokens (user_id, expo_push_token, platform)
  values (auth.uid(), trim(push_token), device_platform)
  on conflict (expo_push_token) do update set
    user_id = excluded.user_id,
    platform = excluded.platform,
    updated_at = now();
end;
$$;

revoke all on function public.register_push_token(text, text) from public;
grant execute on function public.register_push_token(text, text) to authenticated;

-- A follow creates exactly one recipient notification. If the reverse follow
-- already exists, the event is presented as the moment the mutual friendship
-- was completed instead of producing a second duplicate alert.
create or replace function public.create_follow_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_name text;
  notification_type text;
begin
  select coalesce(nullif(trim(profile.display_name), ''), profile.username)
  into actor_name
  from public.profiles profile
  where profile.id = new.follower_id;

  if exists (
    select 1
    from public.follows reverse_follow
    where reverse_follow.follower_id = new.following_id
      and reverse_follow.following_id = new.follower_id
  ) then
    notification_type := 'mutual_follow';
  else
    notification_type := 'new_follower';
  end if;

  insert into public.notifications (user_id, actor_id, type, title, body, data)
  values (
    new.following_id,
    new.follower_id,
    notification_type,
    case
      when notification_type = 'mutual_follow' then '새 맞팔 친구 🏔️'
      else '새 팔로워가 생겼어요'
    end,
    case
      when notification_type = 'mutual_follow'
        then coalesce(actor_name, '친구') || '님과 맞팔 친구가 됐어요.'
      else coalesce(actor_name, '누군가') || '님이 회원님을 팔로우했어요.'
    end,
    jsonb_build_object(
      'url', '/user/' || new.follower_id::text,
      'actorId', new.follower_id::text,
      'type', notification_type
    )
  );

  return new;
end;
$$;

drop trigger if exists follows_create_notification on public.follows;
create trigger follows_create_notification
  after insert on public.follows
  for each row execute function public.create_follow_notification();

-- Expo Push Service currently accepts authenticated or unauthenticated HTTPS
-- requests. pg_net sends asynchronously after commit, so follow writes are not
-- blocked by APNs/Expo network latency.
create or replace function public.send_notification_push()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  token_row record;
  unread_count integer;
begin
  select count(*)::integer
  into unread_count
  from public.notifications notification
  where notification.user_id = new.user_id
    and notification.read_at is null;

  for token_row in
    select token.expo_push_token
    from public.push_tokens token
    where token.user_id = new.user_id
  loop
    perform net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object(
        'Accept', 'application/json',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'to', token_row.expo_push_token,
        'title', new.title,
        'body', new.body,
        'sound', 'default',
        'badge', unread_count,
        'channelId', 'social',
        'priority', 'high',
        'data', new.data || jsonb_build_object('notificationId', new.id::text)
      ),
      timeout_milliseconds := 5000
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists notifications_send_push on public.notifications;
create trigger notifications_send_push
  after insert on public.notifications
  for each row execute function public.send_notification_push();

comment on table public.notifications is
  'Recipient-owned social notification history. Inserted only by trusted database triggers.';
comment on table public.push_tokens is
  'Expo push tokens registered through register_push_token(auth.uid()).';
