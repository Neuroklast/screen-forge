# Catalog — Components: Show Editor (SequenceEditor, ShowGraph, Director, Templates)

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Code: `src/components/SequenceEditor.tsx`, `src/components/ShowGraph.tsx`, `src/core/director.ts`, `src/core/graphEdit.ts`, `src/core/showTemplates.ts`, `src/core/takeLog.ts`

## SequenceEditor (graph workspace)

- Purpose: build and run a `Show` (take graph) for the director.
- Props: `show`, `onChange`, `config`, `onStart`, `running`, `onStop`, `onAdvance`, `onFail`.
- Layout: left palette (scenes, blocks, template, current config), center `ShowGraph`, right inspector, graph findings; the stage preview stays visible while editing.
- Interactions:
  - Palette adds a take and wires it to a terminal; template select loads a full show; `+ Aktuelle Konfiguration`.
  - Graph: drag from a `success`/`fail`/`timeout` port to a target, or pick the target in the inspector (accessible alternative); delete removes the node and all its edges.
  - Inspector: `name`, `scene` (non-destructive look change), `cue`, `osApp` (terminal only), `trigger` (`time|key|pin|signal`), `duration`, `value`, `timeout`, success/fail/timeout targets, `Aktuelle Gestaltung übernehmen`, remove.
  - Import/export: JSON v3, import rejects > 12 MB and invalid JSON without touching the current show.
- Limits: max 60 nodes; the palette disables the add and shows the reason instead of failing silently.

## Graph model

- `Show { version: 3, name, entry, nodes[], edges[] }`; a node is either a `take` (`{id, name, config, cue, operation?, trigger, duration, value, timeout?, position?}`) or an `end` terminal (`director.ts`).
- Ports: `success`, `fail`, `timeout` (the timeout port appears when a timeout is configured). An `end` node has no outputs. One edge per `(source, output)`.
- Topology is edited only through `src/core/graphEdit.ts` (`addNode`, `removeNode`, `connect`, `disconnect`, `replaceNode`, `setOutputTarget`, `moveNode`); training `workflowEdit.ts` delegates to the same API. Removing a node always removes its incoming and outgoing edges.
- `nextStep` / `failStep` / `timeoutStep` follow explicit edges; `triggerMatches(step, time, input?)` gates on `time`, `key`, `pin`, `signal`; `showOrder` gives a linear traversal for demo hosts.
- `lintShow` blocks the start on unreachable nodes and branches without a terminal path. `migrateShow` converts v1/v2 `{steps, next, onFail}` into edges, dropping invalid legacy references.
- `loadShow()` restores from localStorage (migrating older shapes); take log records `ok|fail|timeout` (`takeLog.ts`).

## Show templates (8)

`Activate Locator Beacon`, `Warhead Maintenance`, `Archive Extraction`, `Load Service Image`, `Countermeasure`, `Door Lockdown`, `Medical Emergency`, `Facility Terminal` (`showTemplates.ts`). Each template is a valid graph with a terminal.

## Target state (Soll)

- MUST expose `operation` in the inspector (schema already supports it).
- SHOULD add undo/redo and multi-select to the editor, matching builder expectations ([../../usability/03-advanced.md](../../usability/03-advanced.md)).
- SHOULD support stage targets and a rehearsal flag per show ([../../domain/09-film-tv.md](../../domain/09-film-tv.md)).
- MAY persist shows as `.sfshow.json` in the format family ([../../formats/03-show-theme-profile-formats.md](../../formats/03-show-theme-profile-formats.md)).

## Edge cases

- 60-node cap reached: the palette disables the add and shows the reason.
- Import while a show runs: import is blocked with `"Ablauf aktiv"`.
- Step references a deleted scene id: editor marks it invalid, run skips with a log entry.
- Two tabs editing the same show: last save wins (documented limitation; no merge).

## Acceptance criteria

- [x] Given a deleted take, no other node keeps a dangling `success`/`fail`/`timeout` link.
- [x] Given a branch that never reaches a terminal, `lintShow` reports it and the start is blocked.
- [x] Given a show import/export roundtrip, the graph is preserved.
- [ ] Given an `operation` value in a take, the scene runs the sequence at take start.
- [ ] Given an invalid import, the current show is unchanged and an error toast appears.
