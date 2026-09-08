# Agent instructions for 100PEAKS

This repository implements **100PEAKS** (백픽스), a social collectible app for completing Korea's 100 famous mountains.

These instructions apply to every coding agent (Claude Code, Codex, Cursor, ChatGPT, ...).
`CLAUDE.md` imports this file, so keep all shared agent rules here and do not duplicate them elsewhere.

## 1. Single source of truth

Read `100PEAKS_MASTER_SPEC.md` completely before making any product, UI, database, architecture, or implementation decision.

The master spec is the single source of truth for:

- product behavior,
- visual direction,
- navigation,
- data model,
- social rules,
- shared certification,
- implementation phases,
- acceptance criteria.

If this file, prior chat context, generated code, or your own preference conflicts with the master spec, **the master spec wins**. Preserve working code where possible, but make product decisions according to the spec.

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

## 3. Technical defaults

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

## 4. Change protocol

Before editing code, state briefly:

1. which implementation phase from the master spec (section 19) you are working on,
2. which files you intend to modify,
3. which acceptance criteria you will satisfy.

If the current repository structure conflicts with the master spec, prefer the smallest migration path that preserves working code.
Prefer small, coherent changes over broad rewrites.

## 5. Coding rules

- Reuse the shared components in spec section 13 before creating one-off UI.
- Keep TypeScript strict and compiling.
- Use realistic Korean UI copy (spec section 21). No lorem ipsum.
- Implement loading, empty, and error states for every async screen (spec section 16).
- Keep touch targets >= 44pt and handle safe areas.
- Avoid hard-coded colors when a design token exists (spec section 2.3).
- Keep exact GPS coordinates private from public social UI.

## 6. Required validation

Before declaring work complete:

- run the TypeScript / build checks available in the repository,
- verify navigation routes touched by the change,
- verify async loading / error / empty states where applicable,
- verify shared-certification state is a real state model, not cosmetic,
- verify mutual-first sorting where applicable,
- verify no service-role key or secret was committed.

## 7. Definition of done

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

## 8. Default starting behavior

If the user simply says "start", "implement it", or gives no narrower task, inspect the repository against `100PEAKS_MASTER_SPEC.md` and begin from the earliest incomplete phase in section 19. On an empty repository that is **Phase 1 — Foundation**. Do not skip foundational work just to produce screenshots quickly.
