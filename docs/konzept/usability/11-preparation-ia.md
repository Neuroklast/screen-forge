# U11 — Preparation Information Architecture

> ScreenForge concept set · Usability concept · Language: EN, UI labels DE
> Related: [02-guided.md](02-guided.md) · [03-advanced.md](03-advanced.md) · [../domain/15-scenario-capabilities.md](../domain/15-scenario-capabilities.md)

The trainer preparation surface (EXCON, paused exercise) is one shell with a fixed six-section navigation.

## Sections

| # | Section (DE) | Content |
| --- | --- | --- |
| 1 | `"Übersicht"` | status, entry actions (guided setup, template, import), readiness |
| 2 | `"Szenario"` | mission name, scenario profile, location, zones, objectives; capabilities and raw map fields behind Advanced |
| 3 | `"Teilnehmer"` | forces workspace: teams, participants, actors (with dossier), patients |
| 4 | `"Geräte"` | assets workspace: devices, props, interfaces; provisioning as a tool |
| 5 | `"Ablauf"` | flow workspace: workflow graph, event timeline, inspector |
| 6 | `"Prüfen"` | launch gate: blockers/warnings, fix-next, start; briefing and exports secondary |

## Workspace adoption

The three editors share one model ([13-editor-workspace.md](13-editor-workspace.md), [../../architecture/workspace.md](../../architecture/workspace.md)):

- **Mission** (`"Szenario"`): identity, profile, location and objectives; the capability matrix and raw `lat`/`lng`/`zoom`/tile/attribution are expert detail. Edits go through `scenarioCommands`.
- **Forces** (`"Teilnehmer"`): navigator (teams, participants, actors, patients), roster + dossiers in the centre, the selected person/team in the inspector. Edits go through `forceCommands`. A participant's device is shown as its asset, never as the person.
- **Assets** (`"Geräte"`): see the device workspace below.
- **Flow** (`"Ablauf"`): the flow workspace is the second consumer of the shared shell (palette / graph+timeline / inspector).
- **Review** (`"Prüfen"`): a launch gate — blocker/warning counts, one `"Nächsten Punkt beheben"` action and the start button; findings and briefing are secondary detail.

- Ownership is offered only when it can be meaningful (teams or participants exist); otherwise the device is a scenario task by definition. Domain values in the chrome are German (`"Sprengkörper"`, `"Bake"`, `"Datenkern"`, …), never raw enum ids.

## Device workspace (`"Geräte"`)

- The section is **one persistent workspace** ([13-editor-workspace.md](13-editor-workspace.md)): a toolbar (title, `"＋ Gerät hinzufügen"`, the two modes `"Bearbeiten"` / `"Interagieren"`, the `"Geräte verbinden"` action, the preview-state control and the viewport format), a structure-only navigator, a dominant live preview, a contextual inspector and a status bar. It is not a page with stacked panels and it is **edge-to-edge** in the app body (no decorative panel wrapper). The side panes open by default on desktop and collapse via small edge handles; the pane text toggles are gone.
- The trainer is one **fixed app viewport**: header + section tabs + notices are chrome, and a single body region owns the scroll. Undo/redo are hidden while the exercise runs; language, terminology and density live behind the header `"Einstellungen"` popover ([09-layout-contracts.md](09-layout-contracts.md)).
- **Selection is explicit.** On first open the first device is selected; after that, exactly the clicked object drives the canvas. A selected object that no longer exists shows an empty state — never a silent fallback to another device. A bound prop previews its bound interface; an **unbound prop** shows `"Keine Schnittstelle verknüpft"` with `"Vorhandenes Gerät verknüpfen"` / `"Schnittstelle anlegen"`.
- **Navigator = structure only**: the device list and the prop list (`"Requisiten"`). A prop and its bound interface are grouped as one logical thing (prop row + interface child); a participant-owned station is presented as its asset (`"Feldgerät (GPS)"`, `"Zugewiesen: …"`), never as the person. Ownership and configuration live in the inspector; the navigator never repeats per-item property controls.
- **Canvas = work**: the preview renders the shared runtime surface (`DeviceSurface`) with a synthetic, inert sandbox derived from the draft; it never opens the exercise connection ([../../architecture/previews.md](../../architecture/previews.md)). It is the dominant pane; the runtime viewport has a visible frame; `"Test"` is a focus mode.
- **Inspector = properties of the selection**: a device shows name, type and assignment with an `"Erweitert"` disclosure (role, bindings, runtime/code, look); a prop shows its own fields; a selected preview element shows only that element's property. Names and identity fields are directly editable inline in the preview.
- Preview states `Normal`, `Warnung`, `Kritisch`, `Offline`, `Sicher` are transient and live in the **workspace toolbar**, never over the runtime surface. `Warnung`/`Kritisch`/`Sicher` reach the scene renderer as a cue where the surface supports one; `Kritisch`/`Offline` also add editor-only chrome, and console surfaces show the state as chrome only.
- The status bar shows **actionable status only** (validation errors/warnings, unbound props); when there is none it is absent and the preview grows.
- All edits go through the command module; undo/redo covers them. Language, terminology and density live behind the header `"Einstellungen"` (Preferences) control.
- `"Geräte verbinden"` opens provisioning (QR, address, presence) over the canvas as a context action, not persistent page content and not a third mode. Props are first-class selectable entities in the same workspace, not a form section below it.

