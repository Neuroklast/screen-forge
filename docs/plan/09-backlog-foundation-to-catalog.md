# Plan 09 — Backlog: Foundation → Catalog

> ScreenForge concept set · Implementation plan · Task backlog (phases 1–3) · Language: EN
> Phase details: [01-foundation.md](01-foundation.md) · [02-builder.md](02-builder.md) · [03-catalog.md](03-catalog.md)
> Status: `todo` / `doing` / `done`. Update the row when the task ships.

## Progress

- Done: F1 start page, F2 resume, F3 role aliases + routing, F4 depth setting ([../../src/views/StartPage.tsx](../../src/views/StartPage.tsx), [../../src/core/session.ts](../../src/core/session.ts)).
- Done: F5 mission v2 schema, F6 v1→v2 migration ([../../src/core/training.ts](../../src/core/training.ts)), F7 server persistence via the shared schema, F8 tests ([../../src/core/migration.test.ts](../../src/core/migration.test.ts), [../../src/core/session.test.ts](../../src/core/session.test.ts)).
- Phase 1 complete. New-role projection (safety/assessor/technician) is deferred to Phase 4 (see the deviation in [01-foundation.md](01-foundation.md)).

### Phase 2 — Builder

- Done: B1 shell, B2 palette, B3 board, B4 inspector, B5 mouse drag & drop, B7 linter ([../../src/builder/MissionBuilder.tsx](../../src/builder/MissionBuilder.tsx), [../../src/core/missionLint.ts](../../src/core/missionLint.ts)), B8 defaults, B9 entities/bindings, B10 undo/redo, B11 save via the existing revision flow, B12 integration, B13 e2e ([../../tests/builder.spec.ts](../../tests/builder.spec.ts)).
- Partial: B6 — keyboard/click alternative works; touch long-press drag is not implemented (tap + inspector covers touch).
- Deviation: the classic editor stays as a secondary tab for map tiles, routes and the action editor until Phase 3 completes.

### Phase 3 — Catalog

- Done: C1 prop runtime + `ordnance`/`beacon` modules ([../../src/core/training.ts](../../src/core/training.ts)), C4 signal whitelist + server `prop` command, C2/C3 training consoles ([../../src/training/OrdnanceConsole.tsx](../../src/training/OrdnanceConsole.tsx), [../../src/training/BeaconControl.tsx](../../src/training/BeaconControl.tsx)), C5 template library ([../../src/core/templates.ts](../../src/core/templates.ts)), C6 gallery ([../../src/training/TemplateGallery.tsx](../../src/training/TemplateGallery.tsx)), C7 gallery loads into the builder, C9 tests ([../../src/core/templates.test.ts](../../src/core/templates.test.ts), [../../src/core/prop.test.ts](../../src/core/prop.test.ts)).
- Deviations: templates ship as a typed module (not `presets/missions/*.json`); film scenes for `ordnance`/`beacon` are deferred; C8 sound manifest is blocked on per-file license information.

### Scene rework V2 (concept first)

- Done: catalog split — [../konzept/catalog/scenes/02-operating-system.md](../konzept/catalog/scenes/02-operating-system.md), [../konzept/catalog/scenes/03-os-sequences.md](../konzept/catalog/scenes/03-os-sequences.md), [../konzept/catalog/scenes/08-terminal.md](../konzept/catalog/scenes/08-terminal.md); rework specs in 01/04/05/06 and blocks 07/09/12; new blocks [../konzept/catalog/blocks/13-clock.md](../konzept/catalog/blocks/13-clock.md), [../konzept/catalog/blocks/14-rotary.md](../konzept/catalog/blocks/14-rotary.md), [../konzept/catalog/blocks/15-code-table.md](../konzept/catalog/blocks/15-code-table.md); `sceneOptions` in formats; photo rules + synthetic OS sounds documented.
- Open: implementation phases V2-1 (foundations: `sceneOptions`, OS/Terminal split, photo component, OS chrome, squared UI) through V2-6 (training integration).

## Phase 1 — Foundation

