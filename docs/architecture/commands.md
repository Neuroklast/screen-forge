# Contract — Commands

## Purpose

Every editor mutation goes through a command. Commands give undo/redo, audit, tests, replay and later collaboration for free, and keep side effects at the boundaries.

## Owner

- Graph topology: `src/core/graphEdit.ts` (`addNode`, `removeNode`, `connect`, `disconnect`, `replaceNode`, `setOutputTarget`, `moveNode`); `src/core/workflowEdit.ts` delegates to it.
- Device/scenario edits: `src/training/prepare/devices/commands.ts` (`addDevice`, `removeDevice`, `updateDevice`, `setDeviceOwner`, `setDeviceBinding`, `setPresentation`, `addProp`, `updateProp`, `removeProp`).
- The shell applies the result: `TrainerView.change(nextScenario)` pushes history and clears redo.

## Rules

- Commands are **pure** `Scenario → Scenario` (or `… → { scenario, id }`) functions. No React, sockets, storage or wall-clock timers ([../plan/00-guardrails.md](../plan/00-guardrails.md)).
- No component may write deep into the model directly (`scenario.devices[x].widgets[y].foo = …`). Mutate through the command API.
- A command must preserve referential integrity (e.g. removing a prop clears station bindings that referenced it).
- One user gesture is one command and therefore one undo step.
- Commands are testable without a DOM.

## Allowed dependencies

- `src/core/training.ts` and pure `src/core/*` helpers.
- Existing builders (`buildDevice`, `editPresentation`).

## Forbidden dependencies

- React, DOM, WebSocket, `localStorage`, `Date.now()`.
- Direct mutation of an existing `Scenario` object in place (return a new object).

## Extension points

- Add a command next to the model it owns; add a unit test that asserts the resulting model and referential integrity.

## Known exceptions

- `src/views/TrainerView.tsx` still assembles some live-control patches inline; the preparation editors use commands. The inline live-control edits are allowlisted and must not grow.

## Migration notes

- When a section is migrated to the workspace shell, move its mutations into the command module for that section. Delete the inline patch code.
