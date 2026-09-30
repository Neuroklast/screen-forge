# Plan 14 — Interaction Engine

> ScreenForge concept set · Implementation plan · Phase 9 · Language: EN, UI labels DE
> Concept: [../konzept/domain/14-interaction-model.md](../konzept/domain/14-interaction-model.md) · [../konzept/domain/08-exercise-runtime.md](../konzept/domain/08-exercise-runtime.md) · [../konzept/domain/11-data-model.md](../konzept/domain/11-data-model.md)
> Backlog: [15-backlog-interaction-engine.md](15-backlog-interaction-engine.md)

## Goal

Turn fixed scenes into data-driven surfaces over tasks and workflows: a deterministic, event-sourced
interaction engine in `src/core`, proven by one complete vertical pilot, before any editor or surface
catalog work. Injects remain the outer-event layer; workflows are the inner interaction logic.

## Architecture rules (normative)

1. `src/core/workflow.ts` is pure and deterministic: no React, no WebSocket, no `Date.now`, no `Math.random`, no `setTimeout`.
2. Workflow state changes only through journaled domain events (`workflow.started`, `workflow.transition.taken`, `workflow.variable.changed`, `workflow.completed`); the interpreter returns effects, it never mutates state directly.
3. Injects (outer events) and workflows (inner logic) stay separate and communicate through events only.
4. `src/core/taskBlocks.ts` is the task registry (schema, UI fields, ports); `src/core/workflow.ts` is the execution engine. Neither duplicates the other.
5. Workflow instance state holds `activeNodeIds: string[]` from the start.
6. One vertical pilot first (connect → code challenge → lockout/diagnostics → objective), then editor and surface catalog.

## Dependencies

- `@xyflow/react` 12 (I7): renders the workflow graph as custom nodes with ports and labeled edges. Reason: the graph is a first-class authoring surface; pan/zoom/hit-testing by hand would be larger and worse. It is lazy-loaded with the `Ablauf` view and is NEVER imported by `src/core` — the engine stays framework-free.
- XState: not adopted (decision I12, see concept [14](../konzept/domain/14-interaction-model.md)); the deterministic interpreter covers the pilot.

## Work packages

| ID | Work package | Size | Files |
| --- | --- | --- | --- |
| I1 | Workflow schema + mission integration (additive `workflows`, reference checks, conservative redaction) | L | new `src/core/workflow.ts`, `src/core/training.ts`, tests |
| I2 | Task registry: ports, `code-entry`, `confirm` | S | `src/core/taskBlocks.ts`, tests |
| I3 | Deterministic interpreter: variables, counters, conditions, delay, ports, at-most-once | L | `src/core/workflow.ts`, tests |
| I4 | Domain events + `interaction` command + projection/redaction + server gate | L | `src/core/events.ts`, `src/core/protocol.ts`, `server/exercise.mjs`, tests |
| I5 | Workflow graph linter (ports, reachability, dead end, cycle cap, timeout/fallback) | M | `src/core/graph.ts`, `src/core/missionLint.ts`, tests |
| I6 | Vertical pilot: Device Console, Link/Connection, Diagnostics surfaces + station wiring | L | `src/scenes/**`, `src/views/StageFrame.tsx`, `src/views/ElementView.tsx`, e2e |
| I7 | Graph editor (`@xyflow/react`, lazy, recorded reason) | XL | `src/builder/MissionBuilder.tsx`, new graph components |
| I8 | Task catalog expansion (`choice`, `wait-for-event`, `report`, `inspect`, `transfer`, `connect`) | L | `src/core/taskBlocks.ts`, surfaces |
| I9 | Surface catalog + widget migration (`lock`, `clock`, `rotary`, `code-table`, `data-sheet`, `countdown`) | XL | `src/scenes/**`, `src/core/config.ts`, migrations |
| I10 | `corporate` → `dashboard`/`intranet`/`database` rename (theme carries the brand) | M | scenes, catalog docs, guardrails |
| I11 | Physical device integration: capabilities, connection types, sessions, links | XL | data model, runtime |
| I12 | XState decision point (only with recorded evidence) | S | docs |

## Order and gates

1. **I1 → I2 → I3** (schema, registry, interpreter) — engine-independent of UI.
2. **I4 → I5** (events, server, linter) — the server is the gate for `play`.
3. **I6** — the vertical pilot; acceptance list below MUST pass end-to-end.
4. **I7** after I6; **I8/I9/I10** after I7; **I11/I12** last.

- No new dependency before I7; `@xyflow/react` needs its recorded reason in this file when added.
- Every increment leaves the app building and all checks green.

## Pilot acceptance

- [ ] `prop` state change starts the workflow; surface shows link → challenge → diagnostics.
- [ ] Wrong code increments the failure counter; 3 failures take the lockout branch; success takes diagnostics.
- [ ] One effect per submission, also when a duplicate command arrives.
- [ ] Server restart replays journal → identical `activeNodeIds`, variables and counters.
- [ ] Client reconnect rebuilds the active surface from server state.
- [ ] Trainer override, pause/resume and timeout behave as specified; interaction while paused is rejected.
- [ ] AAR timeline shows `workflow.*` events.

## Tests

- Unit: schema references, interpreter determinism (replay twice), at-most-once, conditions/counters/delay, redaction of secret variables.
- Server: duplicate `interaction` ×100 → one effect; restart replay; role projections; paused rejection.
- E2E: pilot flow incl. lockout and reconnect.

## Risks

| Risk | Mitigation |
| --- | --- |
| Second state model creeps in | Rules 1–4; interpreter returns effects, reducer applies events |
| Redaction leak (expected codes) | Secret variables + projection tests per new event type |
| Editor drives schema churn | Schema proven by I3/I6 fixtures before I7 |
| Dependency creep | I7 only with recorded reason + lazy load |
| Concept drift | Concept file updated in the same change; gap analysis maintained |

## Docs to update

- Concept: [14](../konzept/domain/14-interaction-model.md), [04](../konzept/domain/04-mission-builder.md), [05](../konzept/domain/05-modules.md), [08](../konzept/domain/08-exercise-runtime.md), [11](../konzept/domain/11-data-model.md), gap analysis.
- Lessons: append for replay/redaction surprises.
