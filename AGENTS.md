# Agent instructions for 100PEAKS

This repository implements **100PEAKS** (백픽스), a social collectible app for completing Korea's famous mountain challenges.

These instructions apply to every coding agent (Claude Code, Codex, Cursor, ChatGPT, ...).
`CLAUDE.md` imports this file, so keep all shared agent rules here and do not duplicate them elsewhere.

## 1. Single source of truth

Read `100PEAKS_MASTER_SPEC.md` completely before making any product, UI, database, architecture, or implementation decision.
Also read `docs/OFFICIAL_VISUAL_DIRECTION.md` before any UI or asset work. For the newer character/art-direction decisions in that document, it overrides older mascot-collection language in the master spec until the master spec is fully normalized.
Also read `docs/COLLECTIONS.md` before mountain-list, progress, onboarding, profile, or certification-count work. The multi-collection rules there override older language that assumes one canonical 100-mountain list.

The master spec remains the single source of truth for product behavior, navigation, social rules, shared certification, implementation phases, and acceptance criteria except where the newer visual/collection decision documents explicitly override older assumptions.

## 2. Non-negotiable product rules

- Product name: `100PEAKS`. Primary UI language: Korean. Code identifiers: English.
- Exactly 5 bottom tabs: 홈 / 명산 / 인증 / 친구 / MY. Do not add or remove primary tabs.
- Mutual-follow friends must appear before all other certified users on mountain detail lists.
- Shared certification is one real multi-user `certification_session` with members. It is never post-upload friend tagging.
- Only mutual-follow friends may be invited to shared certification.
- For MVP, each confirmed participant must independently pass summit GPS proximity.
- The collectible object is **mountain certifications / challenge progress**, not characters.
- 100PEAKS supports at least two challenge collections: `forest_service_100` (산림청 100대 명산) and `bac_100` (BAC 명산100 기준).
- Users may change their primary collection at any time. Switching must never delete, reset, or duplicate certification records.
- A single confirmed summit record may count toward every collection containing that mountain when the relevant verification rule is satisfied.
- Never create separate duplicate certification sessions just because one mountain belongs to multiple collections.
- Mountain identity, collection membership, and GPS verification point are separate concepts. Follow `docs/COLLECTIONS.md`.
- For BAC data, read `docs/data/BAC100_DATA_POLICY.md` and `docs/data/bac100-candidates.csv`. Never invent or approximate pending verification-point coordinates.
- The official recurring brand cast is the four color families in `assets/official/` whose filenames contain `Take a Hike_Character`: YELLOW, RED, BLUE, PINK. Their multiple numbered files are pose/variant artwork of the same four-character cast.
- Do **not** assign one unique character to each mountain and do not create a 100-character collection system.
- `assets/mascots/` must be preserved. It is an experimental/supporting character library for possible future reuse, easter eggs, seasonal content, empty states, etc. Do not delete it and do not treat it as the primary official cast.
- `assets/official/stickers/` contains stable ASCII aliases of the uploaded situational graphics. Use these selectively as collage/sticker accents appropriate to the screen state.
- Do not imply an official BLACKYAK/BAC partnership or copy BAC logos/brand visuals without permission.
- Do not redesign the product from scratch.
- Do not replace the playful cream + saturated primary-color system with generic hiking / fitness green.
- Do not copy Netflix logos, typography, title art, or exact characters from reference material.
- Use the design tokens and canonical business rules from the master spec.
- Do not silently invent new primary flows, database entities, authentication rules, or product requirements.

## 3. Mandatory visual references and priority

Before implementing or redesigning any UI, inspect every image asset under `docs/references/` and the official art under `assets/official/`.

Visual priority for screen implementation:

1. `docs/references/D5F2733C-13FD-40B4-96CC-EF3ABDBAF3DF.png` — the original 100PEAKS UI concept and closest visual target.
2. Official character and situational artwork in `assets/official/`.
3. `docs/references/1C1533A7-D129-4597-B41C-9F9983F83CBF.png` and `A45AED2C-06DC-4043-BEFB-8B813368A94D.png` — mood references only.
4. Written visual rules in `docs/OFFICIAL_VISUAL_DIRECTION.md` and the master spec.

The concept should be reproduced as closely as practical in hierarchy, spacing, photo dominance, cream background, saturated accents, large character overlap, sticker/doodle composition, and strong black typography. Avoid generic rounded-card fitness-app layouts when the concept uses a more editorial composition.

Official character artwork is the design. Do not redraw it as procedural SVG, change body proportions, recolor it, or create mountain-specific replacements.

## 4. Technical defaults

Unless blocked by an existing repository constraint, use:

- React Native + Expo
- TypeScript (strict)
- Expo Router
- Supabase (PostgreSQL, Auth, Storage)
- expo-location
- expo-camera
- TanStack React Query
- Zod

Keep secrets (including the Supabase service-role key) out of client code and out of the repository.

## 5. Change protocol

Before editing code, state briefly:

1. which implementation phase from the master spec (section 19) you are working on,
2. which files you intend to modify,
3. which acceptance criteria you will satisfy.

If the current repository structure conflicts with the master spec, prefer the smallest migration path that preserves working code.
Prefer small, coherent changes over broad rewrites.

## 6. Coding rules

- Reuse the shared components in spec section 13 before creating one-off UI.
- Keep TypeScript strict and compiling.
- Use realistic Korean UI copy. No lorem ipsum.
- Implement loading, empty, and error states for every async screen.
- Keep touch targets >= 44pt and handle safe areas.
- Avoid hard-coded colors when a design token exists, except for transparent overlays where no token is appropriate.
- Keep exact GPS coordinates private from public social UI.
- For official raster art use `expo-image` with `contentFit="contain"` unless a documented composition explicitly requires otherwise.

## 7. Required validation

Before declaring work complete:

- run the TypeScript / build checks available in the repository,
- verify navigation routes touched by the change,
- verify async loading / error / empty states where applicable,
- verify shared-certification state is a real state model, not cosmetic,
- verify mutual-first sorting where applicable,
- verify no service-role key or secret was committed,
- verify no UI reintroduced a mountain-specific mascot collection,
- verify challenge switching does not mutate or reset certification records,
- verify progress is derived from collection membership rather than duplicated summit data,
- compare touched screens against the original UI concept image.

## 8. Definition of done

Do not claim a feature is complete if:

- TypeScript has compile errors,
- navigation is broken,
- the shared certification state model is missing,
- mutual-friend prioritization is missing where required,
- mock data contradicts across screens,
- design tokens are bypassed by random hard-coded colors,
- required loading / error states are missing,
- official characters were replaced by generated mountain-specific mascots,
- changing the primary collection loses existing summit history,
- pending BAC coordinates are activated as if verified.

After coding, report:

- files changed,
- schema or migration changes,
- commands to run,
- environment variables required,
- manual tests to perform,
- known limitations.

## 9. Default starting behavior

If the user simply says "start", "implement it", or gives no narrower task, inspect the repository against the master spec plus `docs/OFFICIAL_VISUAL_DIRECTION.md` and `docs/COLLECTIONS.md`, preserve completed functional phases, and work on the highest-impact incomplete or visually divergent item. Do not restart working product flows just to produce screenshots.
