# Contract — Ownership

## Purpose

Each responsibility has exactly one owner. This is the anti-drift rule that keeps the product coherent across many editors.

## Owner matrix

| Responsibility | Owner |
| --- | --- |
| Rendering capability | one component (e.g. `src/components/Timer.tsx`, `src/components/CodeEntry.tsx`) |
| Domain concept | one schema (`src/core/training.ts`, `src/core/workflow.ts`) |
| Mutation | one command path ([commands.md](commands.md)) |
| Validation | one validator owner (`src/core/missionLint.ts`, `scenarioSchema`) |
| Terminology | one semantic dictionary ([terminology.md](terminology.md)) |
| Graph editing | one graph mutation API (`src/core/graphEdit.ts`) |
| Workspace layout | one shared workspace system ([workspace.md](workspace.md)) |
| Preview | the runtime renderer ([previews.md](previews.md)) |
| Event/command transport | `src/core/protocol.ts` + `src/core/events.ts` |

## Rules

- Do not create a second implementation of a capability because "this one looks a bit different". Variation belongs in props/profiles of the same capability, or in a clearly separate component with different semantics.
- Do not fork behaviour for convenience. Extend the shared abstraction only when the semantic capability is genuinely the same; create a new abstraction only when the domain concept is genuinely different.
- Every new abstraction must either replace duplication or establish a reusable product primitive. If it does neither, do not add it.
- No business rules inside React components. Components render; pure `src/core` code decides.
- Pure first, side effects at the boundaries:

  ```text
  src/core/         pure domain logic (no React, no sockets, no wall clock)
  src/application/  commands / use-cases (where present)
  src/ui, src/views rendering
  server/, src/core/outbox.ts, sockets  infrastructure
  ```

## Allowed dependencies

- Layers may depend downward only: `ui/views → application → core`; infrastructure may depend on core, never the reverse.

## Forbidden dependencies

- `src/core/**` importing React, DOM, sockets or i18n UI bindings.
- Editor UI importing server internals.
- A duplicate component for a capability that already has an owner.

## Extension points

- Promote a local pattern to an owner only after it repeats in a second editor; then migrate both.

## Known exceptions

- `src/views/TrainerView.tsx` contains some inline live-control edits; allowlisted, must not grow.
- `MissionBuilder` is the demo sandbox and is frozen (no new functionality).

## Migration notes

- Component size: prefer small pure functions. A React component above ~250–300 LOC should justify in the PR why cohesion beats splitting. The concern is **mixed responsibilities**, not a line count.
