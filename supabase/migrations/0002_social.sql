-- 100PEAKS social helpers — 100PEAKS_MASTER_SPEC.md §7, §10.5.

-- Mutual friends of a user: A follows B and B follows A. Runs with the
-- caller's RLS (follows are readable by authenticated users).
create or replace function public.mutual_friend_ids(uid uuid)
returns setof uuid
language sql
stable
as $$
  select f1.following_id
  from public.follows f1
  join public.follows f2
    on f2.follower_id = f1.following_id
   and f2.following_id = f1.follower_id
  where f1.follower_id = uid;
$$;

-- Distinct completed mountain count per user (spec §10.2: one count per mountain).
create or replace function public.completed_mountain_count(uid uuid)
returns integer
language sql
stable
as $$
  select count(distinct s.mountain_id)::integer
  from public.certification_members m
  join public.certification_sessions s on s.id = m.certification_id
  where m.user_id = uid and m.status = 'confirmed';
$$;

create index if not exists follows_follower_following_idx on public.follows (follower_id, following_id);
