# Contract — Previews

## Purpose

The editor preview shows the real result. Preview, runtime and editor use the same renderer for a capability; the editor adds overlays only.

## Owner

- Runtime surface dispatch: `src/training/DeviceSurface.tsx` (one decision point for field and preview).
- Scene rendering: `src/views/StageFrame.tsx` + `src/scenes/Scenes.tsx` (`sceneComponents`).
- Preview sandbox: `src/training/prepare/devices/preview.ts` (`previewTrainingState`, `previewExercise`).

## Rules

- Preview MUST use the same renderer/components as runtime wherever feasible. No separate "fake preview" implementation.
- Preview MUST derive from the model (the draft scenario), never from a duplicated preview model.
- Editor-only overlays are allowed: selection outline, hitboxes/handles, rulers, diagnostics, preview-state chrome.
- The preview sandbox is inert: its `send` is a no-op and it never touches the exercise server, the journal or persisted state.
- Side-effectful leaves (Leaflet map, WebRTC camera) MUST NOT run inside the editor preview; the preview renders their scene surface instead.
- Preview states are transient editor state (`NORMAL`, `WARNING`, `CRITICAL`, `OFFLINE`, `SAFE`). `WARNING`/`SAFE` map to the renderer `Cue` (`warning`/`complete`); `CRITICAL`/`OFFLINE` add editor-only chrome. Preview states are never persisted.
- A new capability ships with a preview path through the shared renderer; a preview-only renderer is forbidden.

## Allowed dependencies

- `src/views/StageFrame.tsx`, `src/scenes/**`, module consoles in `src/training/**`.
- Pure model helpers from `src/core/**`.

## Forbidden dependencies

- A second renderer for a capability that already has one.
- Network, WebSocket, `getUserMedia`, Leaflet tile loading, or persisted writes from a preview.
- Preview state stored in the scenario or sent to the server.

## Extension points

- Add a module's preview by adding it to the shared `DeviceSurface` dispatch; both field and preview get it.
- Declare selectable regions with `data-sf-anchor` on the shared renderer; the editor overlay measures them. Do not duplicate geometry in the editor.

## Known exceptions

- The synthetic preview provider is a bounded exception for authoring: it feeds real components a sandbox state. Keep it typed as `TrainingState`/`ExerciseValue` so drift fails `npm run check`.

## Migration notes

- Extract the field surface dispatch from `ElementView` into `DeviceSurface` before adding preview paths, so both hosts share one branch table.
