# D15 — Scenario Capabilities

> ScreenForge concept set · Domain concept · Language: EN, UI labels DE
> Related: [04-mission-builder.md](04-mission-builder.md) · [07-templates.md](07-templates.md) · [14-interaction-model.md](14-interaction-model.md) · [../usability/11-preparation-ia.md](../usability/11-preparation-ia.md)

A scenario carries a stable `type`. The type selects which domain concepts the preparation UI exposes; every schema collection stays intact, so hidden data is never lost — it is only hidden until the scenario explicitly enables it.

## Type and overrides

- `Scenario.type ∈ { disposal, medical, film, field, custom }`, persisted in the mission file.
- Scenarios saved before the field existed get a best-effort inferred type on first parse; the type is then stable even when content changes.
- `Scenario.capabilities` stores only overrides of the type preset; `capabilitiesFor(type, overrides)` resolves the effective set.
- Changing the type resets the overrides. Toggling a capability stores an override only when it differs from the preset.

## Capability matrix

| Capability | disposal | medical | film | field | custom |
| --- | --- | --- | --- | --- | --- |
| participants | ✓ | ✓ | | ✓ | ✓ |
| teams | ✓ | | | ✓ | ✓ |
| actors | | | ✓ | | ✓ |
| patients | (override) | ✓ | | (override) | ✓ |
| props | ✓ | | ✓ | ✓ | ✓ |
| zones | ✓ | | | ✓ | ✓ |
| dossiers | | | | ✓ | ✓ |
| devices | ✓ | ✓ | ✓ | ✓ | ✓ |
| workflows | ✓ | ✓ | ✓ | ✓ | ✓ |
| objectives | ✓ | ✓ | ✓ | ✓ | ✓ |

- Disposal NEVER shows patient controls unless the scenario enables `patients` ("explicitly introduced by the flow").
- Medical requires a patient as soon as treatment exists (medical device, medical task or patient action); the linter enforces this, not the schema.
- Film uses actors, props and devices; participants, teams and patients stay hidden.
- `custom` exposes everything.

## UI derivation

- Preparation navigation is fixed: Übersicht, Szenario, Teilnehmer, Geräte, Ablauf, Prüfen ([../usability/11-preparation-ia.md](../usability/11-preparation-ia.md)).
- Sections render their blocks from the effective capabilities: people in Teilnehmer, props in Geräte, zones/objectives in Szenario, workflows and events in Ablauf.
- Devices use human presets; ordnance/beacon consoles provision their prop, medical devices provision a patient. Guided setup never asks for bindings, roles, ids or module names.
- Participants: operators are player stations; teams, actors and patients stay their schema entities. `"Spieler hinzufügen"` is forbidden copy.
- Participants are a UI projection over stations, teams, actors and patients — no separate participant entity is required for this.

## Validation (shared linter, enforced at review and at the server start gate)

- Patients exist while the `patients` capability is off → error.
- Medical scenario with treatment and no patient → error.
- Field device without owner: an element station with a personal module (`tracking`, `medical`) must be a player, bound, or owned by a team entity. Fixed equipment (consoles, cameras, props) is its own responsibility.
- Every workflow needs a reachable start and a terminal path; disconnected branch outputs are errors in normal language.
- Missing bindings are linter findings, not schema errors: a draft may be incomplete while it is built.

## Acceptance criteria

- [ ] A disposal scenario shows no patient controls until the capability is enabled.
- [ ] A medical scenario with treatment but no patient is blocked at review and start.
- [ ] A film scenario shows actors and hides patients and teams.
- [ ] Every hidden concept remains editable through the expert surfaces.
