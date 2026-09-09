import type { Profile, RelationshipState } from '@/types';

/** A confirmed certifier on a mountain — spec §4.3 row content. */
export interface CertifiedUser {
  user: Profile;
  /** Session capture time; ordering key within each group. */
  certifiedAt: string;
  sessionId: string;
  photoUrl: string | null;
  /** Number of confirmed members on that session (> 1 means shared). */
  partySize: number;
}

/** Mutual friends first, then everyone else — both most-recent first. */
export interface CertifiedUsers {
  mutual: CertifiedUser[];
  others: CertifiedUser[];
  total: number;
}

export interface FollowSets {
  following: Set<string>;
  followers: Set<string>;
  mutual: Set<string>;
}

export interface ProfileStats {
  completedCount: number;
  followerCount: number;
  followingCount: number;
}

export interface CompletedMountain {
  mountainId: string;
  /** Latest confirmed capture for this mountain. */
  certifiedAt: string;
  sessionId: string;
  photoUrl: string | null;
  partySize: number;
}

/** One confirmed visit to a mountain. Repeated visits stay separate here. */
export interface MountainCertificationRecord {
  certifiedAt: string;
  sessionId: string;
  photoUrl: string | null;
  partySize: number;
}

export interface ProfileMediaSelection {
  uri: string;
  mimeType: string | null;
}

export interface UpdateProfileInput {
  username: string;
  displayName: string;
  bio: string;
  /** undefined keeps the current value, null removes it, and a selection uploads it. */
  avatar?: ProfileMediaSelection | null;
  /** Personal home hero background with the same update semantics as avatar. */
  homeBackground?: ProfileMediaSelection | null;
}

export function relationshipOf(sets: FollowSets, otherId: string): RelationshipState {
  const iFollow = sets.following.has(otherId);
  const followsMe = sets.followers.has(otherId);
  if (iFollow && followsMe) return 'mutual';
  if (iFollow) return 'following';
  if (followsMe) return 'follower';
  return 'none';
}
