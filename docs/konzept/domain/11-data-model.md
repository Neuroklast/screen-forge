# 11 — Data Model

> ScreenForge concept set · Target state (Soll) · Status: [12-gap-analysis.md](12-gap-analysis.md)
> Builder rules: [04-mission-builder.md](04-mission-builder.md). Runtime: [08-exercise-runtime.md](08-exercise-runtime.md).

## Overview

```text
Room (server) ── holds ── Mission ── contains ── Station[1..n]  (1 module each)
                                   ├─ Entity: Patient[0..n]
                                   ├─ Entity: Prop[0..n] (ordnance|beacon|payload|keycard|custom)
                                   ├─ Entity: Dossier[0..n]
                                   ├─ Entity: Zone[0..n]
                                   ├─ Entity: Objective[0..n]
                                   ├─ Entity: Team[0..n]
                                   ├─ Entity: Actor[0..n]
                                   ├─ Inject[0..n]
                                   └─ Workflow[0..n] (interaction graphs)
Show (film) ── contains ── Step[1..n] (take graph)
Template = Mission without room state, in `presets/missions/`
```

## Mission (schema v2)

| Field | Type | Notes |
| --- | --- | --- |
| `version` | `2` | Literal; migration from v1 on load |
| `id` | string | Slug, stable |
| `name` | string | Display name |
| `source` | `templateId?` | Traceability only |
| `mode` | `LIVE` / `PLAYBACK` | Data source |
| `seed` | number | Determinism |
| `map` | `{lat,lng,zoom,tiles?,attribution?}` | `tiles` empty = offline grid |
| `stations` | `Station[]` | 0..40 in draft, ≥1 to start |
| `patients` | `Patient[]` | optional |
| `props` | `Prop[]` | optional (new) |
| `dossiers` | `Dossier[]` | optional |
| `zones` | `Zone[]` | optional |
| `objectives` | `Objective[]` | optional |
| `teams` | `Team[]` | optional (new) |
| `actors` | `Actor[]` | optional (new) |
| `injects` | `Inject[]` | v1 name `rules`, migrated |
| `workflows` | `Workflow[]` | optional (new); interaction graphs ([14-interaction-model.md](14-interaction-model.md)) |
| `briefing` | string? | markdown, shown on HQ/briefing |
| `debriefHints` | string[]? | AAR prompts |
| `safetyProfile` | object? | stop signal, safety officer, restricted zones, prop register, abort recipients ([../scenarios/12-safety-profile.md](../scenarios/12-safety-profile.md)) |
| `doctrine` | `{id,version}?` | Pinned doctrine pack ([../scenarios/13-doctrine-packs.md](../scenarios/13-doctrine-packs.md)) |

