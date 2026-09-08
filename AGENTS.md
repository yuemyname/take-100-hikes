# Agent instructions for 100PEAKS

This repository implements **100PEAKS** (백픽스), a social collectible app for completing Korea's 100 famous mountains.

These instructions apply to every coding agent (Claude Code, Codex, Cursor, ChatGPT, ...).
`CLAUDE.md` imports this file, so keep all shared agent rules here and do not duplicate them elsewhere.

## 1. Single source of truth

<<<<<<< HEAD
Read `100PEAKS_MASTER_SPEC.md` completely before making any product, UI, database, architecture, or implementation decision.

The master spec is the single source of truth for:
=======
Treat it as the repository's single source of truth for product behavior, visual direction, navigation, data model, social rules, shared certification, implementation phases, and acceptance criteria.
>>>>>>> origin/main

## Mandatory visual references

<<<<<<< HEAD
If this file, prior chat context, generated code, or your own preference conflicts with the master spec, **the master spec wins**. Preserve working code where possible, but make product decisions according to the spec.
=======
Before implementing or changing UI, inspect every image under `docs/references/`.

Expected files:
- `visual-reference-01.jpg` — original mood/color/character reference
- `visual-reference-02.jpg` — original mood/color/editorial reference
- `100peaks-ui-concept.png` — generated 100PEAKS target UI concept

The original references define mood only: saturated primary colors, fuzzy/naive mascot energy, hand-made imperfection, doodles, mountain photography + illustration collage, and playful editorial composition. Do not reproduce Netflix branding, logos, title graphics, typography, or exact characters.

Use `100peaks-ui-concept.png` as the closest visual target for the app's composition and overall feel. Use `100PEAKS_MASTER_SPEC.md` as the authority for behavior and implementation. If an image conflicts with the written specification, **the written specification wins**.

If the expected binary image files are missing, do not hallucinate their contents. Follow the written visual specification and report the missing references.
>>>>>>> origin/main

## 2. Non-negotiable product rules

- Product name: `100PEAKS`. Primary UI language: Korean. Code identifiers: English.
- Exactly 5 bottom tabs: 홈 / 명산 / 인증 / 친구 / MY. Do not add or remove primary tabs.
- Mutual-follow friends must appear before all other certified users on mountain detail lists.
- Shared certification is one real multi-user `certification_session` with members. It is never post-upload friend tagging.
- Only mutual-follow friends may be invited to shared certification.
- For MVP, each confirmed participant must independently pass summit GPS proximity.
- Preserve the collectible 100-mountain progression and the mascot / badge system.
- Do not redesign the product from scratch.
- Do not replace the playful cream + saturated primary-color system with generic hiking / fitness green.
- Do not copy Netflix logos, typography, title art, or exact characters.
- Use the design tokens and canonical business rules from the master spec.
- Do not silently invent new primary flows, database entities, authentication rules, or product requirements.

## 3. Mandatory visual references

Before implementing or redesigning any UI, inspect every image asset under `docs/references/` (manifest: `docs/references/README.md`):

- `1C1533A7-D129-4597-B41C-9F9983F83CBF.png` — Visual reference 01. Mood only: saturated primary colors, fuzzy mascot direction, naive character faces, hand-made imperfections, sticker / doodle energy.
- `A45AED2C-06DC-4043-BEFB-8B813368A94D.png` — Visual reference 02. Mood only: photo + illustration collage, editorial poster composition, playful typography.
- `D5F2733C-13FD-40B4-96CC-EF3ABDBAF3DF.png` — 100PEAKS UI concept. The closest visual target for actual screens: cream base, strong black hierarchy, saturated accents, mountain photography, mascot overlays.

Priority: the master spec decides behavior, navigation, data, and business rules. When a purely visual decision is ambiguous, the UI concept image wins; the two mood references inform character, color, and graphic energy only.

Never copy Netflix branding, logos, program title graphics, proprietary typography, or exact characters. 100PEAKS uses an original wordmark and original mountain mascots.

If any expected image is missing, do not invent its contents: follow the written visual spec and say explicitly that the binary reference is absent.

## 4. Technical defaults

<<<<<<< HEAD
Unless blocked by an existing repository constraint, use:

- React Native + Expo
- TypeScript (strict)
- Expo Router
- Supabase (PostgreSQL, Auth, Storage)
- expo-location
- expo-camera
- TanStack React Query
- Zod
=======
Unless blocked by existing repository constraints, use React Native, Expo, TypeScript, Expo Router, Supabase/PostgreSQL, Supabase Auth + Storage, expo-location, expo-camera, TanStack React Query, and Zod.
>>>>>>> origin/main

Keep secrets (including the Supabase service-role key) out of client code and out of the repository.

## 5. Change protocol

Before editing code, state briefly:
<<<<<<< HEAD

1. which implementation phase from the master spec (section 19) you are working on,
2. which files you intend to modify,
3. which acceptance criteria you will satisfy.

If the current repository structure conflicts with the master spec, prefer the smallest migration path that preserves working code.
Prefer small, coherent changes over broad rewrites.
=======
1. implementation phase,
2. planned files,
3. acceptance criteria being addressed.

Prefer small, coherent changes over broad rewrites. Reuse shared components and canonical design tokens. Do not add new product flows unless required to satisfy the master spec or a user request.
>>>>>>> origin/main

## 6. Coding rules

- Reuse the shared components in spec section 13 before creating one-off UI.
- Keep TypeScript strict and compiling.
- Use realistic Korean UI copy (spec section 21). No lorem ipsum.
- Implement loading, empty, and error states for every async screen (spec section 16).
- Keep touch targets >= 44pt and handle safe areas.
- Avoid hard-coded colors when a design token exists (spec section 2.3).
- Keep exact GPS coordinates private from public social UI.

## 7. Required validation

Before declaring work complete:
<<<<<<< HEAD

- run the TypeScript / build checks available in the repository,
=======
- run TypeScript/build checks available in the repository,
>>>>>>> origin/main
- verify navigation routes touched by the change,
- verify async loading / error / empty states where applicable,
- verify shared-certification state is a real state model, not cosmetic,
- verify mutual-first sorting where applicable,
- verify no service-role key or secret was committed.

## 8. Definition of done

<<<<<<< HEAD
Do not claim a feature is complete if:

- TypeScript has compile errors,
- navigation is broken,
- the shared certification state model is missing,
- mutual-friend prioritization is missing where required,
- mock data contradicts across screens,
- design tokens are bypassed by random hard-coded colors,
- required loading / error states are missing.

After coding, report:

- files changed,
- schema or migration changes,
- commands to run,
- environment variables required,
- manual tests to perform,
- known limitations.
=======
Return files changed, schema/migration changes, commands run, environment variables needed, manual test steps, and known limitations.
>>>>>>> origin/main

## 9. Default starting behavior

If the user simply says "start", "implement it", or gives no narrower task, inspect the repository against `100PEAKS_MASTER_SPEC.md` and begin from the earliest incomplete phase in section 19. On an empty repository that is **Phase 1 — Foundation**. Do not skip foundational work just to produce screenshots quickly.
