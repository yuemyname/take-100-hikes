# Claude instructions for 100PEAKS

@AGENTS.md

All shared agent rules live in `AGENTS.md` (imported above). Product, design, data, and implementation decisions come from `100PEAKS_MASTER_SPEC.md`. If anything conflicts, the master spec wins.

Claude-specific notes:

- Follow the change protocol in `AGENTS.md`: before coding, report the phase, the files you will touch, and the acceptance criteria.
- If the user gives no narrower task, start from the earliest incomplete phase in the spec (Phase 1 — Foundation on an empty repository).
