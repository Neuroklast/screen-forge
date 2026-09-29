# Plan 11 — Scene Rework V2

> ScreenForge concept set · Implementation plan · Program V2 · Language: EN, UI labels DE
> Concept: [../konzept/catalog/scenes/](../konzept/catalog/scenes/02-operating-system.md) · Blocks: [../konzept/catalog/blocks/](../konzept/catalog/blocks/13-clock.md)
> Decisions: own fictional OS look (squared, dense), OS/Terminal split, new elements as film blocks first, synthetic OS sounds, concept first.

## Goal

Rework every scene and block to the V2 specs: a real operating-system feel (squared, dense, windowed), a goal-driven terminal, phase/type-aware countdown, pure tracking with a drone mode, an analysis with outcomes, richer lock/medical/slide blocks, and three new blocks (clock, rotary, code table).

## Progress

- Done: V2-1 `sceneOptions` config record + defaults + migration ([../../src/core/config.ts](../../src/core/config.ts), [../../src/core/configMigration.test.ts](../../src/core/configMigration.test.ts)); V2-2 photo fix (uncropped + theme tint in `os.css`); V2-3 squared operational UI.
- Done: V2-4/V2-5 OS/Terminal split — scene ids `os` + `terminal`, `OperatingSystem` (renamed from CyberOS), goal-driven [../../src/scenes/terminal/Terminal.tsx](../../src/scenes/terminal/Terminal.tsx), config v2 migration (`terminal`→`os` for v1), show templates and inspector split; V2-17 partial (training modules `os`/`terminal`, terminal signals).
- Done: V2-19 layout contracts — [../konzept/usability/09-layout-contracts.md](../konzept/usability/09-layout-contracts.md), z-index registry in `src/layout.css`, hidden scrollbars on scene/training surfaces, `npm run check:layout` gate wired into CI (0 errors; warnings list the migration backlog).
- Done: V2-7 synthetic OS sounds — `scripts/gen-os-sounds.mjs` (`npm run gen:sounds`) writes `sounds/os_*.wav` + `sounds/manifest.json`; startup/open/close wired into the OS scene. V2-6 partial (window close sound; full chrome rework still open).
- Done: V2-8 terminal goal config — `sceneOptions.terminal.steps`/`goal`/`prompt` (editable in the inspector); the CLI uses configured steps when present. V2-6 further: squared window-bar controls with hover/focus, ellipsized window title, `osNotify` on sequence completion.
- Done: V2-10 countdown — device profiles (transfer/bomb/reactor/custom with label) drive family, telemetry and timer labels; a phase banner shows the current phase with per-phase accent; the inspector gains type, label and (for bombs) the assembly variant.
- Done: V2-16 new blocks — `clock`, `rotary`, `code-table` and the requested `data-sheet` (schematic + disposal steps to read and relay via comms) in `src/scenes/blocks/Instruments.tsx`; registry, config options and inspector wired. V2-13/V2-15 partial: lock shows the attempt count, slide shows the stage count.
- Done: V2-9 corporate window bar (OS-like windowed surface) and V2-14 medical (trend arrows, extra values GLU/LAC, configurable alarm pulse). New blocks registered as training modules (`clock`/`rotary`/`code-table`/`data-sheet`) with signal whitelist; the EOD template ships a data-sheet station.
- Done: mission briefing generator — [../../src/core/briefing.ts](../../src/core/briefing.ts) turns a built mission into an English SMEAC/OPORD full-text briefing (situation, mission, execution, timeline, support, command & signal, annexes); TrainerView gains a "Briefing" tab with copy/download ([../konzept/formats/05-briefing-format.md](../konzept/formats/05-briefing-format.md)).
- Done: V2-6 OS chrome — squared window-bar controls, start-menu header, taskbar tray with a sound toggle, plus synthetic OS sounds (startup/open/close/notify). The V2 scene-rework program is complete.

## Tasks

