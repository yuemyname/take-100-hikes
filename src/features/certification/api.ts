import { addDemoSession, DEMO_ME_ID, DEMO_SESSIONS } from '@/data/demo';
import { LOCAL_MOUNTAINS } from '@/features/mountains/api';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { CertificationMember, CertificationSession } from '@/types';

import type { CaptureDraft, CreatedCertification } from './types';

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
export async function createCertification(draft: CaptureDraft, userId: string | null): Promise<CreatedCertification> {
  if (!isSupabaseConfigured || !userId) return createDemoCertification(draft);

  const supabase = getSupabase();
  const sessionId = randomId();
  const photoUrl = await uploadPhoto(userId, sessionId, draft.photoUri);

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
    status: 'completed',
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

  return { sessionId, mountainId: draft.mountainId, photoUrl, capturedAt: draft.capturedAt, newlyCollected: !alreadyCollected };
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

function createDemoCertification(draft: CaptureDraft): CreatedCertification {
  const mountain = LOCAL_MOUNTAINS.find((m) => m.id === draft.mountainId);
  if (!mountain) throw new Error('도감에 없는 산이에요.');
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
    members: [{ userId: DEMO_ME_ID, status: 'confirmed' }],
  });
  return { sessionId, mountainId: draft.mountainId, photoUrl: draft.photoUri, capturedAt: draft.capturedAt, newlyCollected: !alreadyCollected };
}
