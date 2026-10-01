# U11 — Preparation Information Architecture

> ScreenForge concept set · Usability concept · Language: EN, UI labels DE
> Related: [02-guided.md](02-guided.md) · [03-advanced.md](03-advanced.md) · [../domain/15-scenario-capabilities.md](../domain/15-scenario-capabilities.md)

The trainer preparation surface (EXCON, paused exercise) is one shell with a fixed six-section navigation.

## Sections

| # | Section (DE) | Content |
| --- | --- | --- |
| 1 | `"Übersicht"` | status, entry actions (guided setup, template, import), readiness |
| 2 | `"Szenario"` | name, type, capability switches, terrain, zones, objectives, expert mode |
| 3 | `"Teilnehmer"` | teams, participants (operators), actors with their dossier, patients |
| 4 | `"Geräte"` | devices with owner, props, QR provisioning |
| 5 | `"Ablauf"` | workflow graph, event timeline, inspector |
| 6 | `"Prüfen"` | scenario validation, device readiness, briefing, template export, start |

- Ownership is offered only when it can be meaningful (teams or participants exist); otherwise the device is a scenario task by definition. Domain values in the chrome are German (`"Sprengkörper"`, `"Bake"`, `"Datenkern"`, …), never raw enum ids.

## Device workspace (`"Geräte"`)

- The section is **one persistent workspace** ([13-editor-workspace.md](13-editor-workspace.md)): a toolbar (title, `"＋ Gerät hinzufügen"`, the workspace tools `"Aufbau"` / `"Bereitstellen"` / `"Test"`, pane toggles), a structure-only navigator, a dominant live preview, a contextual inspector and a status bar. It is not a page with stacked panels.
- **Navigator = structure only**: the device list and the prop list (`"Requisiten"`). Ownership and configuration live in the inspector; the navigator never repeats per-item property controls.
- **Canvas = work**: the preview renders the shared runtime surface (`DeviceSurface`) with a synthetic, inert sandbox derived from the draft; it never opens the exercise connection ([../../architecture/previews.md](../../architecture/previews.md)). It is the dominant pane; `"Test"` is a focus mode.
- **Inspector = properties of the selection**: a device shows name, type and assignment with an `"Erweitert"` disclosure (role, bindings, runtime/code, look); a prop shows its own fields; a selected preview element shows only that element's property. Names and identity fields are directly editable inline in the preview.
- Preview states `Normal`, `Warnung`, `Kritisch`, `Offline`, `Sicher` are transient and live in a compact control in the preview (not a full-width toolbar). `Warnung`/`Kritisch`/`Sicher` reach the scene renderer as a cue where the surface supports one; `Kritisch`/`Offline` also add editor-only chrome, and console surfaces show the state as chrome only.
- All edits go through the command module; undo/redo covers them.
- `"Bereitstellen"` (QR, address, presence) is a **workspace tool**, not persistent page content. Props are first-class selectable entities in the same workspace, not a form section below it.

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
