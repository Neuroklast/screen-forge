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
