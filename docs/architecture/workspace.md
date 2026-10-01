# Contract — Workspace

## Purpose

ScreenForge authoring is **workspace-based, not page-based**. Every major editor uses one persistent shell:

```text
┌──────────────┬──────────────────────────────┬────────────────────┐
│ Navigator    │  Canvas / live preview       │ Inspector          │
├──────────────┴──────────────────────────────┴────────────────────┤
│ Status bar                                                        │
└──────────────────────────────────────────────────────────────────┘
```

- Navigator / structure on the left.
- Primary canvas or preview in the centre.
- Contextual inspector on the right.
- Optional bottom status/timeline area.
- Secondary tools (preview, datasheet, logs, simulator, help) may appear as docked or floating panels.

Product principles: [../konzept/usability/13-editor-workspace.md](../konzept/usability/13-editor-workspace.md). Section IA: [../konzept/usability/11-preparation-ia.md](../konzept/usability/11-preparation-ia.md).

## Owner

`src/ui/WorkspaceShell.tsx` owns the pane structure. `src/training/prepare/devices/devices.css` owns the device-builder layout.

## Allowed dependencies

- `src/ui/primitives.tsx` (`Panel`, `Button`, `Tabs`, `Status`, `EmptyState`).
- Design tokens (`src/tokens.css`, `src/layout.css`, `--sf-z-*`).
- Feature components passed in as `navigator`, `canvas`, `inspector`, `status` props.

## Forbidden dependencies

- A second workspace shell, dock framework or window manager outside `src/ui/WorkspaceShell.tsx`.
- `flex-wrap` scene/editor layouts; raw `z-index` ≥ 10; visible scrollbars (layout contract U9).
- `position: fixed` floating windows as the primary editing surface.
- Desktop icons, a start menu or a fake taskbar (decoration, not interaction).

## Extension points

- Add a pane by extending `WorkspaceShell` props; add a secondary tool as a panel, not a new page.
- Adopt `WorkspaceShell` in Flow, Guided, COP, AAR and Film when those surfaces are touched; do not refactor them speculatively.

## Known exceptions

- The film studio (`src/App.tsx`) and the flow workspace (`src/training/prepare/FlowSection.tsx`) still use their own grid. They are allowlisted in `scripts/check-architecture.mjs` until migrated.
- The operator field shell (`src/views/ElementView.tsx`) is a viewport prison, not an authoring workspace; U9 governs it.

## Migration notes

- Vertical slice first: one complete editor (the Device Builder) proves the shell before the pattern is copied.
- Do not build a generic docking framework up front. Build the primitives the current editor needs; abstract only when Flow/Guided/COP show the same pattern repeats.
