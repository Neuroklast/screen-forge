# Catalog — Analysis Table (Analysetisch)

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Scene id `hologram` · Default in-world title `AEON` (company: AEON Spatial) · Code: `src/scenes/shared/LiveScenes.tsx:319-461`, `shared/SpatialAssembly.tsx` (109), `shared/ModelViewport.tsx` (128), `shared/spatial.ts`
> Used in: Film (scene `hologram`), Training (via `StageFrame`, module `hologram`, signal `analysis.complete`)

## Naming (concept clarification)

- The scene is the **analysis table** (German UI name `Analysetisch`); `AEON` is its default in-world title, i.e. the brand of the company AEON Spatial.
- Companies are identities, not scenes ([../20-companies-and-brands.md](../20-companies-and-brands.md)); any of the 14 companies MAY be applied to this scene via SystemProfiles.

## Purpose

The analysis table is the spatial reconstruction lab: a depth-sorted holographic assembly (or a real GLTF model) with three analysis channels. It gives film productions a believable "3D analysis table" and training an analysis station.

## Analysis channels

| Tab | Run result (16 s / 4 phases) | Reference readout |
| --- | --- | --- |
| `Geometry` | layer/composite report | `07 layers / 03 composites` |
| `Materials` | material consistency report | composite counts |
| `Integrity` | structural integrity report | `98.4 %` |

- `Run analysis` / `Repeat analysis` starts the process; `ProcessReadout` shows phases and allows cancel/dismiss (`LiveScenes.tsx:365-387`, `Process.tsx:67-111`).
- `cue === "warning"` marks readouts as degraded.

## Component tree

| Area | Elements | Code |
| --- | --- | --- |
| Header | `SceneHeader` | `:329-338` |
| Left aside | object label, 3 tabs, run button, hint | `:340-389` |
| Center | `GestureSurface` → `ModelViewport` (GLB/GLTF from `mediaIds`) or `SpatialAssembly` (7 projected layers, depth-sorted, scan plane) | `:391` |
| Right readout | selection live view, big number, `Wave`, `ProcessReadout` | `:408-453` |
| Footer | scene label | `:455-458` |

## Data, config, assets

- `SpatialAssembly`: procedural 7-layer projection with depth sort, scan plane sweep, mode-dependent fills (`SpatialAssembly.tsx:11-107`).
- `ModelViewport`: three.js GLTF viewport with accent rim light, auto-fit, placeholder icosahedron when no model, rotation from scene time (`ModelViewport.tsx:28-120`).
- Config: `mediaIds` (first model asset wins), `accent`, `seed` (Wave), `cue`.
- Assets: inline SVG by default; GLB/GLTF via IndexedDB media store (see [../components/15-media-pipeline.md](../components/15-media-pipeline.md)).
- Training: module-event button reports `analysis.complete` (`ElementView.tsx:103-122`).

## Target state (Soll)

- MUST keep the procedural fallback: no model file may ever leave the scene blank.
- SHOULD allow per-analysis target selection (assembly vs uploaded model) in the inspector.
- SHOULD map analysis runs to training objectives (`analysis.complete` value = analysis id) and to mission injects.
- MAY add measurement annotations (points, distances) as a director-only overlay.

## Rework V2 (Soll)

- MUST produce a real outcome: each run ends in a visible result, not just a pattern.
- SHOULD support modes: `decrypt` (ciphertext resolves into plaintext step by step), `data` (correlation with findings/anomaly list), `reconstruct` (assembly result).
- MUST be configurable via `sceneOptions.analysis` (mode, input text/cipher, result text, key/code).
- SHOULD emit `analysis.complete` with mode and result id for training.

## Edge cases

- Model fails to load (corrupt GLB): placeholder + notice, scene remains interactive.
- Model larger than 12 MB: rejected at upload; inspector explains the limit.
- Analysis cancelled mid-run: phases stop, timeline extension stays reserved (no shrink).
- Gestures while a process runs: allowed; the process is time-based, not input-based.

## Acceptance criteria

- [ ] Given no model in media, the procedural assembly renders and animates with scene time.
- [ ] Given a valid GLB, the viewport renders it with the accent rim light and gesture control.
- [ ] Given `Run analysis`, the process completes in 16 s and extends the timeline.
- [ ] Given training mode, the report button emits `analysis.complete` exactly once per run.
