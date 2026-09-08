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
  partySize: number;
}

export function relationshipOf(sets: FollowSets, otherId: string): RelationshipState {
  const iFollow = sets.following.has(otherId);
  const followsMe = sets.followers.has(otherId);
  if (iFollow && followsMe) return 'mutual';
  if (iFollow) return 'following';
  if (followsMe) return 'follower';
  return 'none';
}
