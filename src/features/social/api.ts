import { DEMO_FOLLOWS, DEMO_ME_ID, DEMO_PROFILES, DEMO_SESSIONS } from '@/data/demo';
import { LOCAL_MOUNTAINS } from '@/features/mountains/api';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Profile } from '@/types';

import type { CertifiedUser, CertifiedUsers, CompletedMountain, FollowSets, ProfileStats } from './types';

const remote = () => isSupabaseConfigured;

/** In demo mode the viewer is always the demo user. */
export const resolveViewerId = (userId: string | null): string => (remote() && userId ? userId : DEMO_ME_ID);

// ---------------------------------------------------------------------------
// Demo helpers
// ---------------------------------------------------------------------------

const demoMountainId = (slug: string) => LOCAL_MOUNTAINS.find((m) => m.slug === slug)?.id ?? `local:${slug}`;
const demoProfile = (id: string) => DEMO_PROFILES.find((p) => p.id === id) ?? null;

/** Follows the demo user has changed during this session (in-memory only). */
const demoFollowOverrides = new Map<string, boolean>();

function demoFollowSets(viewerId: string): FollowSets {
  const following = new Set(DEMO_FOLLOWS.filter((f) => f.follower_id === viewerId).map((f) => f.following_id));
  const followers = new Set(DEMO_FOLLOWS.filter((f) => f.following_id === viewerId).map((f) => f.follower_id));
  if (viewerId === DEMO_ME_ID) {
    for (const [target, on] of demoFollowOverrides) {
      if (on) following.add(target);
      else following.delete(target);
    }
  }
  const mutual = new Set([...following].filter((id) => followers.has(id)));
  return { following, followers, mutual };
}

function demoCompletedMountains(userId: string): CompletedMountain[] {
  const byMountain = new Map<string, CompletedMountain>();
  for (const s of DEMO_SESSIONS) {
    const me = s.members.find((m) => m.userId === userId && m.status === 'confirmed');
    if (!me) continue;
    const mountainId = demoMountainId(s.mountainSlug);
    const existing = byMountain.get(mountainId);
    if (!existing || existing.certifiedAt < s.capturedAt) {
      byMountain.set(mountainId, {
        mountainId,
        certifiedAt: s.capturedAt,
        sessionId: s.id,
        partySize: s.members.filter((m) => m.status === 'confirmed').length,
      });
    }
  }
  return [...byMountain.values()].sort((a, b) => b.certifiedAt.localeCompare(a.certifiedAt));
}

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------

