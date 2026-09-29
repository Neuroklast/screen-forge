# Plan 07 — Cleanup & Assets

> ScreenForge concept set · Implementation plan · Phase 7 · Language: EN, UI labels DE
> Concept: [../konzept/catalog/23-asset-and-catalog-gaps.md](../konzept/catalog/23-asset-and-catalog-gaps.md)

## Goal

Remove dead wiring, make assets reproducible, and bring the README in line with reality. Low risk, high clarity gain.

## Work packages

| ID | Work package | Size | Files |
| --- | --- | --- | --- |
| X1 | `.gitignore`: add `secret data/`; keep `.exercise-data/` | S | `.gitignore` |
| X2 | Media pack decision + tracking (curated pack in git or `.sfpack`) | M | `public/media/`, new `docs/plan/decisions/media.md` or README note |
| X3 | Remove duplicate asset + unused `public/media/index.json` | S | `public/media/` |
| X4 | Remove dead code: `playLoop`, `dossiers.ts` load/save, unreachable paths | S | `src/core/sound.ts`, `src/core/dossiers.ts` |
| X5 | Sounds: assign `abort`/`denied`/`scroll2` or delete; add license manifest | S | `src/core/sound.ts`, `sounds/manifest.json` |
| X6 | Fix or remove OS Workspace app (`CyberOS.tsx:428` gate) | S | `src/scenes/os/CyberOS.tsx` |
| X7 | HQ GPS toggle: hide for HQ or allow server-side | S | `src/training/DeviceTools.tsx`, `server/exercise.mjs` |
| X8 | Fonts: wire per-scene font roles or reduce selectable set | M | `src/fonts.css`, `src/App.tsx`, `src/core/config.ts` |
| X9 | README: modes, training, start page, concept link, real test counts | M | `README.md` |
| X10 | Favicon link for `public/icon.svg` | S | `index.html` |
| X11 | Preview images: deduplicate, reference or archive | S | `docs/previews/` |

## Details

- **X2:** recommended: keep a small curated, licensed pack in git (a few MB) and load larger media via `.sfpack`; NEVER commit `secret data/`. Decision recorded in the plan.
- **X4:** delete `playLoop` if unused after Phase 4, or wire it for the new alert sounds.
- **X8:** either give `MatrixTypeDisplay`, `DigitTech16`, `Gridtile`, `codiceBinario` real scene roles, or remove them from the font selector — no selectable-but-inert options.
- **X9:** README must describe Film/Training/Demo, the start page, and link [../konzept/README.md](../konzept/README.md); fix stale test numbers.

## Acceptance criteria

- [ ] Given `git status`, `secret data/` is ignored and no media master is untracked.
- [ ] Given a fresh clone with the curated pack, example media seeds successfully.
- [ ] Given the app, no dead app icon, dead loop, or inert font option is visible.
- [ ] Given the README, test counts and mode descriptions match the code.

## Tests

- Manual: fresh-clone smoke (seed media, start each mode).
- Unit/CI: build and e2e remain green after removals.
- Optional gate: a small script that fails if `secret data/` is tracked.

## Risks

| Risk | Mitigation |
| --- | --- |
| Deleting something still referenced | Grep for every symbol before removal; build + e2e |
| Media pack bloats the repo | Keep the tracked pack small; push large media to packs |
| Font removal changes looks | Screenshot compare per scene before/after |

## Docs to update

- Concept: asset gaps in [../konzept/catalog/23-asset-and-catalog-gaps.md](../konzept/catalog/23-asset-and-catalog-gaps.md).
- README, `docs/VALIDATION.md` (test counts), lessons.
