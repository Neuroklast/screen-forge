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
| W10 | `useExercise`: export `ExerciseValue` + additive `ExerciseValueProvider` | todo |
| W11 | `StageFrame`: additive `cue?` / `preview?` props | todo |
| W12 | Extract `DeviceSurface` from `ElementView` (one renderer decision point) | todo |
| W13 | `preview.ts`: `previewTrainingState` + inert `previewExercise` + unit tests | todo |
| W14 | `selection.ts` + `commands.ts` (pure Scenario→Scenario) + unit tests | todo |
| W15 | `data-sf-anchor` on `SceneHeader` + console headers; `anchors.ts` registry | todo |
| W16 | `WorkspaceShell` + `devices.css` layout | todo |
| W17 | `DeviceNavigator`, `DevicePreview`, `DeviceInspector`, `DeviceStatusBar`, `AnchorOverlay` | todo |
| W18 | Move `PropsPanel` + `ProvisioningPanel`; rewire `DevicesSection` | todo |
| W19 | i18n keys (both dictionaries) | todo |
| W20 | Update existing e2e selectors; add `tests/device-builder.spec.ts` | todo |
| W21 | Docs: U11 Geräte section, gap analysis, previews deviation | todo |
