# Contract — Editor State

## Purpose

The editor renders from one serialisable model. Selection is explicit and single. Transient interaction state never becomes domain state.

## Owner

- The **scenario/device model** is owned by `src/core/training.ts` (`Scenario`, `TrainingStation`, `scenarioSchema`).
- The **draft + undo/redo stack** is owned by the preparation shell (`src/views/TrainerView.tsx`, `change` / `past` / `future`).
- The **selection** is owned by the editor surface that renders it (precedent: `FlowSelection` in `src/training/prepare/flow/types.ts`; device builder: `DeviceSelection` in `src/training/prepare/devices/selection.ts`).

## Rules

- There is exactly one selected object at a time per workspace context.

  ```ts
  type SelectionState = { kind: string; id: string; parentId?: string } | null;
  ```

- The inspector derives entirely from the selection. It holds no property state of its own.
- The preview derives from the actual model (scenario/device/workflow). Do not create `editorModel`, `previewModel` and `runtimeModel` as separate mutable copies.
- **Transient interaction state ≠ persistent domain state.** Dragging, hover, open panels and the active preview state are local/transient; the committed value goes into the model through a command.
- Text fields keep a local value and commit on blur/Enter so one edit is one undo step, not one per keystroke.
- Stable ids: model objects use their persisted `id`; do not index by array position.

## Allowed dependencies

- `src/core/*` pure model helpers and commands.
- React local state for transient interaction only.

## Forbidden dependencies

- Editor-only scenario/device copies kept in parallel to the draft.
- Business rules inside React components (see [ownership.md](ownership.md)).
- Deriving the preview from anything other than the model plus transient editor state.

## Extension points

- Add a selection kind by extending the surface's `SelectionState` union; keep it serialisable.
- Add an undoable edit by routing it through [commands.md](commands.md).

## Known exceptions

- `MissionBuilder` (demo sandbox only) keeps a local `Selection`; it is allowlisted and must not receive new functionality.

## Migration notes

- Replace the duplicated per-editor selection types with one shared shape as each editor migrates. Do not break the field/runtime selection semantics.
