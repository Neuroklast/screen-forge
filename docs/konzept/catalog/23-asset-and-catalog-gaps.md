# Catalog — Asset & Catalog Gaps

> ScreenForge concept set · Catalog · Maintained findings (Ist) with measures (Soll) · Language: EN
> Scope: assets, dead wiring, naming, docs drift. Feature gaps: [../domain/12-gap-analysis.md](../domain/12-gap-analysis.md)

## Findings

| # | Finding | Evidence | Measure |
| --- | --- | --- | --- |
| 1 | `public/media/` (26 files, ~80 MB) is untracked and not ignored; fresh clones have no example media | git status; `exampleMedia.ts` fetches `/media/...` | Track a curated media pack (licenses included) or ship media inside `.sfpack`; keep `secret data/` ignored |
| 2 | `secret data/` (byte-identical master of `public/media/`) is untracked and not ignored | MD5 comparison | Add to `.gitignore`; never commit |
| 3 | `public/media/index.json` is read by no code | no references | Remove or turn into a real manifest for the media pack |
| 4 | One incident image exists twice, byte-identical | MD5 `E17C505C...` | Delete duplicate |
| 5 | `docs/previews/corporate.png` duplicates `studio.png`; 7 previews are unreferenced | MD5; README refs | Deduplicate; reference or archive unused previews |
| 6 | OS Workspace app is unreachable (workarea gate) | `CyberOS.tsx:428` | Fix gate or remove the app |
| 7 | `playLoop` is dead code; `stopLoop` only used for `openProfile` | `sound.ts:35-54` | Wire loops or delete |
| 8 | Sounds `abort`, `denied`, `scroll2` unused | no call sites | Assign (see [22-sounds.md](22-sounds.md)) or delete |
| 9 | `src/core/dossiers.ts` load/save unused; only `defaultDossiers` used by the wizard | no call sites | Repurpose as dossier templates or remove |
| 10 | Fonts `MatrixTypeDisplay`, `DigitTech16`, `Gridtile`, `codiceBinario` have no consuming CSS; `--scene-font` is used only in `director.css:510` | CSS grep | Wire per-scene font roles or reduce the selectable set |
| 11 | HQ `player` GPS toggle is shown but rejected server-side | `DeviceTools.tsx:95` vs `exercise.mjs:359` | Hide the toggle for HQ or allow HQ GPS |
| 12 | No sound licenses/provenance documented | `docs/licenses/` lacks audio | Add a sound manifest with license per file |
| 13 | No favicon link in `index.html` despite `public/icon.svg` | `index.html` | Add `<link rel="icon">` |
| 14 | README test counts stale (9 unit / 9 e2e); actual 24 unit + 1 server + 19 e2e | `README.md:122` vs `package.json` scripts | Update README numbers |
| 15 | Scene display titles conflate companies with scenes (VESPER, BLACKLINE, AEON as scene names) | `config.ts:152-272`; SystemProfiles | UI scene picker uses functional names; titles are branding (see [20-companies-and-brands.md](20-companies-and-brands.md)) |
| 16 | `presets/*.json` are not loaded by any code path | no references | Document as import samples or wire a preset browser |

## Notes

- Findings 1–2 are the highest risk: a fresh clone breaks example media and the `secret data/` folder could be committed accidentally.
- Findings 6–11 are dead wiring: they confuse agents and users and should be resolved before new features build on them.
- Finding 15 is conceptual, not cosmetic: it caused this catalog's initial naming error. Scenes are functional surfaces; companies are identities.

## Acceptance criteria

- [ ] Given a fresh clone with the curated media pack, example media seeds successfully.
- [ ] Given `git status`, no media master or secret folder is untracked-but-unignored.
- [ ] Given the app, no dead app icon, dead loop, or dead toggle is visible.
- [ ] Given the scene picker, only functional scene names appear; brand titles come from the applied company.
