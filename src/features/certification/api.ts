import { addDemoSession, DEMO_ME_ID, DEMO_PROFILES, DEMO_SESSIONS, respondToDemoInvitation } from '@/data/demo';
import { LOCAL_MOUNTAINS } from '@/features/mountains/api';
import { fetchFollowSets } from '@/features/social/api';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { CertificationMember, CertificationMemberStatus, CertificationSession, Mountain, Profile } from '@/types';

import {
  effectiveMemberStatus,
  INVITATION_TTL_MS,
  isSessionSettled,
  type CaptureDraft,
  type CreatedCertification,
  type Invitation,
  type InvitationResponse,
  type SessionDetail,
} from './types';

export const PHOTO_BUCKET = 'certifications';

function randomId(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) crypto.getRandomValues(bytes);
  else for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Upload the in-app capture to Storage; returns the public URL (spec §15: original kept as-is). */
async function uploadPhoto(userId: string, sessionId: string, photoUri: string): Promise<string> {
  const supabase = getSupabase();
  const response = await fetch(photoUri);
  const body = await response.arrayBuffer();
  const path = `${userId}/${sessionId}.jpg`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, body, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Creates one certification_session with the creator as a confirmed member —
 * spec §6.1 (one session per summit visit), §6.4 (creator starts confirmed),
 * §5.2 (required captured fields). The database re-validates the radius.
 */
export async function createCertification(
  draft: CaptureDraft,
  userId: string | null,
  inviteeIds: string[] = [],
): Promise<CreatedCertification> {
  if (!isSupabaseConfigured || !userId) return createDemoCertification(draft, inviteeIds);

  const supabase = getSupabase();
  const sessionId = randomId();
  const photoUrl = await uploadPhoto(userId, sessionId, draft.photoUri);

  // Spec §6.2: only mutual-follow friends may be invited. RLS rechecks this.
  const sets = await fetchFollowSets(userId);
  const invitees = [...new Set(inviteeIds)].filter((id) => id !== userId && sets.mutual.has(id));
  if (invitees.length !== new Set(inviteeIds.filter((id) => id !== userId)).size) {
    throw new Error('맞팔 친구만 공동 인증에 초대할 수 있어요.');
  }

  const alreadyCollected = await hasCompleted(userId, draft.mountainId);

  const session: Omit<CertificationSession, 'created_at'> = {
    id: sessionId,
    mountain_id: draft.mountainId,
    creator_user_id: userId,
    photo_url: photoUrl,
    latitude: draft.latitude,
    longitude: draft.longitude,
    gps_accuracy_m: draft.gpsAccuracyM,
    verification_radius_m: draft.verificationRadiusM,
    captured_at: draft.capturedAt,
    status: invitees.length > 0 ? 'active' : 'completed',
  };
  const { error: sessionError } = await supabase.from('certification_sessions').insert(session);
  if (sessionError) throw sessionError;

  const member: Omit<CertificationMember, 'created_at'> = {
    certification_id: sessionId,
    user_id: userId,
    invited_by: null,
    status: 'confirmed',
    acceptance_latitude: draft.latitude,
    acceptance_longitude: draft.longitude,
    acceptance_accuracy_m: draft.gpsAccuracyM,
    confirmed_at: new Date().toISOString(),
  };
  const { error: memberError } = await supabase.from('certification_members').insert(member);
  if (memberError) throw memberError;

  if (invitees.length > 0) {
    const rows = invitees.map((id) => ({
      certification_id: sessionId,
      user_id: id,
      invited_by: userId,
      status: 'invited' as const,
    }));
    const { error: inviteError } = await supabase.from('certification_members').insert(rows);
    if (inviteError) throw inviteError;
  }

  return { sessionId, mountainId: draft.mountainId, photoUrl, capturedAt: draft.capturedAt, newlyCollected: !alreadyCollected, invitedCount: invitees.length };
}

async function hasCompleted(userId: string, mountainId: string): Promise<boolean> {
  const { data, error } = await getSupabase()
    .from('certification_members')
    .select('certification_id, certification_sessions!inner(mountain_id)')
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .eq('certification_sessions.mountain_id', mountainId)
    .limit(1);
  if (error) throw error;
  return (data ?? []).length > 0;
}

async function createDemoCertification(draft: CaptureDraft, inviteeIds: string[]): Promise<CreatedCertification> {
  const mountain = LOCAL_MOUNTAINS.find((m) => m.id === draft.mountainId);
  if (!mountain) throw new Error('도감에 없는 산이에요.');
  const sets = await fetchFollowSets(DEMO_ME_ID);
  const invitees = [...new Set(inviteeIds)].filter((id) => id !== DEMO_ME_ID && sets.mutual.has(id));
  const alreadyCollected = DEMO_SESSIONS.some(
    (s) => s.mountainSlug === mountain.slug && s.members.some((m) => m.userId === DEMO_ME_ID && m.status === 'confirmed'),
  );
  const sessionId = `demo:${randomId()}`;
  addDemoSession({
    id: sessionId,
    mountainSlug: mountain.slug,
    creatorId: DEMO_ME_ID,
    capturedAt: draft.capturedAt,
    photoUrl: draft.photoUri,
    members: [{ userId: DEMO_ME_ID, status: 'confirmed' }, ...invitees.map((id) => ({ userId: id, status: 'invited' as const }))],
  });
  return { sessionId, mountainId: draft.mountainId, photoUrl: draft.photoUri, capturedAt: draft.capturedAt, newlyCollected: !alreadyCollected, invitedCount: invitees.length };
}

// ---------------------------------------------------------------------------
// Session detail, invitations, responses — spec §6.3 steps 6–9
// ---------------------------------------------------------------------------

const demoProfile = (id: string): Profile | null => DEMO_PROFILES.find((p) => p.id === id) ?? null;
const demoMountain = (slug: string): Mountain | null => LOCAL_MOUNTAINS.find((m) => m.slug === slug) ?? null;

function demoSessionDetail(sessionId: string): SessionDetail | null {
  const s = DEMO_SESSIONS.find((x) => x.id === sessionId);
  if (!s) return null;
  const mountain = demoMountain(s.mountainSlug);
  const creator = demoProfile(s.creatorId);
  if (!mountain || !creator) return null;
  const members = s.members
    .map((m) => {
      const user = demoProfile(m.userId);
      if (!user) return null;
      return {
        user,
        status: effectiveMemberStatus(m.status, s.capturedAt),
        confirmedAt: m.status === 'confirmed' ? s.capturedAt : null,
        isCreator: m.userId === s.creatorId,
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);
  return {
    id: s.id,
    mountain,
    creator,
    photoUrl: s.photoUrl,
    capturedAt: s.capturedAt,
    status: isSessionSettled(members) ? 'completed' : 'active',
    members,
  };
}

interface SessionRow extends CertificationSession {
  mountains: Mountain | null;
  profiles: Profile | null;
}
interface MemberJoinRow extends CertificationMember {
  profiles: Profile | null;
}

export async function fetchSession(sessionId: string): Promise<SessionDetail | null> {
  if (!isSupabaseConfigured || sessionId.startsWith('demo:')) return demoSessionDetail(sessionId);

  const supabase = getSupabase();
  const { data: session, error } = await supabase
    .from('certification_sessions')
    .select('*, mountains(*), profiles!certification_sessions_creator_user_id_fkey(*)')
    .eq('id', sessionId)
    .maybeSingle();
  if (error) throw error;
  const row = session as unknown as SessionRow | null;
  if (!row || !row.mountains || !row.profiles) return null;

  const { data: members, error: membersError } = await supabase
    .from('certification_members')
    .select('*, profiles!certification_members_user_id_fkey(*)')
    .eq('certification_id', sessionId)
    .order('created_at', { ascending: true });
  if (membersError) throw membersError;

  const list = ((members ?? []) as unknown as MemberJoinRow[])
    .filter((m) => m.profiles)
    .map((m) => ({
      user: m.profiles as Profile,
      status: effectiveMemberStatus(m.status, row.captured_at),
      confirmedAt: m.confirmed_at,
      isCreator: m.user_id === row.creator_user_id,
    }));
  // Creator first, then by invitation order.
  list.sort((a, b) => Number(b.isCreator) - Number(a.isCreator));

  return {
    id: row.id,
    mountain: row.mountains,
    creator: row.profiles,
    photoUrl: row.photo_url,
    capturedAt: row.captured_at,
    status: row.status,
    members: list,
  };
}

/** Pending invitations for the viewer, newest first. Expired ones are dropped. */
export async function fetchMyInvitations(viewerId: string): Promise<Invitation[]> {
  const now = Date.now();
  if (!isSupabaseConfigured || viewerId.startsWith('demo:')) {
    return DEMO_SESSIONS.filter((s) => s.members.some((m) => m.userId === viewerId && m.status === 'invited'))
      .map((s) => {
        const mountain = demoMountain(s.mountainSlug);
        const creator = demoProfile(s.creatorId);
        if (!mountain || !creator) return null;
        const expiresAt = new Date(new Date(s.capturedAt).getTime() + INVITATION_TTL_MS).toISOString();
        return {
          sessionId: s.id,
          mountain,
          creator,
          capturedAt: s.capturedAt,
          expiresAt,
          confirmedCount: s.members.filter((m) => m.status === 'confirmed').length,
        };
      })
      .filter((i): i is Invitation => i !== null && new Date(i.expiresAt).getTime() > now)
      .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
  }

  const { data, error } = await getSupabase()
    .from('certification_members')
    .select('certification_id, certification_sessions!inner(id, captured_at, creator_user_id, mountains(*), profiles!certification_sessions_creator_user_id_fkey(*))')
    .eq('user_id', viewerId)
    .eq('status', 'invited');
  if (error) throw error;

  const rows = (data ?? []) as unknown as {
    certification_id: string;
    certification_sessions: { id: string; captured_at: string; mountains: Mountain | null; profiles: Profile | null } | null;
  }[];
  const sessionIds = rows.map((r) => r.certification_id);
  const counts = await fetchConfirmedCounts(sessionIds);

  return rows
    .map((r) => {
      const s = r.certification_sessions;
      if (!s || !s.mountains || !s.profiles) return null;
      const expiresAt = new Date(new Date(s.captured_at).getTime() + INVITATION_TTL_MS).toISOString();
      return {
        sessionId: s.id,
        mountain: s.mountains,
        creator: s.profiles,
        capturedAt: s.captured_at,
        expiresAt,
        confirmedCount: counts.get(s.id) ?? 1,
      };
    })
    .filter((i): i is Invitation => i !== null && new Date(i.expiresAt).getTime() > now)
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
}

async function fetchConfirmedCounts(sessionIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (sessionIds.length === 0) return map;
  const { data, error } = await getSupabase()
    .from('certification_members')
    .select('certification_id')
    .eq('status', 'confirmed')
    .in('certification_id', sessionIds);
  if (error) throw error;
  for (const r of (data ?? []) as { certification_id: string }[]) map.set(r.certification_id, (map.get(r.certification_id) ?? 0) + 1);
  return map;
}

/**
 * Accept or decline an invitation — spec §6.3 steps 7–8, §6.6. Accepting
 * records the participant's own summit position; the database trigger
 * rejects positions outside the mountain's radius.
 */
export async function respondToInvitation(response: InvitationResponse, viewerId: string): Promise<SessionDetail> {
  const nextStatus: CertificationMemberStatus = response.accept ? 'confirmed' : 'declined';
  if (response.accept && !response.position) throw new Error('정상 위치를 확인한 뒤 참여할 수 있어요.');

  if (!isSupabaseConfigured || response.sessionId.startsWith('demo:')) {
    const detail = demoSessionDetail(response.sessionId);
    if (!detail) throw new Error('요청을 찾을 수 없어요.');
    const me = detail.members.find((m) => m.user.id === viewerId);
    if (!me || me.status !== 'invited') throw new Error('이미 처리됐거나 만료된 요청이에요.');
    if (response.accept && response.position) {
      const { getDistanceMeters } = await import('@/lib/geo');
      const d = getDistanceMeters(response.position, detail.mountain);
      if (d > detail.mountain.verification_radius_m + Math.min(response.position.accuracyM ?? 0, 50)) {
        throw new Error(`아직 인증 지점에서 ${Math.round(d)}m 떨어져 있어요.`);
      }
    }
    respondToDemoInvitation(response.sessionId, viewerId, nextStatus);
    const updated = demoSessionDetail(response.sessionId);
    if (!updated) throw new Error('요청을 찾을 수 없어요.');
    return updated;
  }

  const patch: Partial<CertificationMember> = { status: nextStatus };
  if (response.accept && response.position) {
    patch.acceptance_latitude = response.position.latitude;
    patch.acceptance_longitude = response.position.longitude;
    patch.acceptance_accuracy_m = response.position.accuracyM;
    patch.confirmed_at = new Date().toISOString();
  }
  const { error } = await getSupabase()
    .from('certification_members')
    .update(patch)
    .eq('certification_id', response.sessionId)
    .eq('user_id', viewerId)
    .eq('status', 'invited');
  if (error) throw error;

  const detail = await fetchSession(response.sessionId);
  if (!detail) throw new Error('요청을 찾을 수 없어요.');
  return detail;
}

/** Mutual friends available for invitation — spec §6.2. */
export async function fetchInvitableFriends(viewerId: string): Promise<Profile[]> {
  const sets = await fetchFollowSets(viewerId);
  const ids = [...sets.mutual];
  if (ids.length === 0) return [];
  if (!isSupabaseConfigured || viewerId.startsWith('demo:')) {
    return ids.map(demoProfile).filter((p): p is Profile => p !== null);
  }
  const { data, error } = await getSupabase().from('profiles').select('*').in('id', ids);
  if (error) throw error;
  return (data ?? []) as Profile[];
}
