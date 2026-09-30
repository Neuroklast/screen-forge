# 04 — Mission Builder

> ScreenForge concept set · Target state (Soll) · Status: [12-gap-analysis.md](12-gap-analysis.md)
> Interaction details: [../usability/04-builder-interaction.md](../usability/04-builder-interaction.md). Modules: [05-modules.md](05-modules.md).

## Purpose

The builder composes a **mission** ("Einsatz") from devices, entities, and injects by **drag & drop**. It replaces the form-first editor as the primary authoring surface. Templates are optional starting points, never cages.

## Model in one sentence

`Mission = stations[1..n] + entities[0..n] + injects[0..n] + map + teams`, validated live, versioned on save.

## Builder surfaces

| Surface | Purpose | Contents |
| --- | --- | --- |
| Palette (left) | Sources to drag | Modules, Entities, Injects, Tasks, Teams |
| Board (center) | Composition | Device cards, entity chips, connection lines, linter badge |
| Inspector (right) | Precise values | Selected item fields; multi-select summary |
| Views | Board | `Plan` (cards), `Karte` (map with zones/routes), `Ablauf` (workflow graph editor) |

- Palette groups MUST be collapsible and searchable.
- Board MUST support mouse and touch drag & drop; every drag action has a button-based alternative ([usability/04](../usability/04-builder-interaction.md)).
- Inspector edits MUST be immediate; no "Apply" button for scalar fields.
- A station inspector MAY bind a **presentation** (`presentation.scene` + `presentation.config`): the look and identity pushed to the field device. Edits bump `presentation.revision` so the device remounts; the preset excludes uploaded media and brand logos ([11-data-model.md](11-data-model.md)).

## Composition rules

- **Devices 1..n:** a mission MUST allow 0 devices while building and MUST block `"Übung starten"` with fewer than 1.
- **Entities 0..n:** patients, props, dossiers, zones, objectives, teams, actors are all optional. A mission without any entity is valid.
- **No forced bindings:** dropping a module NEVER auto-creates a patient/prop. If a module needs a binding, the linter flags it (error), and the inspector offers `"Fehlende Entität anlegen"` as one click.
- **Module ↔ station:** exactly one module per station in v2. Changing the module keeps the station identity and clears incompatible fields.
- **Entity ↔ station bindings:** drag an entity chip onto a station card to bind (medical→patient, ordnance→ordnance prop, terminal→payload/objective). Unbind via inspector or drag-out.
- **Teams:** optional; when used, stations and players inherit team color/label; objectives MAY be team-scoped.
- **Zones/objectives:** drawn/placed on `Karte`; zones are circles; objectives have an auto success condition (inject action) or manual completion.
- **Tasks/workflows:** tasks are dropped into a workflow graph ([14-interaction-model.md](14-interaction-model.md)); a workflow is optional mission data and MUST NOT be required to start. Editing a workflow follows the same phase gate and revision rules as any mission edit.

## Defaults (MUST NOT force content)

| Action | Old behavior (drift) | Required behavior |
| --- | --- | --- |
| Add station | Module `medical`, patient bound | Module `terminal` (neutral), no binding |
| New mission | SAR template incl. patient | Empty mission, 0 stations, 0 entities |
| Wizard template | Fixed stations + patient + 3 dossiers | Editable suggestions, removable; patient only where the template's story needs it |
| Medical module without patient | Schema error at drop | Allowed to drop; linter error until a patient is bound or created |

## Validation (linter)

Severities: `error` blocks start, `warning` recommends, `info` explains.

