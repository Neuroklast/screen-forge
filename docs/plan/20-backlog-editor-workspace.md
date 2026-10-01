# Backlog — Editor Workspace (Phase 13)

> Working order for [19-editor-workspace.md](19-editor-workspace.md). Tasks have stable ids (`W1`…). Mark `done` with the commit that lands them.

## Governance (commit 1)

| id | Task | Status |
| --- | --- | --- |
| W1 | U13 editor-workspace concept + register in the concept set | done |
| W2 | `docs/architecture/**` contract layer (workspace, editor-state, commands, previews, ownership, terminology, deprecation) | done |
| W3 | `AGENTS.md`, guardrails, DoD, session checklist wiring | done |
| W4 | `scripts/check-architecture.mjs` + `check:arch` + CI step (allowlist, new violations fail) | done |

## Device Builder vertical slice (commit 2)

| id | Task | Status |
| --- | --- | --- |
| W10 | `useExercise`: export `ExerciseValue` + additive `ExerciseValueProvider` | done |
| W11 | `StageFrame`: additive `cue?` / `preview?` props | done |
| W12 | Extract `DeviceSurface` from `ElementView` (one renderer decision point) | done |
| W13 | `preview.ts`: `previewTrainingState` + inert `previewExercise` + unit tests | done |
| W14 | `selection.ts` + `commands.ts` (pure Scenario→Scenario) + unit tests | done |
| W15 | `data-sf-anchor` on `SceneHeader` + console headers; `anchors.ts` registry | done |
| W16 | `WorkspaceShell` + `devices.css` layout | done |
| W17 | `DeviceNavigator`, `DevicePreview`, `DeviceInspector`, `DeviceStatusBar`, `AnchorOverlay` | done |
| W18 | Move `PropsPanel` + `ProvisioningPanel`; rewire `DevicesSection` | done |
| W19 | i18n keys (both dictionaries) | done |
| W20 | Update existing e2e selectors; add `tests/device-builder.spec.ts` | done |
| W21 | Docs: U11 Geräte section, gap analysis, previews deviation | done |

## Device workspace IA refactor (Phase 13)

| id | Task | Status |
| --- | --- | --- |
| W30 | `WorkspaceShell`: toolbar, collapsible panes, focus, overlay drawers <1100px | done |
| W31 | Workspace tools `Build`/`Provision`/`Test`; remove stacked `PropsPanel`/`ProvisioningPanel` from page flow | done |
| W32 | Navigator structure-only (devices + props); remove per-item owner selects | done |
| W33 | Contextual inspector (device / element / prop); ownership moved into the inspector | done |
| W34 | Props as first-class selectable entities; delete `PropsPanel` | done |
| W35 | Dominant preview + compact preview-state control | done |
| W36 | Placement rule documented (U13 §6) | done |

## Device workspace stabilization (Phase 13)

| id | Task | Status |
| --- | --- | --- |
| W40 | Truthful selection: no silent fallback; unbound prop empty/link state; bound prop previews its interface | done |
| W41 | Group prop + bound interface in the navigator; participant-owned station shown as its asset | done |
| W42 | Namespace Device Builder CSS `sf-device-*`; remove the `.device-tools`/`.device-status` collisions | done |
| W43 | Preview-state control moved to the workspace toolbar (outside the runtime) | done |
| W44 | Pane edge handles; one overlay drawer at a time under 1100px; no persistent text toggles | done |
| W45 | Language/terminology/density moved into the header `Einstellungen` popover | done |
| W46 | Status bar shows actionable status only | done |

## App shell simplification (Phase 13)

| id | Task | Status |
| --- | --- | --- |
| W50 | Trainer fixed app viewport: chrome + single scrolling body (U9 updated) | done |
| W51 | `WorkspaceShell` fills its container (`height: 100%`), no viewport arithmetic | done |
| W52 | Workspace pages edge-to-edge (remove the `Panel` wrapper) | done |
| W53 | Panes are the only scroll contexts with a visible scrollbar | done |
| W54 | Phase-based header: undo/redo hidden while running; density summary removed | done |
| W55 | Mission: name/profile/location/objectives; capabilities + raw map behind Advanced; `scenarioCommands` | done |
| W56 | Forces workspace (navigator / roster / inspector) + `forceCommands` | done |
| W57 | Review as a launch gate | done |
| W58 | Add-device catalog: recommended first, rest behind More… | done |
| W59 | Flow workspace on the shared `WorkspaceShell` | done |
| W60 | Derived authoring view (`assetView`) + device profile/surface contract doc | done |
| W61 | Next: device profile+surface migration in `DeviceSurface` | todo |
| W62 | Guided mode as an assistant pane in the shared workspace (interview / graph / suggestions) | done |
| W63 | Next: surface-specific preview scenarios (generic states + per-surface demo scenarios) | todo |
| W64 | Replace the three-tool mini-nav with Edit↔Interact plus a `Geräte verbinden` context action | done |
| W65 | `"Übersicht"` becomes the project/start page; five editor sections (Mission/Forces/Assets/Flow/Review) | done |
| W66 | Extract `deviceSurfaceKind`: the surface is resolved separately from the renderer | done |
| W67 | Preview scenarios: one control, generic states + surface-specific situations | done |
| W68 | Add-device catalog: profile descriptions + hover preview in the canvas | done |
| W69 | Header phase grouping: reset hidden while the exercise runs | done |
| W70 | Stabilize the React Flow test flake (measurable canvas, visibility waits, retries) | done |
| W71 | Mission location set visually on a map (click to place, zones as circles) | done |
| W72 | Persisted `station.surface` + authoring control; runtime states win; unit tests | done |
| W73 | Every element fully configurable: node name + typed enum/reference fields; missing task fields added | done |
| W74 | Document task completion → success/failure port transition (interaction model) | done |
