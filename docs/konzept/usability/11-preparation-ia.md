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

- Device cards show the operational fields only; the look/identity fields (`"Darstellung am Gerät"`) are collapsed per device.
- Ownership is offered only when it can be meaningful (teams or participants exist); otherwise the device is a scenario task by definition. Domain values in the chrome are German (`"Sprengkörper"`, `"Bake"`, `"Datenkern"`, …), never raw enum ids.

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

- Five steps: `"Zweck"` (type + template + name), `"Teilnehmer"`, `"Geräte"`, `"Ablauf"`, `"Prüfen"`.
- Creates a valid draft without module, role, binding, id or inject knowledge; advanced settings stay collapsed; `"Im Expertenmodus öffnen"` remains reachable.
- After creation the shell opens on `"Geräte"`; the wizard never remains the editor.

## Expert mode and legacy

- The legacy canvas (MissionBuilder plan view) stays reachable under Szenario → `"Expertenmodus (Legacy)"` for compatibility only.
- It is not part of the normal preparation workflow and gets no further UX investment beyond compatibility fixes.
- Once every capability is editable through the six sections and migrations/tests cover existing scenarios, the legacy preparation view is retired.
- The classic form editor is no longer part of the preparation path.

## Acceptance criteria

- [ ] The preparation navigation contains exactly the six sections.
- [ ] No domain entity or output format has its own top-level item.
- [ ] The flow workspace occupies the majority of the viewport and contains workflows and events.
- [ ] The guided setup produces a startable draft without schema knowledge.