## Station

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Unique per mission |
| `name` | string | Editable display name |
| `role` | `hq` / `player` | Device role |
| `module` | ModuleId | v1 field `scene`, migrated |
| `bindings` | `{patient?, prop?, objective?}` | Replaces v1 `entityId` |
| `team` | string? | Team id |
| `player` | boolean | GPS sharing enabled |
| `route` | `{lat,lng}[]?` | PLAYBACK movement |
| `config` | object | Module-specific (duration, code, stages, window) |
| `presentation` | `{scene?, config?, revision}`? | Look/identity pushed to the field device. `scene` overrides the module-derived scene; `config` is a partial `Config` preset (title, subtitle, identifier, accent, mood, density, format, effects, overlays, sceneOptions, tokens, …; no `mediaIds`/`brand` logo, which stay in the author's browser); `revision` bumps on edit so the device remounts. Absent → scene defaults ([05-modules.md](05-modules.md)) |

## Entity shapes

| Entity | Fields |
| --- | --- |
| `Patient` | `id, name, kind, since, overrides?, triage?, injuries[]` |
| `Prop` | `id, kind, name, states[], initial, state, visible` |
| `Dossier` | `id, name, role, photo?, notes, events[], released` |
| `Zone` | `id, name, lat, lng, radius` |
| `Objective` | `id, name, team?, condition: {type: inject|manual|compound, events[]}, state` |
| `Team` | `id, name, color` |
| `Actor` | `id, name, character, briefing?, dossierId?` |
| `Inject` | `id, name, enabled, trigger, actions[], unless?, at?, jitter?, zone?, station?, signal?, prop?, from?, to?` plus MEL v2: `category?, status?, purpose?, expectedOutcome[]?, evidence[]?, failurePolicy?, safetyGate?, owner?, audience[]?, conditions[]?, escalation?, plannedAtOriginal?, scheduledAt?, timeBasis?, revision?` |

## Workflow (mission data)

- Workflow ids are unique per mission; node/edge/variable references MUST resolve inside the workflow (scenario references are checked by the linter). Schema version 1, interpreter in `src/core/workflow.ts` — definitions are mission data, never code.

| Field | Type | Notes |
| --- | --- | --- |
| `trigger` | `{type: manual}` or `{type: prop, prop, to}` | Instance start |
| `entry` | node id | MUST be the `start` node |
| `nodes` | `{id, name?, type, config, position?}[]` | Types per [14-interaction-model.md](14-interaction-model.md) |
| `edges` | `{id, source, output, target}[]` | `output` MUST be a port of the source node |
| `variables` | `{id, kind, initial, values?, secret?}[]` | Typed; `secret` values are redacted from players |

## Show (film)

- Unchanged from v1: `{version, name, steps[]}` with `Step = {id, name, config, cue, operation, trigger, duration, value, next, onFail, timeout}`.
- `config` embeds the full film `Config` (scenes, theme, media, overlays, tokens).
- Stage targets are runtime state, not persisted in the show (per device, ephemeral).

## Room state (server)

| Field | Notes |
| --- | --- |
| `room, mission, revision` | Revision bumps on save |
| `clock, frozen, phase` | Phase: draft/ready/running/paused/aborted/ended |
| `fired[], interventions{}, positions{}, cameraOffline{}, completed[], props{}, log[], presence[]` | Runtime |
| `workflows{}` | Workflow instances: `workflowId`, `activeNodeIds[]`, `status`, `outcome?`, `variables`, `surface?`, `enteredAt{}`, `lastResult?`, `startedAt`, `updatedAt`; projections add `activeTask?` (registry config) and `workflowTriggers?` for field stations |
| `baseline` | Snapshot for reset |
| `notes[]` | Assessor notes (new) |

## Versioning & migration

- `version: 1` (current `scenarioSchema`) migrates on load: `scene→module`, `entityId→bindings.patient`, `rules→injects`.
- Migration MUST be lossless for v1 fields; unknown future fields are preserved on round-trip where possible.
- Film `Config` keeps `version: 1`; training mission gets its own `version: 2` literal.
- Breaking changes bump the mission version; old versions remain readable for one major cycle.
- MEL v2 fields and `workflows` are additive/optional, so mission `version` stays `2`; a breaking change to existing field semantics bumps the mission version instead.

## Persistence

| Store | Content | Lifetime |
| --- | --- | --- |
| `.exercise-data/rooms.json` | Rooms, baseline, credentials (legacy/export) | Server restarts |
| `.exercise-data/journal/<room>.jsonl` | Append-only domain event log (source of truth) | Server restarts |
| `.exercise-data/snapshots/<room>.json` | Compacted state snapshot | Server restarts |
| localStorage | Film config, show, drafts, depth setting | Browser |
| IndexedDB | Command outbox + media blobs | Browser |
| `presets/*.json` | Film look presets (existing) | Repo |
| `presets/missions/*.json` | Mission templates (new) | Repo |
| `.exercise-data/browser-tests/` | Playwright test data | Tests |

## IDs and naming

- Ids: lowercase slug, `[a-z0-9-]`, unique per mission; generated from name with numeric suffix on collision.
- Names: free text, German UI; max lengths mirror v1 caps (name 40, station 24, title 40).
- Codes: 4–8 alphanumeric; uniqueness per mission is a linter warning.

## URL & session parameters

| Param | Values | Effect |
| --- | --- | --- |
| `mode` | `film` / `training` / `demo` | Start page target |
| `role` | role ids (+ aliases `trainer`, `element`, `film`) | Direct role view |
| `room` | string | Exercise room |
| `station` | station id | Device binding |
| `kiosk` | `1` | Lock output |
| `demo` | `1` | Demo mode |
| `#invite` | token | One-time device assignment |

## Acceptance criteria

- [ ] Given a v1 scenario file, when imported, then it loads as a v2 mission with identical behavior.
- [ ] Given a mission export/import round-trip, then all entities, bindings, and injects survive byte-stable.
- [ ] Given unknown fields in an imported mission, then loading succeeds and unknown fields are ignored with a warning.
- [ ] Given `tiles: ""`, then the map renders the offline grid and makes no tile requests.
