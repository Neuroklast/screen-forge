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

**Hard rule:** No new top-level preparation navigation item may be introduced for a domain entity, implementation concept or output format. New functionality MUST fit one of the six sections; if it does not, reconsider the information architecture before adding navigation.

- While the exercise runs, the preparation sections are hidden and only live control is shown.
- The guided setup is an action in Übersicht/Szenario, never a navigation item.
- Dossiers are never a top-level item: they nest under the person (actor/participant) that owns them.

## Flow workspace

- One visual workspace: workflow nodes form the connected scenario logic graph; timed, zone and manual events live on the timeline lane and show the workflow they start (derived from prop actions, never stored).
- The palette uses human concepts: `"Start"`, `"Aktion"`, `"Entscheidung"`, `"Auf Ereignis warten"`, `"Meldung"`, `"Zustand ändern"`, `"Ziel abschließen"`, `"Ende"`; technical node and task types stay the storage format.
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
