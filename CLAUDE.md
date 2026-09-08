# Claude instructions for 100PEAKS

@AGENTS.md

All shared agent rules live in `AGENTS.md` (imported above).

Product behavior, navigation, data, and business rules come from `100PEAKS_MASTER_SPEC.md`.
The current official character/visual interpretation is additionally locked in `docs/OFFICIAL_VISUAL_DIRECTION.md` and overrides older mascot-collection language in the master spec where they conflict.

Claude-specific notes:

- Follow the change protocol in `AGENTS.md`: before coding, report the phase, files you will touch, and acceptance criteria.
- Before implementing or redesigning any UI, inspect every image under `docs/references/`, especially the original 100PEAKS UI concept.
- Also inspect `assets/official/` and read `src/data/officialArt.ts` before touching character or sticker usage.
- Official character families are YELLOW / RED / BLUE / PINK only. They are recurring brand actors, not one mascot per mountain.
- Never delete `assets/mascots/`; keep it as a supporting/experimental library unless the user explicitly asks otherwise.
- When a screen visually diverges from the concept, preserve working product flows and fix the visual hierarchy/composition rather than rewriting functional logic.