| ID | Task | File(s) | Depends | Done when |
| --- | --- | --- | --- | --- |
| F1 | Start page with mode cards, footer, server status | `src/views/StartPage.tsx`, `src/main.tsx` | — | `/` renders cards < 1 s |
| F2 | Resume per mode | `src/core/session.ts`, `src/views/StartPage.tsx` | F1 | last session restores |
| F3 | Role routing + aliases | `src/main.tsx`, `src/core/session.ts` | — | `trainer`/`element`/`film` map correctly |
| F4 | Depth setting persisted | `src/core/session.ts`, `src/views/StartPage.tsx` | F1 | survives reload |
| F5 | Mission v2 schema | `src/core/training.ts` | — | validates v2 + example |
| F6 | v1→v2 migration | `src/core/migration.ts` | F5 | idempotent, lossless |
| F7 | Server v2 accept/persist/project | `server/exercise.mjs` | F5 | restart keeps v2 |
| F8 | Tests: migration/session/lifecycle | `src/core/*.test.ts`, `server/exercise.test.mjs` | F5–F7 | green |

## Phase 2 — Builder

| ID | Task | File(s) | Depends | Done when |
| --- | --- | --- | --- | --- |
| B1 | Builder shell (palette/board/inspector) | `src/builder/MissionBuilder.tsx` | F5 | three panes render |
| B2 | Palette (modules/entities/injects/teams) | `src/builder/Palette.tsx` | B1 | search + groups work |
| B3 | Board (cards, chips, bindings, badge) | `src/builder/Board.tsx` | B1 | items render + select |
| B4 | Inspector (immediate edits, multi-select) | `src/builder/Inspector.tsx` | B1 | scalar edits apply live |
| B5 | Drag & drop (mouse) | `src/builder/Board.tsx` | B2, B3 | module drop → station |
| B6 | Touch long-press + keyboard path | `src/builder/*` | B5 | keyboard-only add works |
| B7 | Linter (severities, fixes) | `src/core/missionLint.ts`, `src/builder/Linter.tsx` | F5 | findings clickable |
| B8 | Defaults fix (terminal, no binding, empty mission) | `src/builder/*`, `src/core/training.ts` | B3 | no forced content |
| B9 | Entity add/remove + bindings | `src/builder/*` | B3 | drag chip → station binds |
| B10 | Undo/redo (≥ 50 steps) | `src/builder/history.ts` | B3 | delete undoable |
| B11 | Save/revision/conflict | `src/builder/*`, `server/exercise.mjs` | F7 | stale save rejected |
| B12 | Integrate into TrainerView + wizard hatch | `src/views/TrainerView.tsx`, `src/training/ScenarioWizard.tsx` | B1–B11 | builder reachable |
| B13 | E2E builder flows | `tests/builder.spec.ts` | B5–B12 | green |

## Phase 3 — Catalog

| ID | Task | File(s) | Depends | Done when |
| --- | --- | --- | --- | --- |
| C1 | Prop entity + state machine | `src/core/training.ts` | F5 | transitions tested |
| C2 | `ordnance` module + fictional console | `src/scenes/ordnance/*`, `src/training/OrdnanceConsole.tsx` | C1 | stage order → disarm |
| C3 | `beacon` module + scene | `src/scenes/beacon/*`, `src/training/BeaconControl.tsx` | C1 | hold → active |
| C4 | Signal whitelist + server actions | `src/core/training.ts`, `server/exercise.mjs` | C2, C3 | events forwarded |
| C5 | Template library (9 JSON) | `presets/missions/*.json` | F5 | all validate |
| C6 | Template gallery UI | `src/training/TemplateGallery.tsx` | C5 | filters + preview |
| C7 | Wizard loads templates | `src/training/ScenarioWizard.tsx` | C5, C6 | all elements removable |
| C8 | Sounds: assign/remove + manifest | `src/core/sound.ts`, `sounds/manifest.json` | — | no unused ids |
| C9 | Tests: props/modules/templates | `src/core/*.test.ts`, `tests/training.spec.ts` | C1–C7 | green |

## Working rules

- Pick the lowest-id `todo` whose dependencies are `done`.
- One task per commit where practical; mark `done` only after the DoD ([08](08-tests-and-dod.md)).
- If a task reveals a concept gap, update the concept file in the same change.
