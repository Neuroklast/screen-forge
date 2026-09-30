# Plan 15 — Backlog: Interaction Engine

> ScreenForge concept set · Implementation plan · Task backlog (phase 9) · Language: EN
> Phase details: [14-interaction-engine.md](14-interaction-engine.md) · Concept: [../konzept/domain/14-interaction-model.md](../konzept/domain/14-interaction-model.md)
> Status: `todo` / `doing` / `done`. Update the row when the task ships.

## Progress

- Done: I1 workflow schema + additive mission field + reference checks + secret redaction; I2 task registry `ports`/`surface` + `code-entry`/`confirm`; I3 deterministic interpreter (variables, condition, increment, delay, at-most-once, `activeNodeIds`); I4 journaled `workflow.*` events + `interaction` command + role projection + restart replay; I5 workflow graph linter (ports, reachability, infinite loop); I6 pilot surfaces (Device Console, Link, Code Challenge, Diagnostics, Lockout) + station wiring + simulated connect action; I6b `device-link` template + AAR log entries; I7 graph editor `Ablauf` (`@xyflow/react` lazy chunk): node palette, port handles with labeled edges, inspector-based connect path (accessible alternative to dragging), typed node config, variables panel with reference-preserving rename, linter findings mapped to nodes, read-only gate; I8 task catalog: `choice` (dynamic ports from options), `wait-for-event`/`connect` (prop-event driven), `report` (form input journaled to the AAR), `inspect`, `transfer`, manual workflow start from EXCON (`workflow-start` + Live-Steuerung button), prop-change reactions across instances.
- Tests: `src/core/workflow.test.ts`, `src/core/workflowEdit.test.ts`, `src/core/graph.test.ts`, `server/interaction.test.mjs`, `tests/interaction.spec.ts`, `tests/workflow-editor.spec.ts`.
- Open: I9 widget migration, I10 `corporate` rename, I11 physical device integration, I12 XState decision.

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
| I9 | Widget migration (`lock`, `clock`, `rotary`, `code-table`, `data-sheet`, `countdown`) | scenes, `src/core/config.ts` | I7 | old configs migrate; e2e green |
| I10 | `corporate` → `dashboard`/`intranet`/`database` | scenes, catalog, guardrails | I7 | brand only via theme; migrations tested |

## Wave 4 — Field

| ID | Task | File(s) | Depends | Done when |
| --- | --- | --- | --- | --- |
| I11 | Physical device integration (capabilities, transports, sessions, links) | data model, runtime | I9 | transport-agnostic `device.connected` |
| I12 | XState decision point | docs | I6 | decision recorded with evidence |

## Working rules

- Engine changes stay pure and deterministic; never import React or sockets in `src/core/workflow.ts`.
- Project workflow events per role; add a redaction test for every new event type.
- Mark `done` only after the DoD ([08](08-tests-and-dod.md)); update the concept gap analysis.