| Check | Severity | Message (DE) |
| --- | --- | --- |
| < 1 station | error | `"Mindestens ein Gerät erforderlich."` |
| Medical station without patient | error | `"Modul Medizin benötigt einen Patienten."` |
| Ordnance module without ordnance prop | error | `"Modul Sprengkörper benötigt einen Sprengkörper."` |
| Beacon module without beacon prop | error | `"Modul Bake benötigt eine Bake."` |
| HQ station without tracking | error | `"Einsatzleitung benötigt das Modul Karte."` |
| Terminal/access without code | error | `"Terminal benötigt einen Zugangscode."` |
| Inject without action | error | `"Ereignis ohne Wirkung."` |
| Zone/objective without coordinates | error | `"Zone außerhalb der Karte."` |
| No objective | warning | `"Kein Einsatzziel definiert."` |
| Duration > 2 h | warning | `"Übungsdauer prüfen."` |
| Unused entity | info | `"Entität ist keinem Gerät zugewiesen."` |
| > 40 stations | error | schema cap |
| Inject unreachable | error | `"Ereignis nicht erreichbar."` |
| Action on incompatible entity | error | `"Wirkung passt nicht zur Entität."` |
| Dependency cycle without repeat rule | error | `"Zyklus ohne Wiederholungsregel."` |
| Repeat without cap | error | `"Wiederholung ohne Obergrenze."` |
| Unknown task type in a workflow | error | `"Unbekannter Aufgabentyp."` |
| Workflow edge on an undefined output | error | `"Ungültiger Ausgang."` |
| Unreachable workflow node | error | `"Knoten nicht erreichbar."` |
| Workflow node without an exit | error | `"Knoten ohne Ausgang."` |
| Invalid safety gate | error | `"Sicherheitsschwelle ungültig."` |
| Inject without purpose | warning | `"Ereignis ohne Zweck."` |
| Inject without expected outcome | warning | `"Kein erwartetes Ergebnis."` |
| Missing fallback (external delivery) | warning | `"Kein Fallback bei externer Zustellung."` |

- Inject classes (Information, Communications, Resource, Human, Environment, Authority, Safety, Evaluation) group the palette.
- A cycle is allowed only when explicitly repeatable (`repeatable: true`, `maxIterations`, `exitCondition`); otherwise it is an error ([../control/01-inject-orchestration.md](../control/01-inject-orchestration.md)).

- The linter panel MUST be always reachable and show a badge count on the `"Prüfen"` action.
- Clicking a finding selects and reveals the offending item.

## Revisions and save

- Editing is allowed only while the exercise is `frozen` (paused/not started).
- `"Speichern"` bumps `revision`; connected devices reload projected state within one tick.
- Server rejects a save when the client revision is stale; UI offers `"Neu laden"` (no silent overwrite).
- Autosave draft locally every 10 s; explicit save to server; drafts survive reload.

## Template integration

- `"Vorlage laden"` replaces the current draft after confirmation (or merges into an empty draft without confirmation).
- Loading a template is a normal builder action; afterwards every element is removable.
- `"Als Vorlage speichern"` exports the current mission as a reusable template JSON ([07-templates.md](07-templates.md)).

## Edge cases

- Deleting a patient that a medical station references: station stays, binding clears, linter error appears.
- Duplicating a station: new id, same module/config; bindings copied only for entities that still exist.
- Deleting the last station: allowed; the linter blocks start (enforced server-side, not only in the editor).
- Drag & drop cancelled mid-gesture: no partial state; Esc/back cancels.
- Import of a v1 scenario: migrated with `rules→injects` naming, defaults preserved ([11-data-model.md](11-data-model.md)).

## Acceptance criteria

- [ ] Given an empty mission, when a user drags `Terminal` onto the board, then one station exists with a neutral default and no entities created.
- [ ] Given a mission with 0 patients, when no medical module is used, then `"Prüfen"` reports no error.
- [ ] Given a medical station and no patient, when the user clicks the linter error, then the station is selected and `"Patient anlegen"` is offered.
- [ ] Given a running exercise, when the builder is opened, then it is read-only with `"Übung läuft"` and no save action.
- [ ] Given a stale revision, when saving, then the server rejects and the UI offers reload; no data is lost.
