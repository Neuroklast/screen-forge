# Plan 15 — Backlog: Interaction Engine

> ScreenForge concept set · Implementation plan · Task backlog (phase 9) · Language: EN
> Phase details: [14-interaction-engine.md](14-interaction-engine.md) · Concept: [../konzept/domain/14-interaction-model.md](../konzept/domain/14-interaction-model.md)
> Status: `todo` / `doing` / `done`. Update the row when the task ships.

## Progress

- Done: I1 workflow schema + additive mission field + reference checks + secret redaction; I2 task registry `ports`/`surface` + `code-entry`/`confirm`; I3 deterministic interpreter (variables, condition, increment, delay, at-most-once, `activeNodeIds`); I4 journaled `workflow.*` events + `interaction` command + role projection + restart replay; I5 workflow graph linter (ports, reachability, infinite loop); I6 pilot surfaces (Device Console, Link, Code Challenge, Diagnostics, Lockout) + station wiring + simulated connect action; I6b `device-link` template + AAR log entries; I7 graph editor `Ablauf` (`@xyflow/react` lazy chunk): node palette, port handles with labeled edges, inspector-based connect path (accessible alternative to dragging), typed node config, variables panel with reference-preserving rename, linter findings mapped to nodes, read-only gate; I8 task catalog: `choice` (dynamic ports from options), `wait-for-event`/`connect` (prop-event driven), `report` (form input journaled to the AAR), `inspect`, `transfer`, manual workflow start from EXCON (`workflow-start` + Live-Steuerung button), prop-change reactions across instances; I9a operator field shell (fixed viewport, state mutation, overlays, declarative transfer progress); I9b-1 instrument field surfaces (`rotary`, `code-table`, `data-sheet`, `clock` render natively in the field shell through the shared scene components); I9b-2a CodeEntry capability (one shared keypad for `CodePad`, the studio PIN, the Lock block and the workflow code-challenge, with host-configured attempts/lockout); I9b-2b Timer capability (one shared countdown-digits component for the training terminal, the clock scene and the countdown scene); I9b-2c task-driven widget surfaces (`dial` and `code-table` workflow tasks; the scene and the surface share `RotaryControl`/`CodeTableControl`); I9b-2d task-driven surface catalog (`datasheet`, `timer`, `countdown`, `message-viewer`, `file-browser`; shared `DataSheetControl`, `MessageViewer`, `FileBrowser`); I10 functional scene rename (`corporate` → `intranet`, brand via theme, config + scenario migrations).
- Tests: `src/core/workflow.test.ts`, `src/core/workflowEdit.test.ts`, `src/core/graph.test.ts`, `server/interaction.test.mjs`, `tests/interaction.spec.ts`, `tests/workflow-editor.spec.ts`.
- Done (preparation UX): scenario `type` + capability overrides (`src/core/capabilities.ts`), six-section preparation shell, capability-driven guided setup, unified `"Ablauf"` workspace (human node palette + event timeline + derived links + collapsed raw data), capability/ownership/terminal-path linter rules, participants projection over stations/teams/actors/patients, legacy canvas under `"Expertenmodus (Legacy)"`; `tests/preparation.spec.ts`.
- Done (preparation audit): flow workspace split into palette/timeline/inspector/event-editor with one selection state, human port labels, workflow settings without node selection; contextual device ownership and collapsed presentation; CI config-helper race fixed. Next: keep auditing the six sections for control overload and unclear ownership before adding features.
- Open: OS archive-pane migration to the shared `FileBrowser`, the `dashboard`/`database` split (needs a concept decision), I11 physical device integration, I12 XState decision.

## Wave 1 — Engine (schema → interpreter)

| ID | Task | File(s) | Depends | Done when |
| --- | --- | --- | --- | --- |
| I1 | Workflow schema + additive mission field + reference checks + conservative redaction | `src/core/workflow.ts`, `src/core/training.ts`, `src/core/workflow.test.ts` | — | pilot fixture validates; invalid refs rejected; non-EXCON projection hides workflow secrets |
| I2 | Task registry: `ports`, `code-entry`, `confirm` | `src/core/taskBlocks.ts`, `src/core/taskBlocks.test.ts` | — | node validation uses registry schema and ports |
| I3 | Deterministic interpreter: `evaluateWorkflow`/`advanceWorkflow`, variables, condition, increment, delay, at-most-once | `src/core/workflow.ts`, `src/core/workflow.test.ts` | I1, I2 | replay twice → identical effects; duplicate input → one effect |
| I4 | Domain events + `interaction` command + projection/redaction + server gate | `src/core/events.ts`, `src/core/protocol.ts`, `server/exercise.mjs`, tests | I3 | paused rejected; duplicate ×100 → one effect; restart replay identical |
| I5 | Workflow graph linter: unknown task, invalid port, unreachable, dead end, cycle cap, missing timeout/fallback | `src/core/graph.ts`, `src/core/missionLint.ts`, tests | I3 | rule classes detected; `play` blocked on errors |

