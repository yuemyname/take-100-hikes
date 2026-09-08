# 100PEAKS (백픽스)

한국 100대 명산을 친구와 함께 하나씩 모으는 소셜 수집 앱입니다.

> "산은 왜 하는 건데? — 그냥 좋으니까."

정상에서 앱 내 카메라 + GPS로 인증하고, 맞팔 친구와 하나의 인증 세션을 공유하고, 산마다 다른 캐릭터를 모으며 `X / 100`을 채워 갑니다.

## 현재 상태

- **Phase 1 — Foundation 완료.** Expo + TypeScript 프로젝트, 디자인 토큰, 5탭 내비게이션, Supabase 클라이언트, 인증 셸(로그인 / 가입), 기본 UI 컴포넌트, 초기 DB 마이그레이션.
- **Phase 2 — Mountains 완료.** 100대 명산 시드 데이터(`src/data/mountains.json` → `supabase/seed.sql`), 명산 도감 그리드(필터·검색·수집 상태), 산 상세(히어로·마스코트·즐겨찾기·소개/인증자 탭·인증 CTA), 홈·MY의 진행도 연동, 산별 SVG 마스코트 시스템.
- **Phase 3 — Social 완료.** 프로필(팔로워·팔로잉·산 수, 산 기록, 모은 캐릭터), 팔로우/언팔로우, 맞팔 계산, 친구 탭(맞팔·팔로잉·팔로워·검색), 산 상세 인증자 목록(맞팔 친구가 항상 위, 각 그룹 최신순, 공동 인증 "N명 함께" 표시).
- 인증 플로우(GPS·카메라)와 공동 인증 초대는 아직 셸입니다. 다음 단계는 마스터 스펙 19장의 **Phase 4 — Certification**입니다.
- 이전에 있던 레거시 프로젝트(MountainBot)는 모두 제거되었습니다.

## 시작하기

```bash
npm install
cp .env.example .env   # Supabase URL과 anon key 입력
npm start              # Expo 개발 서버 (i: iOS 시뮬레이터, a: Android, w: 웹)
```

검증 명령:

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # expo lint
```

Supabase 스키마는 `supabase/migrations/0001_init.sql`을 프로젝트 SQL 편집기에서 실행하거나 `supabase db push`로 적용하고, 이어서 `supabase/seed.sql`로 100대 명산을 넣습니다. 시드 SQL은 `node scripts/generate-seed.js`로 `src/data/mountains.json`에서 다시 만들 수 있습니다.

산 사진은 `mountains.image_url`에 URL을 넣으면 바로 표시됩니다(권장: Supabase Storage 공개 버킷 `mountains/{slug}.jpg`). URL이 없으면 어두운 산 실루엣 플레이스홀더가 나옵니다.
`.env`가 없으면 로그인 화면에 안내가 뜨고, 개발 빌드에서는 "설정 없이 둘러보기"로 탭 화면을 볼 수 있습니다.

## 프로젝트 구조

```text
app/                 Expo Router 라우트
  _layout.tsx        Provider + 인증 게이트 (Stack.Protected)
  (auth)/            sign-in, sign-up
  (tabs)/            index(홈), mountains, verify, friends, profile
  mountain/[id].tsx  산 상세 (소개 / 인증자)
  user/[id].tsx      친구 프로필
src/
  constants/         colors, typography, spacing, radii (스펙 §2 토큰)
  components/ui/     Screen, TopBar, BottomTabBar, Wordmark, Mascot(SVG), MountainPhoto, MountainCard, ...
  data/              mountains.json(100대 명산), mascots.ts(산별 캐릭터 룩), demo.ts(게스트 모드 데모 상태)
  features/auth/     AuthProvider, zod 스키마, 에러 문구
  features/mountains/ Supabase/로컬 데이터 접근, React Query 훅, 필터 로직
  features/social/   프로필·팔로우·맞팔·인증자 목록 (맞팔 우선 정렬은 api.ts의 partition)
  components/social/ ProfileBody(MY·친구 공용), CertifiedUsersSection
  lib/               supabase 클라이언트, geo(Haversine), env, fonts, queryClient
  types/             DB row 타입 (스펙 §9)
