# 14 — Interaction Model

> ScreenForge concept set · Target state (Soll) · Status: [12-gap-analysis.md](12-gap-analysis.md)
> Runtime: [08-exercise-runtime.md](08-exercise-runtime.md). Data: [11-data-model.md](11-data-model.md). Builder: [04-mission-builder.md](04-mission-builder.md).

## Purpose

Tasks and workflows are the interaction layer between mission data and surfaces: a **surface** shows, a **task** asks, a **workflow** decides. Injects stay the outer-event layer (EXCON/world); workflows are the inner interaction logic. Both communicate only through events.

## Layers

| Layer | Question | Implementation |
| --- | --- | --- |
| Physical world | What exists? | Station, Prop, Patient, Zone, Objective, … ([06-entities-and-props.md](06-entities-and-props.md)) |
| Connections | How is it linked? | Deferred: capabilities, transports, sessions (not before Phase 6) |
| Surfaces | What is visible? | Full-screen station views, data-driven from config + workflow state |
| Tasks | What must be done? | Task registry (`src/core/taskBlocks.ts`): type, schema, UI fields, ports |
| Logic | What follows? | Workflow graph (`src/core/workflow.ts`): nodes, edges, variables |

- One implementation per capability: `CodeEntry`, `Timer`, `FileBrowser`, `MessageViewer` are components used inside the OS **or** inside a standalone surface — never two implementations.
- Surfaces and widgets are element content: English labels, `EXERCISE` mark. Task registry UI labels are studio/training chrome: German.

## Workflow model

```text
Workflow { id, version, trigger, entry, nodes[], edges[], variables[] }
Node     { id, name?, type, config }
Edge     { id, source, output, target }
```

| Node type | Outputs | Config |
| --- | --- | --- |
| `start` | `out` | — |
| `end` | — | `outcome`: `success` / `failure` |
| `task` | task ports (default `success`, `failure`) | `task` (registry id) + registry config |
| `condition` | `true`, `false` | `variable`, `operator` (`==`, `!=`, `<`, `<=`, `>`, `>=`), `value` |
| `set-variable` | `out` | `variable`, `value` |
| `increment` | `out` | `variable`, `by` |
| `delay` | `out` | `seconds` (exercise clock) |
| `show-surface` | `out` | `station`, `surface` |
| `set-prop-state` | `out` | `prop`, `state` |
| `complete-objective` | `out` | `objective` |

- Task types: `code-entry` (`expectedValueRef`, `maxAttempts`, `inputLength`, `maskInput`), `confirm`, `choice` (ports derived from its options), `wait-for-event` and `connect` (complete on a prop state), `report` (form; the submitted input is journaled for the AAR), `inspect`, `transfer`.
- Variables are typed (`boolean`, `number`, `string`, `enum`) with an initial value; `secret: true` marks values that are redacted from players.
- Conditions are typed `condition` nodes. Free-form expressions are NEVER allowed — they break validation, replay, redaction and the editor.
- `end` carries the outcome; there are no separate success/failure node types.
- A node MAY carry `position` for the editor layout; the interpreter ignores it.

## Execution (normative)

- The interpreter is pure and deterministic (`evaluateWorkflow` / `advanceWorkflow` in `src/core/workflow.ts`): no React, no WebSocket, no `Date.now`, no `Math.random`, no `setTimeout`. Inputs: workflow definition, instance state, domain event, scenario, exercise clock.
- State changes ONLY through journaled domain events: `workflow.started`, `workflow.transition.taken`, `workflow.variable.changed`, `workflow.completed`.
- Server-authoritative: clients submit an `interaction` command; the server validates the active node and appends events. A duplicate command has exactly one effect.
- Manual workflows start from the exercise control surface (`workflow-start`); prop workflows start on the prop change. Prop changes also advance waiting tasks across running instances.
- Workflow state holds `activeNodeIds: string[]`; parallel branches are prepared, not required.
- Delay/timeout use the exercise clock; pause freezes them; restart replays them from the journal.
- A command for a node that is no longer active is rejected, never applied late.
- Failure philosophy: a wrong input yields a new state (retry, counter, lockout, fallback), never a game-over.
- A completed workflow is observable: injects MAY trigger on workflow events, workflows MAY react to inject and prop events.

## Injects vs. workflows

| | Inject | Workflow |
| --- | --- | --- |
| Trigger | timer, zone, intervention, prop, signal, manual | workflow `trigger` (`manual`, `prop`) |
| Logic | actions on state | nodes, edges, variables |
| Owner | EXCON / world | player interaction |
| Coupling | events only | events only |

## Redaction

- Workflow definitions MAY contain secrets (expected values, hidden branches). Non-EXCON clients receive only what the active task needs; secret variable values are NEVER projected.
- The linter and the server start gate MUST reject a mission whose workflow references unknown tasks, variables, ports, props, stations or objectives.

## Edge cases

- Interaction while `paused` or `frozen`: rejected with `"Übung pausiert"`; no state change.
- Player submits input for a stale node (race after transition): rejected; the surface re-renders from server state.
- Workflow references a prop/station deleted during editing: linter error; start blocked.
- Two workflows trigger on the same prop state: both start (instances are independent); the linter warns about ambiguity.

## Acceptance criteria

- [ ] Given a code task, when the player submits three wrong codes, then the failure counter reaches the cap and the lockout branch is taken — exactly one effect per submission.
- [ ] Given a server restart mid-workflow, when the journal replays, then `activeNodeIds` and variables are identical to the pre-restart state.
- [ ] Given a secret variable, when a player requests state, then its value is absent from the projection.
- [ ] Given a node output that no node type defines, when the mission is linted, then the mission cannot start.
- [ ] Given `paused`, when a player submits an interaction, then it is rejected and the log records no transition.
