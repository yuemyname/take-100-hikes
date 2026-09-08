# Claude instructions for 100PEAKS

@AGENTS.md

All shared agent rules live in `AGENTS.md` (imported above). Product, design, data, and implementation decisions come from `100PEAKS_MASTER_SPEC.md`. If anything conflicts, the master spec wins.

Claude-specific notes:

- Follow the change protocol in `AGENTS.md`: before coding, report the phase, the files you will touch, and the acceptance criteria.
- Before implementing or redesigning any UI, open every image under `docs/references/` (see `docs/references/README.md`). Do not guess their contents.
- If the user gives no narrower task, start from the earliest incomplete phase in the spec.
