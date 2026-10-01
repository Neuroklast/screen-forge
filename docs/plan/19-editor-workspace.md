# Plan 19 — Editor Workspace (Phase 13)

> ScreenForge concept set · Implementation plan (target state) · Language: EN, UI labels DE
> Related: [README.md](README.md) · [../konzept/usability/13-editor-workspace.md](../konzept/usability/13-editor-workspace.md) · [../architecture/README.md](../architecture/README.md) · [20-backlog-editor-workspace.md](20-backlog-editor-workspace.md)

## Outcome

Every major editor runs on one shared workspace shell (navigator / canvas-or-live-preview / contextual inspector / status bar), mutations go through commands, and previews use the runtime renderer. The first slice — the Device Builder — proves the architecture before the pattern is copied.

## Why now

Authoring has drifted into section pages and long vertical forms; selection and preview state are duplicated per editor; there is no shared shell, command layer or preview contract. The rules are codified in [../architecture/](../architecture/README.md) and enforced by `npm run check:arch`.

## Scope

- Governance and contracts: U13, `docs/architecture/**`, `AGENTS.md`, guardrails/DoD, `scripts/check-architecture.mjs`, CI.
- First vertical slice: **Device Builder** (preparation → `"Geräte"`), replacing the long-form `DevicesSection`.
- Pattern adoption in Flow, Guided, COP, AAR, Film is **out of scope** for this phase; those surfaces adopt the shell when they are next touched.

## Acceptance criteria

- [ ] U13 and the architecture contracts exist and are routed from `AGENTS.md`.
- [ ] `npm run check:arch` fails on a new workspace shell, graph implementation, preview-only renderer, business rule in React, direct domain mutation outside commands, deprecated-path import, or hardcoded migrated terminology; allowlisted existing debt only shrinks.
- [ ] The Device Builder is a fixed workspace: navigator (presets + device list), live runtime-backed preview, contextual inspector, status bar.
- [ ] The preview derives from the draft and reuses the runtime renderer (`DeviceSurface`); no preview-only renderer; no duplicated preview state.
- [ ] Preview states `NORMAL`, `WARNING`, `CRITICAL`, `OFFLINE`, `SAFE` are switchable; `WARNING`/`SAFE` reach the renderer as a cue; states are transient.
- [ ] Clicking an element in the preview selects it; the inspector shows only that element's properties; at least one element is directly editable inline.
- [ ] All device mutations go through `devices/commands.ts`; undo/redo (buttons + Ctrl+Z/Y) covers them.
- [ ] No modal is required for ordinary editing; no long scrolling form remains for devices.
- [ ] Props and provisioning survive as secondary panels; no capability is lost.
- [ ] Existing preparation/journey/training e2e flows pass with minimal selector updates; new unit + e2e tests cover the slice.

## Deviations to record

- A synthetic, inert preview exercise provider feeds the real module components in the editor (preview sandbox). Recorded in [../architecture/previews.md](../architecture/previews.md).
- Selectable preview elements use `data-sf-anchor` on the shared renderer plus a measured editor overlay. Recorded in [../architecture/previews.md](../architecture/previews.md).

## Out of scope

- Generic docking framework; migrating other editors; schema/migration/server/protocol changes; new dependencies.