**Hard rule:** No new top-level preparation navigation item may be introduced for a domain entity, implementation concept or output format. New functionality MUST fit one of the six sections; if it does not, reconsider the information architecture before adding navigation.

- While the exercise runs, the preparation sections are hidden and only live control is shown.
- The guided setup is an action in Übersicht/Szenario, never a navigation item.
- Dossiers are never a top-level item: they nest under the person (actor/participant) that owns them.

## Flow workspace

- One visual workspace: workflow nodes form the connected scenario logic graph; timed, zone and manual events live on the timeline lane and show the workflow they start (derived from prop actions, never stored).
- The palette groups are `"Ablauf"` (the logic blocks) and `"Auslöser"` (events), with `"Weitere Bausteine"` collapsed; the active flow is a compact selector at the top, not a palette segment.
- The palette uses human concepts: `"Start"`, `"Aktion"`, `"Entscheidung"`, `"Auf Ereignis warten"`, `"Meldung"`, `"Zustand ändern"`, `"Ziel abschließen"`, `"Ende"`; technical node and task types stay the storage format.
- Outputs and edge labels are human too: `"Weiter"`, `"Erfolg"`, `"Fehlschlag"`, `"Ja"`, `"Nein"`; dynamic ports (choice options) keep their configured id.
- The event editor leads with a derived sentence (`"Wenn Zeitpunkt 3:00 → sende Meldung … → startet „Ablauf“"`); trigger configuration and actions follow below.
- Selecting an event brings its workflow to the canvas and highlights the entry node, so the event-to-flow connection is visible, not only textual.
- The inspector shows workflow settings (name, trigger, `"Ablauf löschen"`) when nothing is selected, node settings when a node is selected, and event settings when an event is selected — one owner per selection.
- Findings stay contextual: the selected workflow plus the selected event. The `"Prüfen"` section owns the global picture.
- `"Weitere Bausteine"` (wait time, show surface, counter, prop state) and `"Rohdaten"` (raw MEL list, workflow variables) are collapsed.
- The user never needs to understand the inject/workflow split for normal authoring; the architecture distinction stays internal and appears only in `"Rohdaten"` for experts.
- The workspace occupies the majority of the viewport: palette left, graph center with the event timeline below, inspector right.

## Guided setup

- The guided surface is an **assistant pane in the shared workspace** ([13-editor-workspace.md](13-editor-workspace.md)): the interview is the navigator, the live workflow graph is the canvas, and the suggestions/reconciliation are the inspector. It builds exactly what the normal editor shows, so `"Guided → Expert"` is no longer a mental jump.
- Adaptive interview, not a fixed step sequence: questions are selected from the scenario intent and derived facts; a template or a blank scenario can be the entry ([02-guided.md](02-guided.md)).
- Interview and the real workflow graph are visible together; suggestions are accepted, modified or skipped, and the user can switch to direct graph editing at any time (`"Im Expertenmodus öffnen"`).
- Creates a valid draft without module, role, binding, id or inject knowledge; advanced settings stay collapsed.
- Changing an earlier answer reconciles generated content; user-created or user-modified content is never deleted silently.
- After creation the shell opens on the first incomplete section, or `"Prüfen"` when the draft is complete — never blindly on `"Geräte"`; the guided surface never remains the editor.

## Navigation state

- Preparation navigation is an explicit `PreparationLocation { section, guidedStep?, returnTo?, focus? }`, mirrored in the URL (`?section=…&guided=…`), not a set of local booleans.
- Close, Cancel, Back, browser Back and Reload have deterministic behavior; guided setup is a state inside a section and can never trap the user.
- Readiness is one model: every section reports `complete / warning / blocking`; `"Übersicht"` derives the next recommended action from it, and review findings carry a target `{ section, entity/node, field }`.

## Expert mode and legacy

- The legacy preparation canvas (`MissionBuilder` plan view) is **removed from preparation**. Every capability is editable through the six sections (undo/redo, ordnance type and device bindings included); there is no second way to edit scenario topology.
- `MissionBuilder` survives only as the **demo sandbox builder** (`/?demo=1` → Sandbox), which is an offline showcase, not a preparation surface.
- The classic form editor is no longer part of the preparation path.

## Acceptance criteria

- [ ] The preparation navigation contains exactly the six sections.
- [ ] No domain entity or output format has its own top-level item.
- [ ] The flow workspace occupies the majority of the viewport and contains workflows and events.
- [ ] The guided setup produces a startable draft without schema knowledge.