| ID | Task | File(s) | Depends | Done when |
| --- | --- | --- | --- | --- |
| V2-1 | `sceneOptions` config record + defaults + migration | `src/core/config.ts` | — | old configs load; options editable |
| V2-2 | `ScenePhoto` component: uncropped + theme overlay | new `src/components/ScenePhoto.tsx` | V2-1 | portraits fully visible, tint applies |
| V2-3 | Square the operational UI (no radii) | `startpage.css`, `builder.css`, `gallery.css`, `roles.css`, `device.css` | — | no rounded corners in operational UI |
| V2-4 | OS/Terminal split: scene ids `os` + `terminal`, registry, migration | `config.ts`, `Scenes.tsx`, `main.tsx`, `App.tsx` | V2-1 | `os` renders desktop, `terminal` renders CLI |
| V2-5 | Extract `OperatingSystem` component + `Terminal` component | `src/scenes/os/*`, new `src/scenes/terminal/*` | V2-4 | both scenes build and run |
| V2-6 | OS window chrome, taskbar, start menu, animations | `src/scenes/os/*` | V2-5 | squared chrome, subtle motion |
| V2-7 | Synthetic OS sounds + manifest | `scripts/` (new), `sounds/`, `src/core/sound.ts` | — | WAVs generated, manifest lists them |
| V2-8 | Terminal goal chain (steps, outputs, signal) | `src/scenes/terminal/*` | V2-5 | `terminal.bypass` on completion |
| V2-9 | Corporate windowed surface | `src/scenes/shared/LiveScenes.tsx` | V2-1 | apps as windows, sounds |
| V2-10 | Countdown phases + device types | `src/scenes/shared/Warhead.tsx` | V2-1 | per-phase displays, type config |
| V2-11 | Tracking pure + drone mode | `src/scenes/shared/LiveScenes.tsx` | V2-1 | sensor/drone configurable |
| V2-12 | Analysis modes with outcomes | `src/scenes/shared/LiveScenes.tsx` | V2-1 | decrypt/data/reconstruct results |
| V2-13 | Lock animations + config | `src/scenes/blocks/Blocks.tsx` | V2-1 | press/scan/unlock/error animated |
| V2-14 | Medical values, animation, layout + config | `src/scenes/blocks/Blocks.tsx` | V2-1 | dense clean layout, more values |
| V2-15 | Slide releases + config | `src/scenes/blocks/Blocks.tsx` | V2-1 | staged release works |
| V2-16 | New blocks: clock, rotary, code table | new `src/scenes/blocks/*` | V2-1 | blocks usable in film studio |
| V2-17 | Training mapping for `os`/`terminal` + new signals | `training.ts`, `ElementView.tsx`, server | V2-5, V2-8 | modules render correctly |
| V2-18 | Tests: config migration, ScenePhoto, terminal goal, blocks | `src/core/*.test.ts`, `tests/*.spec.ts` | V2-* | green |
| V2-19 | Layout contracts: doc, z registry, scrollbar hiding, check gate | [../konzept/usability/09-layout-contracts.md](../konzept/usability/09-layout-contracts.md), `src/layout.css`, `scripts/check-layout.mjs` | — | gate green in CI |

## Order

1. V2-1, V2-2, V2-3 (foundations + visible fixes).
2. V2-4 → V2-8 (OS/Terminal core).
3. V2-9 → V2-12 (remaining scenes).
4. V2-13 → V2-16 (blocks + new elements).
5. V2-17, V2-18 (training + tests).
6. Docs, lessons, push per increment.

## Acceptance (program)

- [ ] Every scene/block matches its V2 catalog spec.
- [ ] No rounded corners or modern UI look in scenes or operational UI.
- [ ] Photos render uncropped with theme overlay.
- [ ] Terminal always ends in a goal; countdown/analysis produce visible outcomes.
- [ ] `npm run check`, `npm test`, `npm run build`, `npm run test:e2e` green per increment.

## Risks

| Risk | Mitigation |
| --- | --- |
| OS/Terminal split breaks training mappings | Keep scene ids stable via config v2 migration; test both mappings |
| `CyberOS.tsx` (1420 lines) refactor regressions | Extract in steps: rename, then chrome, then apps; e2e after each |
| New blocks inflate bundle | Lazy-load new scenes; measure build size |
| Sound licensing | Synthetic WAVs, first-party, documented |
