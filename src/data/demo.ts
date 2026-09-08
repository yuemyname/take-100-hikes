import type { CertificationMemberStatus, Profile } from '@/types';

/**
 * Demo state for guest / unconfigured builds — 100PEAKS_MASTER_SPEC.md §25.
 * Every screen must read from here so mock data never contradicts itself:
 * completions, certifier lists, follow state, and progress all derive from
 * the same sessions and follows below.
 */

export const DEMO_ME_ID = 'demo:me';

const p = (id: string, username: string, display_name: string, bio: string | null = null): Profile => ({
  id: `demo:${id}`,
  username,
  display_name,
  avatar_url: null,
  bio,
  created_at: '2026-01-10T09:00:00.000Z',
});

export const DEMO_PROFILES: Profile[] = [
  { ...p('me', 'guest', '게스트', '둘러보는 중이에요.'), id: DEMO_ME_ID },
  // 3 mutual friends (names match the UI concept)
  p('jimin', 'jimin_hike', '지민', '주말마다 산. 같이 갈 사람?'),
  p('junho', 'junho_zz', '준호', '정상에서 라면 먹는 게 취미'),
  p('soyeon', 'soyeon', '소연', '올해 목표 30개'),
  // public users: some follow me, some I follow, some unrelated
  p('hiking22', 'hiking22', '등산이십이'),
  p('mountainkim', 'mountainkim', '김산'),
  p('sunny', 'sunny', '써니'),
  p('haneul', 'haneul.h', '하늘'),
  p('taeyang', 'taeyang', '태양'),
  p('dahye', 'dahye_d', '다혜'),
  p('minsu', 'minsu.m', '민수'),
  p('yerin', 'yerin', '예린'),
  p('woojin', 'woojin_w', '우진'),
  p('boram', 'boram', '보람'),
  p('seojun', 'seojun', '서준'),
];

const id = (slug: string) => `demo:${slug}`;

/** follower → following. Mutual = both directions exist (spec §6.2). */
export const DEMO_FOLLOWS: { follower_id: string; following_id: string }[] = [
  // mutual
  { follower_id: DEMO_ME_ID, following_id: id('jimin') },
  { follower_id: id('jimin'), following_id: DEMO_ME_ID },
  { follower_id: DEMO_ME_ID, following_id: id('junho') },
  { follower_id: id('junho'), following_id: DEMO_ME_ID },
  { follower_id: DEMO_ME_ID, following_id: id('soyeon') },
  { follower_id: id('soyeon'), following_id: DEMO_ME_ID },
  // I follow, they don't follow back
  { follower_id: DEMO_ME_ID, following_id: id('hiking22') },
  { follower_id: DEMO_ME_ID, following_id: id('mountainkim') },
  // they follow me, I don't follow back
  { follower_id: id('sunny'), following_id: DEMO_ME_ID },
  { follower_id: id('haneul'), following_id: DEMO_ME_ID },
  // friends following each other
  { follower_id: id('jimin'), following_id: id('junho') },
  { follower_id: id('junho'), following_id: id('jimin') },
];

export interface DemoSession {
  id: string;
  mountainSlug: string;
  creatorId: string;
  capturedAt: string;
  photoUrl: string | null;
  members: { userId: string; status: CertificationMemberStatus }[];
}

/**
 * Certification sessions. One session can carry several confirmed members —
 * that is the shared certification model (spec §6.1), not per-user copies.
 */