export async function fetchProfile(id: string): Promise<Profile | null> {
  if (!remote() || id.startsWith('demo:')) return demoProfile(id);
  const { data, error } = await getSupabase().from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export async function searchProfiles(term: string, viewerId: string): Promise<Profile[]> {
  const q = term.trim().toLowerCase();
  if (!q) return [];
  if (!remote()) {
    return DEMO_PROFILES.filter(
      (p) => p.id !== viewerId && (p.username.includes(q) || (p.display_name ?? '').toLowerCase().includes(q)),
    ).slice(0, 20);
  }
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('*')
    .neq('id', viewerId)
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function fetchProfilesByIds(ids: string[]): Promise<Profile[]> {
  if (ids.length === 0) return [];
  if (!remote()) return ids.map(demoProfile).filter((p): p is Profile => p !== null);
  const { data, error } = await getSupabase().from('profiles').select('*').in('id', ids);
  if (error) throw error;
  return (data ?? []) as Profile[];
}

// ---------------------------------------------------------------------------
// Follows
// ---------------------------------------------------------------------------

export async function fetchFollowSets(viewerId: string): Promise<FollowSets> {
  if (!remote()) return demoFollowSets(viewerId);
  const supabase = getSupabase();
  const [followingRes, followersRes] = await Promise.all([
    supabase.from('follows').select('following_id').eq('follower_id', viewerId),
    supabase.from('follows').select('follower_id').eq('following_id', viewerId),
  ]);
  if (followingRes.error) throw followingRes.error;
  if (followersRes.error) throw followersRes.error;
  const following = new Set(((followingRes.data ?? []) as { following_id: string }[]).map((r) => r.following_id));
  const followers = new Set(((followersRes.data ?? []) as { follower_id: string }[]).map((r) => r.follower_id));
  const mutual = new Set([...following].filter((id) => followers.has(id)));
  return { following, followers, mutual };
}

/** Users can only mutate their own follow rows (spec §23); RLS enforces it too. */
export async function setFollow(viewerId: string, targetId: string, follow: boolean): Promise<void> {
  if (viewerId === targetId) throw new Error('자기 자신은 팔로우할 수 없어요.');
  if (!remote()) {
    demoFollowOverrides.set(targetId, follow);
    return;
  }
  const supabase = getSupabase();
  if (follow) {
    const { error } = await supabase.from('follows').upsert({ follower_id: viewerId, following_id: targetId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('follows').delete().eq('follower_id', viewerId).eq('following_id', targetId);
    if (error) throw error;
  }
}

// ---------------------------------------------------------------------------
// Certifications (read side)
// ---------------------------------------------------------------------------

interface MemberRow {
  user_id: string;
  certification_sessions: { id: string; mountain_id: string; captured_at: string; photo_url: string | null } | null;
  profiles: Profile | null;
}

function partition(list: CertifiedUser[], mutual: Set<string>, viewerId: string): CertifiedUsers {
  // Spec §4.3: mutual friends first, then others; each group most-recent first.
  const byTime = (a: CertifiedUser, b: CertifiedUser) => b.certifiedAt.localeCompare(a.certifiedAt);
  const mutualList = list.filter((c) => mutual.has(c.user.id)).sort(byTime);
  const others = list.filter((c) => !mutual.has(c.user.id) && c.user.id !== viewerId).sort(byTime);
  const me = list.filter((c) => c.user.id === viewerId);
  return { mutual: mutualList, others: [...me, ...others], total: list.length };
}

/** Every confirmed certifier of a mountain, one entry per user (latest capture). */
export async function fetchCertifiedUsers(mountainId: string, viewerId: string): Promise<CertifiedUsers> {
  const sets = await fetchFollowSets(viewerId);

  if (!remote() || mountainId.startsWith('local:')) {
    const slug = LOCAL_MOUNTAINS.find((m) => m.id === mountainId)?.slug;
    const byUser = new Map<string, CertifiedUser>();
    for (const s of DEMO_SESSIONS) {
      if (s.mountainSlug !== slug) continue;
      const partySize = s.members.filter((m) => m.status === 'confirmed').length;
      for (const m of s.members) {
        if (m.status !== 'confirmed') continue;
        const user = demoProfile(m.userId);
        if (!user) continue;
        const existing = byUser.get(user.id);
        if (!existing || existing.certifiedAt < s.capturedAt) {
          byUser.set(user.id, { user, certifiedAt: s.capturedAt, sessionId: s.id, photoUrl: s.photoUrl, partySize });
        }
      }
    }
    return partition([...byUser.values()], sets.mutual, viewerId);
  }

  const { data, error } = await getSupabase()
    .from('certification_members')
    .select(
      'user_id, certification_sessions!inner(id, mountain_id, captured_at, photo_url), profiles!certification_members_user_id_fkey(*)',
    )
    .eq('status', 'confirmed')
    .eq('certification_sessions.mountain_id', mountainId);
  if (error) throw error;

  const rows = (data ?? []) as unknown as MemberRow[];
  const sessionIds = [...new Set(rows.map((r) => r.certification_sessions?.id).filter((v): v is string => !!v))];
  const partySizes = await fetchPartySizes(sessionIds);

  const byUser = new Map<string, CertifiedUser>();
  for (const r of rows) {
    const s = r.certification_sessions;
    if (!s || !r.profiles) continue;
    const existing = byUser.get(r.user_id);
    if (!existing || existing.certifiedAt < s.captured_at) {
      byUser.set(r.user_id, {
        user: r.profiles,
        certifiedAt: s.captured_at,
        sessionId: s.id,
        photoUrl: s.photo_url,
        partySize: partySizes.get(s.id) ?? 1,
      });
    }
  }
  return partition([...byUser.values()], sets.mutual, viewerId);
}

async function fetchPartySizes(sessionIds: string[]): Promise<Map<string, number>> {
  const sizes = new Map<string, number>();
  if (sessionIds.length === 0) return sizes;
  const { data, error } = await getSupabase()
    .from('certification_members')
    .select('certification_id')
    .eq('status', 'confirmed')
    .in('certification_id', sessionIds);
  if (error) throw error;
  for (const r of (data ?? []) as { certification_id: string }[]) {
    sizes.set(r.certification_id, (sizes.get(r.certification_id) ?? 0) + 1);
  }
  return sizes;
}

/** Distinct completed mountains for a user, latest first (spec §10.1, §10.9). */
export async function fetchCompletedMountains(userId: string): Promise<CompletedMountain[]> {
  if (!remote() || userId.startsWith('demo:')) return demoCompletedMountains(userId);

  const { data, error } = await getSupabase()
    .from('certification_members')
    .select('certification_sessions!inner(id, mountain_id, captured_at)')
    .eq('user_id', userId)
    .eq('status', 'confirmed');
  if (error) throw error;

  const rows = (data ?? []) as unknown as { certification_sessions: { id: string; mountain_id: string; captured_at: string } | null }[];
  const sessionIds = rows.map((r) => r.certification_sessions?.id).filter((v): v is string => !!v);
  const partySizes = await fetchPartySizes(sessionIds);

  const byMountain = new Map<string, CompletedMountain>();
  for (const r of rows) {
    const s = r.certification_sessions;
    if (!s) continue;
    const existing = byMountain.get(s.mountain_id);
    if (!existing || existing.certifiedAt < s.captured_at) {
      byMountain.set(s.mountain_id, {
        mountainId: s.mountain_id,
        certifiedAt: s.captured_at,
        sessionId: s.id,
        partySize: partySizes.get(s.id) ?? 1,
      });
    }
  }
  return [...byMountain.values()].sort((a, b) => b.certifiedAt.localeCompare(a.certifiedAt));
}

export async function fetchProfileStats(userId: string): Promise<ProfileStats> {
  const [completed, sets] = await Promise.all([fetchCompletedMountains(userId), fetchFollowSets(userId)]);
  return { completedCount: completed.length, followerCount: sets.followers.size, followingCount: sets.following.size };
}
