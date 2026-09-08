# Claude instructions for 100PEAKS

You are working on the **100PEAKS** app in this repository.

## Mandatory source of truth

Before making any product, UI, database, architecture, or implementation decision, read:

`100PEAKS_MASTER_SPEC.md`

That file is the single source of truth. If this file, prior chat context, generated code, or your own preference conflicts with the master spec, **the master spec wins**.

## Working rules

1. Do not redesign the product from scratch.
2. Do not replace the visual language with a generic green outdoor/fitness design.
3. Preserve the exact 5-tab navigation defined in the master spec.
4. Preserve mutual-friend-first ordering on mountain certification lists.
5. Preserve shared certification as one real multi-user certification session, not post-upload tagging.
6. Only mutual-follow friends may be invited to shared certification.
7. Preserve the collectible 100-mountain progression and mascot system.
8. Use the design tokens and canonical business rules from the master spec.
9. Prefer Expo + TypeScript + Supabase unless an existing repository constraint blocks it.
10. Do not silently invent new primary flows, database entities, or product requirements.

## Before coding

Briefly report:

- which implementation phase from the master spec you are working on,
- which files you intend to modify,
- which acceptance criteria you will satisfy.

If the current repository structure conflicts with the master spec, prefer the smallest migration path that preserves working code.

## During coding

- Reuse shared components.
- Keep TypeScript strict and compiling.
- Use realistic Korean UI copy.
- Implement loading, empty, and error states for async screens.
- Keep touch targets mobile friendly.
- Avoid random hard-coded colors when a design token exists.
- Never expose secret or Supabase service-role credentials in client code.
- Keep exact GPS coordinates private from public social UI.

## Definition of done

Do not claim a feature is complete if:

- TypeScript has compile errors,
- navigation is broken,
- the shared certification state model is missing,
- mutual-friend prioritization is missing where required,
- mock data contradicts across screens,
- required loading/error states are missing.

After coding, report:

- files changed,
- schema or migration changes,
- commands to run,
- environment variables required,
- manual tests to perform,
- known limitations.

## First task default

If the user simply says “start”, “implement it”, or otherwise gives no narrower task, begin with **Phase 1 — Foundation** from `100PEAKS_MASTER_SPEC.md`. Do not skip ahead unless the repository already satisfies that phase.
