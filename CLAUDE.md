# Claude instructions for 100PEAKS

@AGENTS.md

All shared agent rules live in `AGENTS.md` (imported above).

Product behavior, navigation, data, and business rules come from `100PEAKS_MASTER_SPEC.md`.
The current official character/visual interpretation is additionally locked in `docs/OFFICIAL_VISUAL_DIRECTION.md` and overrides older mascot-collection language in the master spec where they conflict.
The current multi-challenge collection model is locked in `docs/COLLECTIONS.md` and overrides older language that assumes there is only one canonical 100-mountain list.
For mountain-list and GPS-verification data work, read `docs/data/BAC100_DATA_POLICY.md` and `docs/data/bac100-candidates.csv` first. Mountain identity and GPS verification point are separate, and pending coordinates must never be guessed or activated for certification.

Claude-specific notes:

- Follow the change protocol in `AGENTS.md`: before coding, report the phase, files you will touch, and acceptance criteria.
- Before implementing or redesigning any UI, inspect every image under `docs/references/`, especially the original 100PEAKS UI concept.
- Also inspect `assets/official/` and read `src/data/officialArt.ts` before touching character or sticker usage.
- Official character families are YELLOW / RED / BLUE / PINK only. They are recurring brand actors, not one mascot per mountain.
- Never delete `assets/mascots/`; keep it as a supporting/experimental library unless the user explicitly asks otherwise.
- 100PEAKS supports both `forest_service_100` (산림청 100대 명산) and `bac_100` (BAC 명산100 기준). Users may switch the primary collection without losing certifications.
- A summit certification is stored once and can count toward every collection that contains the mountain; never duplicate certification sessions per challenge.
- Never invent or approximate BAC verification-point GPS coordinates. Keep them pending until verified.
- Do not imply an official BLACKYAK/BAC partnership or copy BAC logos/visual branding without explicit permission.
- When a screen visually diverges from the concept, preserve working product flows and fix the visual hierarchy/composition rather than rewriting functional logic.