export const DEMO_SESSIONS: DemoSession[] = [
  // 설악산: a shared session (me + 지민 + 준호), plus many solo certifiers → > 10 total
  {
    id: 'demo:s-seorak-shared',
    mountainSlug: 'seoraksan',
    creatorId: DEMO_ME_ID,
    capturedAt: '2026-08-13T05:42:00.000Z',
    photoUrl: null,
    members: [
      { userId: DEMO_ME_ID, status: 'confirmed' },
      { userId: id('jimin'), status: 'confirmed' },
      { userId: id('junho'), status: 'confirmed' },
    ],
  },
  { id: 'demo:s-seorak-soyeon', mountainSlug: 'seoraksan', creatorId: id('soyeon'), capturedAt: '2025-10-04T03:10:00.000Z', photoUrl: null, members: [{ userId: id('soyeon'), status: 'confirmed' }] },
  { id: 'demo:s-seorak-1', mountainSlug: 'seoraksan', creatorId: id('hiking22'), capturedAt: '2026-08-12T02:00:00.000Z', photoUrl: null, members: [{ userId: id('hiking22'), status: 'confirmed' }] },
  { id: 'demo:s-seorak-2', mountainSlug: 'seoraksan', creatorId: id('mountainkim'), capturedAt: '2026-08-11T01:30:00.000Z', photoUrl: null, members: [{ userId: id('mountainkim'), status: 'confirmed' }] },
  { id: 'demo:s-seorak-3', mountainSlug: 'seoraksan', creatorId: id('sunny'), capturedAt: '2026-08-10T04:20:00.000Z', photoUrl: null, members: [{ userId: id('sunny'), status: 'confirmed' }] },
  { id: 'demo:s-seorak-4', mountainSlug: 'seoraksan', creatorId: id('haneul'), capturedAt: '2026-07-28T00:50:00.000Z', photoUrl: null, members: [{ userId: id('haneul'), status: 'confirmed' }] },
  { id: 'demo:s-seorak-5', mountainSlug: 'seoraksan', creatorId: id('taeyang'), capturedAt: '2026-07-20T03:05:00.000Z', photoUrl: null, members: [{ userId: id('taeyang'), status: 'confirmed' }] },
  { id: 'demo:s-seorak-6', mountainSlug: 'seoraksan', creatorId: id('dahye'), capturedAt: '2026-06-15T02:40:00.000Z', photoUrl: null, members: [{ userId: id('dahye'), status: 'confirmed' }] },
  { id: 'demo:s-seorak-7', mountainSlug: 'seoraksan', creatorId: id('minsu'), capturedAt: '2026-05-30T01:15:00.000Z', photoUrl: null, members: [{ userId: id('minsu'), status: 'confirmed' }] },
  { id: 'demo:s-seorak-8', mountainSlug: 'seoraksan', creatorId: id('yerin'), capturedAt: '2026-05-02T05:00:00.000Z', photoUrl: null, members: [{ userId: id('yerin'), status: 'confirmed' }] },
  { id: 'demo:s-seorak-9', mountainSlug: 'seoraksan', creatorId: id('woojin'), capturedAt: '2026-04-19T02:25:00.000Z', photoUrl: null, members: [{ userId: id('woojin'), status: 'confirmed' }] },
  { id: 'demo:s-seorak-10', mountainSlug: 'seoraksan', creatorId: id('boram'), capturedAt: '2026-03-01T06:10:00.000Z', photoUrl: null, members: [{ userId: id('boram'), status: 'confirmed' }] },
  // an invited-but-declined member must NOT count as a certifier
  { id: 'demo:s-seorak-11', mountainSlug: 'seoraksan', creatorId: id('seojun'), capturedAt: '2026-02-11T04:00:00.000Z', photoUrl: null, members: [{ userId: id('seojun'), status: 'confirmed' }, { userId: id('boram'), status: 'declined' }] },

  // my other completions
  { id: 'demo:s-halla', mountainSlug: 'hallasan', creatorId: DEMO_ME_ID, capturedAt: '2026-05-05T00:30:00.000Z', photoUrl: null, members: [{ userId: DEMO_ME_ID, status: 'confirmed' }, { userId: id('soyeon'), status: 'confirmed' }] },
  { id: 'demo:s-jiri', mountainSlug: 'jirisan', creatorId: id('jimin'), capturedAt: '2026-03-22T21:50:00.000Z', photoUrl: null, members: [{ userId: id('jimin'), status: 'confirmed' }, { userId: DEMO_ME_ID, status: 'confirmed' }] },
  { id: 'demo:s-bukhan', mountainSlug: 'bukhansan', creatorId: DEMO_ME_ID, capturedAt: '2026-01-18T02:05:00.000Z', photoUrl: null, members: [{ userId: DEMO_ME_ID, status: 'confirmed' }] },
  // a pending invitation (Phase 5 will surface it); not a completion yet
  { id: 'demo:s-deogyu-pending', mountainSlug: 'deogyusan', creatorId: id('junho'), capturedAt: '2026-08-30T01:00:00.000Z', photoUrl: null, members: [{ userId: id('junho'), status: 'confirmed' }, { userId: DEMO_ME_ID, status: 'invited' }] },

  // friends' other mountains
  { id: 'demo:s-jimin-1', mountainSlug: 'deogyusan', creatorId: id('jimin'), capturedAt: '2026-02-02T03:00:00.000Z', photoUrl: null, members: [{ userId: id('jimin'), status: 'confirmed' }] },
  { id: 'demo:s-jimin-2', mountainSlug: 'sobaeksan', creatorId: id('jimin'), capturedAt: '2026-06-06T02:00:00.000Z', photoUrl: null, members: [{ userId: id('jimin'), status: 'confirmed' }] },
  { id: 'demo:s-jimin-3', mountainSlug: 'taebaeksan', creatorId: id('jimin'), capturedAt: '2026-01-02T00:00:00.000Z', photoUrl: null, members: [{ userId: id('jimin'), status: 'confirmed' }] },
  { id: 'demo:s-junho-1', mountainSlug: 'bukhansan', creatorId: id('junho'), capturedAt: '2026-07-07T01:00:00.000Z', photoUrl: null, members: [{ userId: id('junho'), status: 'confirmed' }] },
  { id: 'demo:s-soyeon-1', mountainSlug: 'gwanaksan', creatorId: id('soyeon'), capturedAt: '2026-08-01T00:00:00.000Z', photoUrl: null, members: [{ userId: id('soyeon'), status: 'confirmed' }] },
  { id: 'demo:s-soyeon-2', mountainSlug: 'dobongsan', creatorId: id('soyeon'), capturedAt: '2026-08-20T00:00:00.000Z', photoUrl: null, members: [{ userId: id('soyeon'), status: 'confirmed' }] },
  { id: 'demo:s-hiking22-1', mountainSlug: 'hallasan', creatorId: id('hiking22'), capturedAt: '2026-04-04T00:00:00.000Z', photoUrl: null, members: [{ userId: id('hiking22'), status: 'confirmed' }] },
];

/** Slugs the demo user has confirmed — derived from sessions, never hand-listed. */
export function getDemoCompletedSlugs(): string[] {
  return Array.from(
    new Set(
      DEMO_SESSIONS.filter((s) => s.members.some((m) => m.userId === DEMO_ME_ID && m.status === 'confirmed')).map(
        (s) => s.mountainSlug,
      ),
    ),
  );
}

/** Guest-mode certifications live in memory for the session (spec §25 demo build). */
export function addDemoSession(session: DemoSession): void {
  DEMO_SESSIONS.unshift(session);
}

export const DEMO_FAVORITE_SLUGS = ['deogyusan', 'sobaeksan'] as const;
