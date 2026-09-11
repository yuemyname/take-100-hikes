# 100PEAKS — Master Product & Implementation Specification

> **This document is the single source of truth for the 100PEAKS project.**
> Claude, Codex, Cursor, ChatGPT, or any other coding agent MUST follow this file before making product, design, architecture, or implementation decisions.
> If another document or generated suggestion conflicts with this file, **this file wins**.

---

## Table of contents

- [0. Agent execution rules](#0-agent-execution-rules)
- [1. Product summary](#1-product-summary)
- [2. Visual direction](#2-visual-direction)
- [3. Navigation](#3-navigation)
- [4. Core screens](#4-core-screens)
- [5. Summit certification flow](#5-summit-certification-flow)
- [6. Shared certification — critical product feature](#6-shared-certification--critical-product-feature)
- [7. Friends & social relationship model](#7-friends--social-relationship-model)
- [8. Profile / MY](#8-profile--my)
- [9. Data model](#9-data-model)
- [10. Canonical business rules](#10-canonical-business-rules)
- [11. Recommended technical stack](#11-recommended-technical-stack)
- [12. Suggested project structure](#12-suggested-project-structure)
- [13. Shared reusable components](#13-shared-reusable-components)
- [14. Geographic verification](#14-geographic-verification)
- [15. Photo rules](#15-photo-rules)
- [16. Empty / loading / error states](#16-empty--loading--error-states)
- [17. Accessibility](#17-accessibility)
- [18. MVP scope](#18-mvp-scope)
- [19. Implementation order](#19-implementation-order)
- [20. Screen-level visual acceptance test](#20-screen-level-visual-acceptance-test)
- [21. Copy style guide](#21-copy-style-guide)
- [22. Product analytics events](#22-product-analytics-events)
- [23. Security / privacy requirements](#23-security--privacy-requirements)
- [24. Supabase RLS intention](#24-supabase-rls-intention)
- [25. Seed / demo data expectations](#25-seed--demo-data-expectations)
- [26. Definition of done for generated code](#26-definition-of-done-for-generated-code)
- [27. AI agent instruction block](#27-ai-agent-instruction-block)
- [28. Final product identity summary](#28-final-product-identity-summary)
- [29. Final canonical tagline candidates](#29-final-canonical-tagline-candidates)

---

# 0. Agent execution rules

## 0.1 Non-negotiable rules

1. Do not redesign the product from scratch.
2. Do not replace the visual direction with a generic green outdoor/fitness app UI.
3. Do not remove the social/shared-certification concept.
4. Do not simplify shared certification into “tagging friends after upload.” It is a real multi-user certification flow.
5. Do not copy Netflix branding, logos, typography, program title graphics, or exact copyrighted characters.
6. Use the supplied visual references only for **mood, color intensity, collage energy, playful monster direction, hand-drawn imperfection, and editorial composition**.
7. Product name is **100PEAKS**.
8. Primary language is Korean. Code identifiers are English.
9. Mobile-first. iOS-quality interaction is the reference standard.
10. When uncertain, choose the option that best preserves:
   - playful identity,
   - social hiking,
   - collectible 100-mountain progression,
   - simple MVP implementation.

## 0.2 Deterministic implementation behavior

When implementing a screen, follow this order:

1. Read this document fully.
2. Reuse the defined design tokens.
3. Reuse existing components before creating new ones.
4. Match the specified information hierarchy and content order.
5. Only then add small polish that does not change structure.

Do not invent new navigation tabs, primary flows, database entities, or authentication rules unless explicitly required by a blocking technical constraint.

## 0.3 Output quality bar

All UI should look intentional enough for a polished consumer app prototype, not a developer dashboard.

Required qualities:
- clear spacing rhythm,
- consistent radii and typography,
- strong visual hierarchy,
- playful but readable color usage,
- realistic Korean copy,
- empty/loading/error states,
- safe-area handling,
- touch targets >= 44pt,
- no placeholder lorem ipsum,
- no random gradients unless defined here.

---

# 1. Product summary

## 1.1 Product name

**100PEAKS**

Korean pronunciation / nickname: **백픽스**

## 1.2 Core concept

100PEAKS is a social mountain-collection app for completing Korea’s 100 famous mountains.

The core feeling is:

> **“왜 등산을 하는 건데?” → 그래도 친구랑 하나씩 모으다 보니 100개를 채우게 되는 앱**

This is not primarily a serious hiking utility app.
It is a **collecting + social memory + summit certification app**.

Think:
- mountain passport,
- creature collection,
- friends completing missions together,
- photo memories,
- playful outdoor editorial design.

## 1.3 Core value proposition

Users can:

- collect 100 famous mountains,
- verify summits with on-site photo + GPS,
- see who has completed each mountain,
- see mutual-follow friends first,
- complete one summit together with mutual-follow friends,
- collect unique mountain characters / badges,
- track progress toward 100 / 100.

## 1.4 Product personality

The product voice is:
- playful,
- slightly cheeky,
- warm,
- energetic,
- never overly motivational,
- never corporate,
- never hardcore mountaineering elitist.

Examples:

- “아직 63개나 남았는데?”
- “이번엔 어디 갈 건데?”
- “산은 왜 하는 건데? — 그냥 좋으니까.”
- “같이 오르니까 더 재밌잖아?”
- “100개의 산, 100개의 이야기.”

Avoid:
- “한계를 뛰어넘으세요”
- “당신의 피트니스 여정을 시작하세요”
- “정상을 정복하세요” as repetitive heroic copy.

---

# 2. Visual direction

## 2.1 Reference mood

The provided references communicate:

- very saturated primary colors,
- fuzzy / mascot-like characters,
- imperfect hand-made shapes,
- doodles,
- photo + illustration collage,
- outdoor mountain photography,
- playful editorial poster composition,
- deliberately imperfect hand-written typography,
- strong black text over cream / white space.

Use this emotional direction, but create an original visual identity.

## 2.2 Visual principle

**“Serious mountain photography + silly collectible characters.”**

The contrast is important.

Mountain photography should feel impressive and real.
Characters, stickers, copy, and UI reactions should feel light and playful.

## 2.3 Color system

Use the following canonical tokens.

```ts
export const colors = {
  background: '#FFF9ED',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F1EA',
  ink: '#111111',
  inkMuted: '#6E6B65',
  border: '#E7E2D8',

  blue: '#245BFF',
  red: '#FF3B30',
  yellow: '#FFD928',
  green: '#20C05C',
  pink: '#FF4FA3',
  orange: '#FF8A2B',

  success: '#20C05C',
  warning: '#FFB020',
  danger: '#FF3B30',
};
```

Rules:
- Background defaults to warm cream, not pure white.
- Black is the primary text color.
- Use saturated colors as accents, not as every screen background.
- Large CTA buttons may use blue, yellow, or black depending on context.
- Do not convert the app into “green = hiking” branding.

## 2.4 Typography

Use a readable Korean sans-serif for UI and an optional expressive display font only for decorative headers.

Preferred UI stack:
- Pretendard
- Apple SD Gothic Neo fallback
- system sans-serif fallback

Typography hierarchy:

```text
Display XL     40 / 46 / 800
Display L      32 / 38 / 800
Heading 1      26 / 32 / 800
Heading 2      22 / 28 / 750
Heading 3      18 / 24 / 700
Body           16 / 24 / 500
Body Small     14 / 20 / 500
Caption        12 / 16 / 500
Button         16 / 20 / 700
```

Use heavy black text for key numbers like `37 / 100`.

## 2.5 Shape language

Canonical radii:

```text
Small chip      10
Card            18
Large card      24
Bottom sheet    28 top radius
Pill            999
```

Cards should be clean and modern.
Playfulness comes from:
- stickers,
- doodle arrows,
- mascots,
- badges,
- speech bubbles,
- irregular decorative backgrounds.

Do NOT make every actual UI container irregular; readability wins.

## 2.6 Illustration / mascot system

100PEAKS should support a collectible character system.

Character direction:
- fuzzy monster / mountain creature,
- oversized simple silhouettes,
- strong solid colors,
- naive facial expression,
- unique regional or mountain detail,
- original designs only.

Example character mapping:
- 설악산: white fuzzy monster with icy blue face details
- 한라산: green body with volcanic orange/red details
- 북한산: gray rock-like compact monster
- 지리산: earthy brown/green monster with tree/forest motif

MVP does NOT require 100 finished characters.
Implement the system so characters can be progressively added.

---

# 3. Navigation

Use exactly 5 bottom tabs.

```text
1. 홈      Home
2. 명산    Mountains
3. 인증    Verify
4. 친구    Friends
5. MY      Profile
```

The center Verify tab is visually emphasized.

Recommended icon mapping:
- Home: house
- Mountains: mountain
- Verify: camera
- Friends: group / two people
- MY: person

Do not add extra primary tabs.

---

# 4. Core screens

## 4.1 Home

### Purpose

Immediately communicate progress and personality.

### Required hierarchy

1. 100PEAKS wordmark
2. Profile avatar
3. Progress number: `37 / 100`
4. Progress bar
5. Large mountain photography area
6. Mascot overlay + speech bubble
7. Main quote / playful copy
8. Four quick actions
9. Optional recent shared hike / friend activity section

### Canonical copy example

```text
37 / 100
아직 63개나 남았는데?

산은 왜 하는 건데?
— 그냥 좋으니까.
```

### Quick actions

```text
명산 도감
인증하기
친구
내 기록
```

### Acceptance criteria

- progress is visible without scrolling,
- photo + mascot composition is visually dominant,
- quick actions are one tap,
- screen does not look like a fitness dashboard.

---

## 4.2 Mountains / 100 Mountain Collection

### Header

```text
명산 도감
```

### Top filters

```text
전체
지역별
내 인증
미인증
```

### Search

Placeholder:

```text
산 이름을 검색해보세요
```

### Grid

Two-column card grid.

Each mountain card includes:
- rank / index,
- mountain image,
- small collectible character overlay,
- mountain name,
- altitude,
- region,
- verified indicator if completed.

Example:

```text
3. 설악산
1,708m
강원
```

### Completed state

- green check badge,
- character fully revealed.

### Incomplete state

- no check,
- character may appear partially hidden or silhouette.

### Acceptance criteria

- users can scan completion status quickly,
- sorting/filtering does not obscure the collectible feeling,
- mountain cards remain image-first.

---

## 4.3 Mountain Detail

Example: 설악산

### Header content

- hero mountain photography,
- mountain name,
- altitude,
- region,
- character overlay,
- favorite button.

### Tabs / segmented content

Use:

```text
소개
인증자 (1,284)
```

### Certification people ordering rule

**This rule is non-negotiable.**

When displaying certified users:

1. Mutual-follow friends (`mutual`) appear first.
2. Then all other certified users.
3. Within mutual friends: most recent certification first.
4. Within other users: most recent certification first.

### Section structure

```text
내 친구 인증자 3
[friend rows]

전체 인증자 1,284
[other user rows]
```

Friend row contains:
- avatar,
- display name,
- certification date,
- small photo thumbnail if available.

### Primary CTA

Bottom sticky button:

```text
이 산 인증하기
```

### Acceptance criteria

- mutual friends are visibly separated and always above strangers,
- social proof is obvious,
- user can start certification from this page in one tap.

---

# 5. Summit certification flow

## 5.1 Entry conditions

The certification flow uses:
- device GPS,
- summit target coordinates,
- timestamp,
- in-app camera photo,
- optional mutual friend co-certification.

MVP rule:
- certification is allowed only within the mountain’s configured radius.

Default radius:

```text
100 meters
```

But database must support per-mountain override.

Example:

```ts
verificationRadiusMeters: 100
```

## 5.2 Verification screen

Required UI:

1. mountain name
2. current location status
3. distance to summit
4. camera preview / capture
5. verification success banner when eligible
6. after capture, shared-certification friend selector

### GPS success example

```text
정상 반경 내에 있어요!
현재 거리 37m
```

### GPS fail example

```text
아직 인증 지점에서 238m 떨어져 있어요.
조금만 더 올라가볼까요?
```

### Required captured fields

```text
mountain_id
creator_user_id
photo_url
latitude
longitude
gps_accuracy_m
captured_at
verification_radius_m
```

---

# 6. Shared certification — critical product feature

This is one of the most important distinguishing features in 100PEAKS.

## 6.1 Product rule

A summit certification can belong to multiple users through one shared `certification_session`.

It is NOT copied into independent unrelated certification records.

One session represents:
- one summit visit,
- one shared photo,
- one mountain,
- one capture moment,
- one group of participants.

## 6.2 Eligible friends

Only **mutual-follow friends** may be selected for shared certification.

Definition of mutual:

```text
A follows B
AND
B follows A
```

No one-way follower can be selected.

## 6.3 Flow

### Step 1
Creator reaches summit and passes GPS eligibility.

### Step 2
Creator takes photo using the in-app camera.

### Step 3
Show:

```text
누구와 함께 왔나요?
맞팔 중인 친구만 선택할 수 있어요.
```

### Step 4
Creator selects 0–N mutual friends.

### Step 5
Create shared certification session.

### Step 6
Each invited friend sees request:

```text
@eun이 설악산 공동 인증을 요청했어요.
```

Actions:

```text
인증 참여
거절
```

### Step 7
For MVP, invited participants should also pass summit GPS proximity when accepting.

### Step 8
Session member becomes `confirmed` only after acceptance + eligibility.

### Step 9
Completion screen displays all confirmed participants.

## 6.4 Participant status model

Use:

```text
invited
confirmed
declined
expired
```

Creator starts as:

```text
confirmed
```

## 6.5 Shared session display

Example:

```text
설악산 · 2026.09.08

Eun     ✅
Jimin   ✅
Junho   ✅

함께 인증 완료!
```

## 6.6 Important anti-abuse MVP rule

Invited friend must satisfy:

```text
mutual friend
+ invitation exists
+ GPS within mountain verification radius
```

Do not allow remote confirmation from home in MVP.

---

# 7. Friends & social relationship model

## 7.1 Relationship

Support:

```text
followers
following
mutual
```

## 7.2 Mountain detail ordering

When a user opens a mountain:

```text
mutual friends certified
↓
other certified users
```

Never intermingle the two groups randomly.

## 7.3 Friend profile

Show:
- avatar,
- username,
- display name,
- follow state,
- completion count,
- mountain history.

Optional later metric:

```text
함께 오른 산 12
```

---

# 8. Profile / MY

Required hierarchy:

```text
Profile
37 / 100
```

Sections:
- certification progress,
- region progress,
- mountain history,
- shared hikes,
- collected characters / badges.

Example:

```text
서울·경기   12
강원        15
경상         7
전라         3
```

Optional fun stat:

```text
가장 많이 같이 오른 친구
Jimin · 12번
```

---

# 9. Data model

Use PostgreSQL / Supabase.

## 9.1 profiles

```sql
profiles
- id uuid pk references auth.users
- username text unique not null
- display_name text
- avatar_url text
- bio text
- created_at timestamptz default now()
```

## 9.2 mountains

```sql
mountains
- id uuid pk
- slug text unique not null
- name_ko text not null
- name_en text
- altitude_m integer
- region text
- latitude double precision not null
- longitude double precision not null
- verification_radius_m integer default 100
- image_url text
- mascot_key text
- description text
- display_order integer
- created_at timestamptz default now()
```

## 9.3 follows

```sql
follows
- follower_id uuid references profiles(id)
- following_id uuid references profiles(id)
- created_at timestamptz default now()

primary key (follower_id, following_id)
```

Mutual relation is derived. Do not store a separate boolean unless needed for query optimization.

## 9.4 certification_sessions

```sql
certification_sessions
- id uuid pk
- mountain_id uuid references mountains(id)
- creator_user_id uuid references profiles(id)
- photo_url text not null
- latitude double precision not null
- longitude double precision not null
- gps_accuracy_m double precision
- verification_radius_m integer not null
- captured_at timestamptz not null
- status text not null default 'active'
- created_at timestamptz default now()
```

Recommended session status:

```text
active
completed
cancelled
```

## 9.5 certification_members

```sql
certification_members
- certification_id uuid references certification_sessions(id)
- user_id uuid references profiles(id)
- invited_by uuid references profiles(id)
- status text not null
- acceptance_latitude double precision
- acceptance_longitude double precision
- acceptance_accuracy_m double precision
- confirmed_at timestamptz
- created_at timestamptz default now()

primary key (certification_id, user_id)
```

Status:

```text
invited
confirmed
declined
expired
```

## 9.6 favorites

```sql
favorites
- user_id uuid references profiles(id)
- mountain_id uuid references mountains(id)
- created_at timestamptz default now()

primary key (user_id, mountain_id)
```

---

# 10. Canonical business rules

1. A completed mountain for a user is derived from `certification_members.status = 'confirmed'`.
2. One user should count a mountain only once toward `X / 100`, even if they have multiple sessions for that mountain.
3. Shared certification uses one session with multiple members.
4. Only mutual friends can be invited.
5. Mutual friends appear before non-friends on mountain certification lists.
6. All participants must independently confirm participation.
7. For MVP, all confirmed participants must be inside the configured GPS radius.
8. Exact raw GPS should not be shown publicly.
9. Mountain completion progress is based on distinct mountain IDs.
10. Certification photo belongs to the session, not to each individual member.

---

# 11. Recommended technical stack

Use unless a blocking project constraint already exists.

```text
App: React Native
Framework: Expo
Language: TypeScript
Routing: Expo Router
Backend: Supabase
Database: PostgreSQL
Auth: Supabase Auth
Storage: Supabase Storage
Location: expo-location
Camera: expo-camera
State: React Query + local component state
Validation: Zod
```

Prefer Expo-managed libraries to keep iOS/mobile development simple.

---

# 12. Suggested project structure

```text
app/
  (tabs)/
    index.tsx
    mountains.tsx
    verify.tsx
    friends.tsx
    profile.tsx
  mountain/
    [id].tsx
  certification/
    capture.tsx
    invite.tsx
    review.tsx
    success.tsx
  user/
    [id].tsx

src/
  components/
    ui/
    mountains/
    certification/
    social/
    mascots/
  constants/
    colors.ts
    typography.ts
    spacing.ts
  features/
    auth/
    mountains/
    certifications/
    friends/
  hooks/
  lib/
    supabase.ts
    geo.ts
  queries/
  types/

supabase/
  migrations/
  seed.sql
```

---

# 13. Shared reusable components

Create and reuse these components before adding custom one-off UI.

```text
Screen
TopBar
BottomTabBar
PrimaryButton
SecondaryButton
Pill
Avatar
AvatarRow
ProgressCounter
MountainCard
MountainHero
MascotBadge
SpeechBubble
CertificationStatusBanner
FriendSelectRow
CertifiedUserRow
EmptyState
LoadingSkeleton
```

---

# 14. Geographic verification

Use Haversine distance.

Required utility:

```ts
function getDistanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number
```

Certification eligibility:

```ts
const eligible =
  distanceMeters <= mountain.verificationRadiusM &&
  locationPermissionGranted &&
  currentPositionAvailable;
```

Store GPS accuracy for later fraud / quality review.

Do not rely solely on client UI for final verification. Recalculate on the server / database function where feasible.

---

# 15. Photo rules

MVP:
- certification photo must be taken from the in-app camera flow,
- gallery upload should NOT be the primary certification method,
- store capture timestamp,
- store original upload separately from UI thumbnail transformation.

Future anti-fraud ideas are out of scope unless explicitly requested.

---

# 16. Empty / loading / error states

Every major screen needs state handling.

Examples:

### No mutual friends certified this mountain

```text
아직 이 산을 인증한 친구가 없어요.
먼저 다녀와서 자랑해볼까요?
```

### No mutual friends available for co-certification

```text
같이 인증할 맞팔 친구가 아직 없어요.
친구를 먼저 찾아보세요.
```

### GPS permission denied

```text
정상 인증을 위해 위치 권한이 필요해요.
설정에서 위치 권한을 허용해주세요.
```

### API / network error

```text
잠깐 연결이 끊겼어요.
다시 시도해주세요.
```

---

# 17. Accessibility

Required:
- color is not the only state indicator,
- support Dynamic Type reasonably,
- interactive controls >= 44pt,
- text contrast should remain readable,
- image-only controls have accessibility labels,
- status icons include text where important.

---

# 18. MVP scope

## Must ship

```text
[ ] Authentication
[ ] Profile
[ ] Follow / unfollow
[ ] Mutual friend derivation
[ ] 100 mountain dataset
[ ] Mountain collection grid
[ ] Mountain detail
[ ] Certified users list
[ ] Mutual friends prioritized above other certified users
[ ] GPS summit eligibility
[ ] In-app photo capture
[ ] Certification session creation
[ ] Invite mutual friends to shared certification
[ ] Friend accept / decline shared certification
[ ] Shared certification completion
[ ] 0–100 progress count
[ ] Basic collectible mascot / badge system
[ ] Profile certification history
```

## Explicitly NOT required for MVP

```text
[ ] DMs
[ ] public comment threads
[ ] complex social feed ranking
[ ] hiking route navigation
[ ] GPX tracking
[ ] live location sharing
[ ] ecommerce
[ ] premium subscription
[ ] 100 finished mascot illustrations
[ ] advanced fraud detection ML
```

---

# 19. Implementation order

Agents MUST follow this implementation order unless the user explicitly changes it.

### Phase 1 — Foundation

1. Expo + TypeScript project
2. design tokens
3. navigation
4. Supabase client
5. auth shell
6. base UI components

### Phase 2 — Mountains

1. mountains seed data
2. mountain grid
3. mountain detail
4. favorites
5. collectible completed/incomplete state

### Phase 3 — Social

1. profile
2. follows
3. mutual friend query
4. certified user list
5. mutual-first ordering

### Phase 4 — Certification

1. location permission
2. distance verification
3. camera
4. upload photo
5. create certification session
6. creator confirmation

### Phase 5 — Shared certification

1. mutual friend picker
2. invite participants
3. pending state
4. friend accept/decline
5. participant GPS verification
6. completion screen

### Phase 6 — Polish

1. mascot reveal animation
2. loading skeletons
3. empty states
4. haptics
5. micro-interactions
6. accessibility pass

### Phase 7 — Discovery and hiking activity extensions

User-approved post-MVP direction as of 2026-09-11. Detailed privacy, data, and ranking rules are in `docs/POST_MVP_DISCOVERY_ACTIVITY.md`.

1. mountain catalog list/map presentation
2. separate public mountain display/trailhead locations from certification points
3. nearby restaurant discovery through a server-side provider integration
4. private hiking activity records and visibility controls
5. read-only Apple HealthKit workout import on iOS
6. server-computed, opt-in pace ranking for eligible certified activities

These extensions do not relax GPS verification, mutual-friend shared-certification, collection, or privacy rules. HealthKit permission denial must not block certification, and exact verification points or raw workout routes must not appear in public UI.

---

# 20. Screen-level visual acceptance test

Before declaring a UI feature done, verify:

### Home
- Does it prominently show `X / 100`?
- Is there a real mountain-photo feeling?
- Is there at least one playful mascot / speech-bubble element?
- Does it avoid generic hiking-app green branding?

### Mountains
- Is completion scannable in < 2 seconds?
- Are cards image-forward?
- Does the mascot collection idea appear?

### Mountain detail
- Are mutual friends visibly above all other certified users?
- Is the “이 산 인증하기” CTA obvious?

### Certification
- Is GPS state unmistakable?
- Is camera capture central?
- Is co-certification offered after capture?

### Shared certification
- Are only mutual friends selectable?
- Does each participant have a visible status?
- Is it clear that one session is shared by multiple users?

---

# 21. Copy style guide

Preferred Korean style:
- 반말-like friendly UI copy is acceptable,
- concise,
- playful,
- not childish,
- avoid excessive emojis inside core UI.

Examples:

```text
아직 63개나 남았는데?
이번엔 어디 갈 건데?
같이 오르니까 더 재밌잖아?
정상 반경 안에 들어왔어요!
친구에게 인증 요청을 보냈어요.
이 산을 인증한 친구가 아직 없어요.
```

Buttons should remain clear and task-oriented:

```text
이 산 인증하기
사진 촬영
친구 선택
인증 요청하기
인증 참여
거절
완료
```

---

# 22. Product analytics events

Use stable event names.

```text
home_viewed
mountain_list_viewed
mountain_detail_viewed
verification_started
verification_location_passed
verification_photo_captured
shared_invite_opened
shared_friend_selected
shared_invite_sent
shared_invite_accepted
shared_invite_declined
certification_completed
mountain_collected
friend_followed
friend_unfollowed
```

---

# 23. Security / privacy requirements

- Never expose Supabase service-role keys in the client.
- Use RLS.
- Users can only mutate their own follow relationships.
- Only certification creator can invite participants.
- Only invited user can accept/decline their participant record.
- Exact raw location should not be publicly exposed in social lists.
- Public certification display may show mountain and date, not precise GPS coordinates.
- Photo access must respect storage policies.

---

# 24. Supabase RLS intention

Implementation should preserve these rules:

```text
profiles: readable by authenticated users; writable by owner
follows: readable by authenticated users; insert/delete by follower owner
mountains: readable by authenticated users; admin-managed
certification_sessions: readable for social product; create by authenticated creator
certification_members: readable for social product; creator may invite; invited user may update own status
favorites: owner-only mutation
```

If production privacy needs tighten later, preserve feature behavior while reducing exposed fields.

---

# 25. Seed / demo data expectations

Development build should include realistic demo content.

Minimum demo mountains:
- 설악산
- 한라산
- 북한산
- 지리산
- 덕유산
- 소백산

Minimum demo users:
- current user
- 3 mutual friends
- 5 non-mutual public users

At least one mountain detail should demonstrate:
- 3 mutual certified friends,
- > 10 total certified users,
- certification photo thumbnails.

This allows consistent visual output across AI coding agents.

---

# 26. Definition of done for generated code

A coding agent must not claim completion if:
- TypeScript has compile errors,
- navigation routes are broken,
- data mocks differ unpredictably across screens,
- mutual friend sorting is missing,
- shared certification is reduced to a cosmetic mock with no state model,
- design tokens are bypassed by random hard-coded colors,
- no loading/error state exists for async screens.

Minimum completion response should include:

```text
- implemented files
- schema/migration changes
- commands to run
- environment variables needed
- known limitations
- what to test manually
```

---

# 27. AI agent instruction block

Copy/paste this block to Claude, Codex, or another coding agent when starting work:

```text
You are implementing the 100PEAKS app.

Before writing code, read 100PEAKS_MASTER_SPEC.md completely.
Treat it as the single source of truth.
Do not redesign the product, navigation, social model, or shared certification flow.
Do not replace the visual language with generic fitness/outdoor UI.
Use the exact design tokens, data entities, information hierarchy, and business rules defined in the spec.

When a requirement is ambiguous:
1. preserve shared certification,
2. preserve mutual-friend prioritization,
3. preserve 100-mountain collectible progression,
4. preserve playful editorial visual identity,
5. choose the smallest MVP-compatible implementation.

Before coding, briefly state:
- the phase you are implementing,
- files you will touch,
- acceptance criteria from the spec.

After coding, report:
- what changed,
- schema changes,
- how to run/test,
- remaining limitations.

Do not silently invent new product requirements.
```

---

# 28. Final product identity summary

**100PEAKS is not:**
- a Strava clone,
- a hardcore route tracker,
- a green wellness dashboard,
- a generic photo check-in app.

**100PEAKS is:**
- a 100-mountain collection,
- a social summit memory book,
- a shared certification system,
- a playful character collection,
- a reason to keep asking friends: “이번엔 어디 갈 건데?”

---

# 29. Final canonical tagline candidates

Primary internal tagline:

> **100개의 산, 100개의 이야기.**

Secondary:

> **산이 불러. 우리 또 갈까?**

Social feature line:

> **같이 오르니까 더 재밌잖아?**

Use these as brand direction, not as mandatory legal product copy.

---

**END OF MASTER SPEC**
