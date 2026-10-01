# U13 — Editor Workspace Principles

> ScreenForge concept set · Usability concept (target state) · Language: EN, UI labels DE
> Binding for every authoring surface (preparation, flow, device builder, guided, COP, AAR, studio, film).
> Related: [00-principles.md](00-principles.md) · [11-preparation-ia.md](11-preparation-ia.md) · [09-layout-contracts.md](09-layout-contracts.md) · [../../architecture/workspace.md](../../architecture/workspace.md)

ScreenForge editors behave like interactive creative tools, not administration forms.

> **Leitsatz 1.** Prefer direct manipulation, live preview, contextual inspectors, smart defaults and reversible actions over forms, modals, long settings pages and manual configuration.
>
> **Leitsatz 2.** If the user must scroll through a long form to understand what they are building, the UI architecture is wrong.

## 1. Interaction model

- **Direct manipulation before form entry.** The user selects, moves, connects, activates and configures objects directly. Every relevant change is visible immediately; a separate "Preview" step is never required.
- **Live preview is standard, not an extra.** Every display, device, panel, scene and interface has its own preview, permanently visible in the workspace rather than hidden in a modal.
- **WYSIWYG where it matters.** The preview uses the same renderer as the runtime. There is no abstract configuration that is translated into something visual only later.
- **Selection is king.** Exactly one explicit `SelectionState` exists per workspace context. The inspector derives entirely from it; there are no competing editor states.
- **Contextual inspector, not a global settings page.** The inspector shows only the properties of the selected object. Selecting a display shows display settings; selecting a gauge shows gauge settings.
- **Inline editing.** Names, labels, values and simple properties are edited where they appear (double-click / focus). No "Edit device" modal for a small change.
- **Keyboard-first in addition to mouse-first.** Everything important is reachable by keyboard (add, duplicate, delete, undo, redo, search, focus, zoom). Drag & drop is an accelerator, never the only path.
- **No modals as primary navigation.** Modals only for confirmation or a short focused task; never for ordinary configuration.
- **Fake-OS as interaction model, not decoration.** Docked panels, tabs, split panes, a persistent workspace, a status bar and context menus are welcome. Desktop icons as primary navigation, a start menu, a fake taskbar or retro OS cosplay are not.

## 2. Starting points

- **Preset-first, not blank-first.** Start from a credible configuration (preset, template, variant). The user gets a usable result before changing anything.
- **Smart defaults and auto-configuration.** Selecting a type provisions its sensible subsystems (e.g. an `antimatter` device gets a touch panel, a power resource, a containment status and matching metrics). The user only changes deviations.
- **Templates and variants instead of a thousand options.** Offer high-quality variants (`Lab prototype`, `Military field unit`, `Industrial`, `Minimal`, `Damaged`, `High security`) and refine afterwards.
- **One-click sensible creation.** Creating an object yields something usable immediately: click a type → the object exists with good defaults and is selected.
- **Productive empty states.** Never "Nothing here". Empty states name the next meaningful action ("Add display", "Choose preset", "Start from …").
- **Progressive disclosure.** Show the 20% that 80% of users need; reveal advanced options when they become relevant. Powerful, not stuffed.

## 3. Feedback and safety

- **Optimistic UI.** Render changes immediately; saving and validation run in the background; errors are marked afterwards.
- **Undo/redo is a base function.** Dragging, deleting, switching a preset, changing state or connections are all reversible. This is a precondition for direct manipulation, not a comfort feature.
- **Preview states.** An interface is previewable beyond its normal state: at minimum `NORMAL`, `WARNING`, `CRITICAL`, `OFFLINE`, `SAFE`.
- **Interaction preview.** The preview is interactive in a sandbox: buttons press, sliders move, resources change, states simulate. It behaves like the runtime without touching real exercise state.
- **No hidden magic.** Automation is always explainable ("Power gauge added because this device has a power resource").
- **No destructive automation.** Changing a preset or type never silently destroys manual edits. Differences are shown; keep/replace is offered.
- **Visual hierarchy instead of more text.** Convey status through colour, shape, icon and position. Help appears contextually or on hover.

## 4. Structure

- **Fixed three-pane workspace.** Navigator/structure on the left, canvas/preview in the centre, contextual inspector on the right, optional status bar below. The inspector content changes with the selection.
- **No long vertical forms.** If building requires constant scrolling, the information architecture is wrong.
- **Canvas-first for spatial, logical or visual things.** Workflows become graphs, device surfaces become visual layouts, scenarios become a structured visual builder. Forms support; they are not the main metaphor.
- **Responsive workspace, not responsive chaos.** Desktop keeps a stable multi-pane structure. Small screens may switch or drawer panels, but the workspace must not collapse into a long vertical stack.

## 5. Model and performance

- **One model.** Editor, preview and runtime render from the same serialisable model. No hidden React state that exists only in the editor. Undo/redo, preview, persistence and tests all depend on this.
- **Commands are the only write path.** Every mutation is an action (`AddWidget`, `MoveWidget`, `ChangeResource`, `ApplyPreset`, `ConnectNodes`). No component writes deep into the model directly.
- **Transient interaction state is not domain state.** Dragging may use local transient state; on drop a single command commits to the model, so one gesture is one undo step.
- **One implementation per capability.** Editor and runtime share the same `ResourceGauge`, `Timer`, `StatusPanel`, `MetricGrid`; they differ only by mode. A second renderer for convenience is forbidden.
- **Performance by design.** Stable ids, fine-grained selectors, memoisation where it matters, virtualised large lists; a local property change must not re-render the whole workspace.

## Acceptance criteria

- [ ] No authoring surface is a single long scrolling form as its primary interaction model.
- [ ] Every editor preview uses the runtime renderer for the same capability.
- [ ] Exactly one selection drives the inspector per workspace context.
- [ ] Every mutation is reversible through undo/redo.
- [ ] Every preview exposes the five preview states, and `WARNING`/`SAFE` reach the renderer as a cue.
- [ ] Creating an object yields a usable default in one click.
- [ ] No modal is required for ordinary editing.
