import type { CertificationMemberStatus, CertificationSessionStatus, Mountain, Profile } from '@/types';

export type LocationPermission = 'undetermined' | 'granted' | 'denied';

export interface SummitProximity {
  permission: LocationPermission;
  /** Current device position, once available. */
  position: { latitude: number; longitude: number; accuracyM: number | null } | null;
  distanceMeters: number | null;
  /** Client-side eligibility — spec §14. The server rechecks on insert. */
  eligible: boolean;
  isLocating: boolean;
  error: string | null;
  requestPermission: () => Promise<void>;
  refresh: () => Promise<void>;
}

/** Everything captured at the summit — spec §5.2 required fields. */
export interface CaptureDraft {
  mountainId: string;
  photoUri: string;
  latitude: number;
  longitude: number;
  gpsAccuracyM: number | null;
  capturedAt: string;
  verificationRadiusM: number;
  distanceMeters: number;
}

export interface CreatedCertification {
  sessionId: string;
  mountainId: string;
  photoUrl: string;
  capturedAt: string;
  /** True the first time this user completes this mountain (spec §10.2). */
  newlyCollected: boolean;
  /** Number of mutual friends invited to the session. */
  invitedCount: number;
}


/** Invitations expire 24 hours after the capture (UI concept: 최대 24시간). */
export const INVITATION_TTL_MS = 24 * 60 * 60 * 1000;

export interface SessionMember {
  user: Profile;
  status: CertificationMemberStatus;
  confirmedAt: string | null;
  isCreator: boolean;
}

/** One shared summit visit with everyone attached to it — spec §6.1, §6.5. */
export interface SessionDetail {
  id: string;
  mountain: Mountain;
  creator: Profile;
  photoUrl: string | null;
  capturedAt: string;
  status: CertificationSessionStatus;
  members: SessionMember[];
}

/** A pending request addressed to the viewer — spec §6.3 step 6. */
export interface Invitation {
  sessionId: string;
  mountain: Mountain;
  creator: Profile;
  capturedAt: string;
  expiresAt: string;
  confirmedCount: number;
}

export interface InvitationResponse {
  sessionId: string;
  accept: boolean;
  /** Required when accepting — spec §6.6 participant GPS proximity. */
  position?: { latitude: number; longitude: number; accuracyM: number | null };
}

/** Status after applying the 24h rule to what the database says. */
export function effectiveMemberStatus(status: CertificationMemberStatus, capturedAt: string, now = Date.now()): CertificationMemberStatus {
  if (status === 'invited' && now - new Date(capturedAt).getTime() > INVITATION_TTL_MS) return 'expired';
  return status;
}

/** Session is done when nobody is still invited (creator is always confirmed). */
export function isSessionSettled(members: { status: CertificationMemberStatus }[]): boolean {
  return members.every((m) => m.status !== 'invited');
}