## Wave 2 — Vertical pilot

| ID | Task | File(s) | Depends | Done when |
| --- | --- | --- | --- | --- |
| I6 | Surfaces: Device Console, Link/Connection, Diagnostics + station wiring | `src/scenes/**`, `src/views/StageFrame.tsx`, `src/views/ElementView.tsx` | I4, I5 | pilot flow runs end-to-end incl. lockout |
| I6b | Pilot mission fixture (prop, station, workflow) + AAR visibility | `presets/missions/**`, `src/core/templates.ts` | I6 | restart/reconnect/AAR acceptance pass |

## Wave 3 — Editor and catalog

| ID | Task | File(s) | Depends | Done when |
| --- | --- | --- | --- | --- |
| I7 | Graph editor `Ablauf` (`@xyflow/react`, lazy) | `src/builder/MissionBuilder.tsx`, new components | I6 | edit + lint badges; keyboard/touch path; read-only while running |
| I8 | Task catalog expansion | `src/core/taskBlocks.ts`, surfaces | I6 | new tasks validated + rendered |
| I9a | Operator field shell: fixed viewport, state mutation, overlays, declarative transfer progress | `src/views/ElementView.tsx`, `src/views/field.css`, `src/scenes/workflow/Surfaces.tsx` | I6 | no document scroll; active surface fills the viewport; e2e green |
| I9b-1 | Instrument field surfaces: `rotary`, `code-table`, `data-sheet`, `clock` render natively (no letterbox) via the shared scene components | `src/views/StageFrame.tsx`, `src/views/ElementView.tsx`, `src/views/field.css` | I9a | `.field-native` visible, `.role-stage` absent; e2e green |
| I9b-2a | CodeEntry capability: one shared keypad for `CodePad`, studio PIN, Lock block and workflow code-challenge; attempts/lockout | `src/components/CodeEntry.tsx`, `src/components/CodePad.tsx`, `src/scenes/workflow/Surfaces.tsx` | I9a | one implementation; `lock` lockout works; e2e green |
| I9b-2b | Timer capability: one shared countdown-digits component for the training terminal, clock and countdown scene | `src/components/Timer.tsx`, `src/training/TrainingTerminal.tsx`, `src/scenes/blocks/Instruments.tsx`, `src/scenes/shared/Warhead.tsx` | I9a | one implementation; countdown digits render in all hosts; e2e green |
| I9b-2c | Task-driven widget surfaces: `dial` and `code-table` tasks with shared controls | `src/scenes/blocks/controls.tsx`, `src/core/taskBlocks.ts`, `src/scenes/workflow/Surfaces.tsx` | I9b-2a | scene and surface share one control; builder exposes the tasks; e2e green |
| I9b-2d | Task-driven surface catalog: `datasheet`, `timer`, `countdown`, `message-viewer`, `file-browser`; shared `DataSheetControl`/`MessageViewer`/`FileBrowser` | `src/scenes/blocks/controls.tsx`, `src/core/taskBlocks.ts`, `src/scenes/workflow/Surfaces.tsx`, `src/components/MessageViewer.tsx`, `src/components/FileBrowser.tsx` | I9b-2c | tasks in the builder; one implementation per capability; e2e green |
| I9 | Widget migration (`lock`, `clock`, `rotary`, `code-table`, `data-sheet`, `countdown`) | scenes, `src/core/config.ts` | I7 | old configs migrate; e2e green |
| I10 | `corporate` → `intranet` (functional; brand via theme); `dashboard`/`database` pending a concept decision | scenes, catalog, guardrails | I7 | config/scenario migrations tested; e2e green |

## Wave 4 — Field

| ID | Task | File(s) | Depends | Done when |
| --- | --- | --- | --- | --- |
| I11 | Physical device integration (capabilities, transports, sessions, links) | data model, runtime | I9 | transport-agnostic `device.connected` |
| I12 | XState decision point | docs | I6 | decision recorded with evidence |

## Working rules

- Engine changes stay pure and deterministic; never import React or sockets in `src/core/workflow.ts`.
- Project workflow events per role; add a redaction test for every new event type.
- Mark `done` only after the DoD ([08](08-tests-and-dod.md)); update the concept gap analysis.
