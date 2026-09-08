# Codex / coding agent instructions for 100PEAKS

This repository implements **100PEAKS**, a social collectible app for completing Korea's 100 famous mountains.

## Highest-priority instruction

Read `100PEAKS_MASTER_SPEC.md` completely before making changes.

Treat it as the repository's single source of truth for:

- product behavior,
- visual direction,
- navigation,
- data model,
- social rules,
- shared certification,
- implementation phases,
- acceptance criteria.

If any other instruction or existing generated code conflicts with the master spec, preserve working code where possible but make product decisions according to the master spec.

## Non-negotiable behavior

- Product name: `100PEAKS`.
- Primary UI language: Korean.
- Exactly 5 bottom tabs: 홈 / 명산 / 인증 / 친구 / MY.
- Mutual-follow friends must appear before other certified users on mountain details.
- Shared certification is a single `certification_session` with multiple members.
- Shared certification candidates are mutual-follow friends only.
- For MVP, each confirmed participant must independently pass summit GPS proximity.
- Do not replace the playful cream + saturated primary-color system with generic hiking green.
- Do not copy Netflix logos, typography, title art, or exact characters.
- Preserve the collectible mascot / mountain progression concept.

## Technical defaults

Unless blocked by existing repository constraints, use:

- React Native
- Expo
- TypeScript
- Expo Router
- Supabase/PostgreSQL
- Supabase Auth + Storage
- expo-location
- expo-camera
- TanStack React Query
- Zod

Keep secrets out of the client and repository.

## Change protocol

Before editing code, state briefly:

1. implementation phase,
2. planned files,
3. acceptance criteria being addressed.

Prefer small, coherent changes over broad rewrites.
Reuse shared components and canonical design tokens.
Do not add new product flows unless required to satisfy the master spec or a user request.

## Required validation

Before declaring work complete:

- run TypeScript/build checks available in the repository,
- verify navigation routes touched by the change,
- verify async loading/error/empty states where applicable,
- verify shared-certification state is not merely cosmetic,
- verify mutual-first sorting where applicable,
- verify no service-role key or secret was committed.

## Completion report

Return:

- files changed,
- schema/migration changes,
- commands run,
- environment variables needed,
- manual test steps,
- known limitations.

## Default starting behavior

If asked to implement the app without a specific phase, inspect the repository against `100PEAKS_MASTER_SPEC.md` and start from the earliest incomplete phase. Do not skip foundational work just to produce screenshots quickly.
