# 06 — Entities & Props

> ScreenForge concept set · Target state (Soll) · Status: [12-gap-analysis.md](12-gap-analysis.md)
> Modules that bind them: [05-modules.md](05-modules.md). Schema: [11-data-model.md](11-data-model.md).

## Principle

Entities are **optional**. A mission exists with zero entities. Entities are added when the story needs them — by dragging from the palette or via one-click suggestions from the linter.

## Entity types

| Type | German | Optional | Bound by | State |
| --- | --- | --- | --- | --- |
| `patient` | `"Patient"` | yes | `medical` station | kind (vitals), triage, injuries |
| `ordnance` prop | `"Sprengkörper"` | yes | `ordnance` station | armed → tampered/bypassed → disarmed |
| `beacon` prop | `"Bake"` | yes | `beacon` station | off → active → interference |
| `payload` prop | `"Datenkern"` | yes | `terminal` station | empty → copied → destroyed |
| `keycard` prop | `"Schlüsselkarte"` | yes | `access` station | held → used |
| `custom` prop | `"Requisite"` | yes | any station or none | user-defined states |
| `dossier` | `"Akte"` | yes | none (release-gated) | unreleased → released |
| `zone` | `"Zone"` | yes | map | — (triggers injects) |
| `objective` | `"Einsatzziel"` | yes | none (completed by inject/manual) | open → complete |
| `team` | `"Team"` | yes | stations, players | — |
| `actor` | `"Darsteller"` | yes | station (human operator) | — |

## Patient

- Kind state machine: `stable`, `tachy`, `brady`, `desat`, `trauma`, `arrest`, `recovered`.
- Vitals are simulated deterministically from `kind` + `since` + mission seed; per-patient overrides allowed for EXCON.
- Triage: green/yellow/red/black; injuries are free-text labels shown on medical and HQ.
- Medical station MUST bind exactly one patient; one patient MAY be bound by multiple stations (rare, allowed).
- Patient without station is valid (e.g. hidden casualty revealed by a zone inject).

## Props (generic state machines)

- Every prop has `states[]`, `initial`, and a label; modules drive transitions via actions/injects.
- Props MAY bind to a station (module-specific rules) or exist unbound (narrative).
- Prop state changes are logged; HQ sees only props whose visibility is enabled in the mission.
- Ord/beacon/payload/keycard are presets of the generic prop; `custom` covers everything else (e.g. `"Fahrzeug"`, `"Generator"`).

### Ordnance (fictional)

- Display names: `"Containment-Baugruppe"` (antimatter) and `"Spaltmaterial-Baugruppe"` (nuclear) — fiction only.
- States: `armed` → (`tampered`) / `bypassed[1..n]` → `disarmed`.
- Optional countdown; on expiry the inject `expired` fires (mission decides the consequence — e.g. objective failed, screen effect).
- NEVER real wiring, charge, or chemistry detail; console text stays abstract and fictional.

### Beacon

- States: `off` → `active` → `interference` → `active`; hold gesture required to activate.
- Signal window: beacon active only within a time window (inject-controlled) or a zone.
- `beacon-lost` fires when window closes or interference applies; objectives can require hold duration.

### Payload

- States: `empty` → `copied` → `destroyed` (destroyed is terminal).
- Copying takes a configured duration on a terminal; interrupted copies revert to `empty`.
- Exfiltration objective completes when payload reaches `copied` AND the carrier leaves the zone (two-condition objective).

## Dossier

- Person file: name, role, photo, notes, events, clearance, status.
- Unreleased dossiers are invisible to `player`/`hq` until an inject or EXCON action releases them.
- Dossiers are ideal for role-player briefings and interrogation content.

## Zones & objectives

- Zones are circles (`lat`, `lng`, `radius`); entering/leaving fires zone injects; zones MAY define objective areas.
- Objectives have: name, optional team scope, success condition (`inject`, `manual`, `compound`), state.
- Compound conditions: `all`/`any` over events (e.g. `payload.copied` AND `zone.exited`).
- Manual completion is restricted to `excon` (and `hq` if the mission enables it).

## Teams & actors

- Teams: label + color; assign stations and players; used for projection (players never see other teams' data).
- Actors: humans playing characters; optional briefing text, character name, linked dossier.
- In training, an actor is a role player (e.g. informant at a `terminal`); in film, an actor operates scenes per script.
- Actor assignment does not change device auth; it is a label plus briefing surface.

## Lifecycle rules

- Deleting an entity unbinds it everywhere; referencing stations remain valid but show a linter error if required.
- Adding an entity from the linter creates a sensible default (e.g. `patient-1`, `stable`) and opens the inspector.
- Entities MUST survive export/import round-trips including state-machine definitions.
- Entity ids are stable; names are editable; duplicates get suffixes (`-2`), never silent overwrite.

## Edge cases

- Inject targets a deleted entity: linter error, inject disabled, mission cannot start.
- Two medical stations, one patient: allowed; interventions shared; log attributes the station.
- Custom prop with zero states: linter warning `"Requisite ohne Zustände."`.
- Payload copy while station offline: copy continues server-side only if the mission sets it so; default is interruption.

## Acceptance criteria

- [ ] Given a mission with only one `terminal` station and no entities, when checked, then no error is reported.
- [ ] Given an ordnance prop and station, when stages pass in order, then state ends `disarmed` and the objective condition can fire.
- [ ] Given an unreleased dossier, when a player requests state, then the dossier is absent from the payload.
- [ ] Given a zone inject, when a player with GPS enters the circle, then the inject fires exactly once and is logged.