supabase/migrations/ 0001_init.sql (테이블, RLS, 프로필 트리거), 0002_social.sql (맞팔·완료 수 함수)
supabase/seed.sql    100대 명산 시드 (scripts/generate-seed.js로 생성)
docs/references/     비주얼 레퍼런스 3장 + 매니페스트
```

## 문서 안내

| 파일 | 대상 | 내용 |
| --- | --- | --- |
| `100PEAKS_MASTER_SPEC.md` | 사람 + 코딩 에이전트 | 제품 · 디자인 · 데이터 모델 · 구현 순서의 **단일 기준 문서**. 모든 결정은 이 문서를 따릅니다. |
| `AGENTS.md` | 코딩 에이전트 공통 | Claude Code, Codex, Cursor 등 모든 에이전트가 따르는 작업 규칙 (변경 절차, 검증, 완료 기준). |
| `CLAUDE.md` | Claude Code | `AGENTS.md`를 불러오는 얇은 진입점. 규칙은 `AGENTS.md`에만 둡니다. |
| `docs/references/` | 사람 + 코딩 에이전트 | 비주얼 레퍼런스 이미지 3장과 매니페스트. UI 작업 전 반드시 확인. |
| `README.md` | 사람 | 이 문서. 프로젝트 개요와 문서 지도. |

문서 간 우선순위: `100PEAKS_MASTER_SPEC.md` > `AGENTS.md` = `CLAUDE.md` > 그 외.

## 절대 바꾸지 않는 것

- 하단 탭은 정확히 5개: 홈 / 명산 / 인증 / 친구 / MY
- 산 상세의 인증자 목록은 **맞팔 친구가 항상 먼저**
- 공동 인증은 하나의 `certification_session`을 여러 사용자가 공유하는 실제 상태 모델 (업로드 후 태그가 아님)
- 공동 인증 초대는 맞팔 친구만, MVP에서는 참여자 각자 정상 GPS 반경 통과 필요
- 크림 배경 + 채도 높은 원색의 장난기 있는 비주얼 (일반적인 등산 앱의 초록 브랜딩 금지)
- 100개 산 수집 진행도와 캐릭터 / 배지 시스템

자세한 규칙은 마스터 스펙 0장, 10장, 26장을 참고하세요.

## 캐릭터(마스코트) 시스템

- 공식 캐릭터 아트워크는 `assets/mascots/`의 PNG 7종(guide, seoraksan, hallasan, bukhansan, jirisan, deogyusan, sobaeksan)입니다. 이 파일이 디자인 그 자체이며 코드에서 재해석하지 않습니다.
- 렌더링 순서: 공식 PNG → `Mascot` 컴포넌트(`src/components/ui/Mascot.tsx`) → UI. 이미지는 정사각 박스에 `contentFit="contain"`으로 원본 비율을 유지하고 잘라내지 않습니다.
- 잠금(미인증) 상태는 같은 PNG를 단색으로 틴트한 실루엣 + 물음표 배지로만 표현합니다. 캐릭터 정체성은 바뀌지 않습니다.
- 공식 아트가 없는 산(93개)은 도감·상세·프로필에서 공통 잠금 플레이스홀더(guide 실루엣 + 물음표, "캐릭터 준비 중")를 씁니다. 새 캐릭터를 자동 생성하지 않습니다. `Mascot.tsx`의 procedural SVG는 `image`가 없는 룩에서만 도는 임시 fallback이며 현재 화면에서는 사용되지 않습니다.
- 크기 기준(`OFFICIAL_ART.boxFor(visible)`): 홈 가이드 약 200pt, 도감 카드 약 100pt, 산 상세 약 170pt, 프로필 60~80pt. PNG는 가로 72%가 캐릭터이고 아래 17%가 여백이라 이 비율로 박스를 계산합니다.
- 새 공식 캐릭터 추가: PNG를 `assets/mascots/<mascot_key>.png`로 넣고 `src/data/mascots.ts`의 `CURATED`에 `image: require(...)` 항목을 추가하면 됩니다.

## 예정 기술 스택

React Native · Expo · TypeScript · Expo Router · Supabase (PostgreSQL / Auth / Storage) · expo-location · expo-camera · TanStack React Query · Zod

## 구현 순서

| Phase | 범위 |
| --- | --- |
| 1. Foundation | Expo + TS 프로젝트, 디자인 토큰, 5탭 내비게이션, Supabase 클라이언트, 인증 셸, 기본 UI 컴포넌트 |
| 2. Mountains | 명산 시드 데이터, 도감 그리드, 산 상세, 즐겨찾기, 수집 완료 / 미완료 상태 |
| 3. Social | 프로필, 팔로우, 맞팔 쿼리, 인증자 목록, 맞팔 우선 정렬 |
| 4. Certification | 위치 권한, 거리 검증, 카메라, 사진 업로드, 인증 세션 생성, 생성자 확정 |
| 5. Shared certification | 맞팔 친구 선택, 초대, 대기 상태, 수락 / 거절, 참여자 GPS 검증, 완료 화면 |
| 6. Polish | 마스코트 등장 애니메이션, 스켈레톤, 빈 상태, 햅틱, 마이크로 인터랙션, 접근성 |

## 알려진 공백

- `.gitignore`, 패키지 설정 등 프로젝트 파일은 Phase 1에서 새로 만듭니다.
