# Formats — Mission (v2)

> ScreenForge concept set · Data formats · Target state (Soll) · Language: EN, UI labels DE
> Related: [00-format-family.md](00-format-family.md) · [../domain/11-data-model.md](../domain/11-data-model.md) · [04-import-export-migration.md](04-import-export-migration.md)

## File

- Name: `<slug>.sfmission.json`; UTF-8, pretty-printed.
- Extension: `.sfmission.json` for exchange; `.json` also accepted on import.
- Version: `2`; version `1` scenarios migrate on load.

## Root fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `version` | `2` | yes | literal |
| `id` | string | yes | slug, stable |
| `name` | string | yes | display name |
| `source` | string? | no | template id for traceability |
| `mode` | `LIVE` / `PLAYBACK` | yes | data source |
| `type` | `disposal` / `medical` / `film` / `field` / `custom` | yes | scenario type; inferred on first parse for old files, then stable ([../domain/15-scenario-capabilities.md](../domain/15-scenario-capabilities.md)) |
| `capabilities` | object | no | overrides of the type preset, e.g. `{"patients": true}` for a disposal exercise with a contingency casualty |
| `seed` | number | yes | determinism |
| `map` | object | yes | `{lat, lng, zoom, tiles?, attribution?}`; empty tiles = offline grid |
| `briefing` | string? | no | markdown, shown on HQ/briefing |
| `debriefHints` | string[]? | no | AAR prompts |
| `company` | string? | no | company id from [../catalog/20-companies-and-brands.md](../catalog/20-companies-and-brands.md) |
| `stations` | Station[] | yes | 0 in draft, 1..40 to start |
| `patients` | Patient[] | no | 0..40 |
| `props` | Prop[] | no | 0..40 |
| `dossiers` | Dossier[] | no | 0..40 |
| `zones` | Zone[] | no | 0..40 |
| `objectives` | Objective[] | no | 0..40 |
| `teams` | Team[] | no | 0..20 |
| `actors` | Actor[] | no | 0..20 |
| `injects` | Inject[] | no | 0..100; migrated from v1 `rules` |

## Station

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | unique |
| `name` | string | ≤ 24 chars |
| `role` | `hq` / `player` | device role |
| `module` | module id | v1 `scene` migrated; modules in [../domain/05-modules.md](../domain/05-modules.md) |
| `bindings` | `{patient?, prop?, objective?}` | replaces v1 `entityId` |
| `team` | string? | team id |
| `player` | boolean | GPS sharing |
| `route` | `{lat,lng}[]?` | ≤ 20 waypoints, PLAYBACK |
| `config` | object | module-specific: `code`, `duration`, `stages`, `window` |

## Entity shapes

| Entity | Fields |
| --- | --- |
| Patient | `id, name, kind, since, triage?, injuries[], overrides?` |
| Prop | `id, kind (ordnance/beacon/payload/keycard/custom), name, states[], initial, state?, visible?` |
| Dossier | `id, name, role, photo?, notes, events[], released, blood?, allergies?, clearance?, status?, facility?` |
| Zone | `id, name, lat, lng, radius (5–10000)` |
| Objective | `id, name, team?, condition {type: inject/manual/compound, events[]}, state?` |
| Team | `id, name, color` |
| Actor | `id, name, character, briefing?, dossierId?` |
| Inject | `id, name, enabled, trigger, actions[1..10], unless?, at?, jitter?, zone?, station?, signal?, prop?, from?, to?` |

## Triggers and actions

- Triggers: `timer`, `zone`, `intervention`, `prop`, `signal`, `manual`.
- Actions: `patient`, `release`, `camera`, `objective`, `message`, `prop`, `lock`, `beacon`, `ordnance`, `sound`, `state`.
- See [../domain/08-exercise-runtime.md](../domain/08-exercise-runtime.md) and [../control/01-inject-orchestration.md](../control/01-inject-orchestration.md).

## Minimal example

```json
{
  "version": 2,
  "id": "eod-demo",
  "name": "Sprengkörper entschärfen",
  "mode": "LIVE",
  "type": "disposal",
  "seed": 2048,
  "map": { "lat": 51.23, "lng": 6.78, "zoom": 15, "tiles": "" },
  "stations": [
    { "id": "ord-1", "name": "Konsole 01", "role": "player", "module": "ordnance",
      "bindings": { "prop": "ordnance-1" }, "config": { "stages": 4 } },
    { "id": "hq", "name": "Einsatzleitung", "role": "hq", "module": "tracking" }
  ],
  "props": [
    { "id": "ordnance-1", "kind": "ordnance", "name": "Baugruppe 09",
      "states": ["armed", "bypassed", "disarmed"], "initial": "armed" }
  ],
  "injects": [
    { "id": "inj-1", "name": "Countdown", "enabled": true, "trigger": "timer",
      "at": 600, "actions": [{ "type": "message", "text": "Zeitfenster läuft" }] }
  ]
}
```

## Rules

- `id` MUST be unique per collection; names are free text (German UI).
- Codes: 4–8 alphanumeric; duplicates are a linter warning.
- Coordinates: WGS84 decimals; `radius` in meters.
- Empty arrays are omitted on export; zero stations is valid in drafts.
- Media references use IndexedDB ids or package paths ([02-package-format.md](02-package-format.md)).

## Acceptance criteria

- [ ] Given a v1 scenario, it loads as v2 with identical runtime behavior.
- [ ] Given the minimal example, it validates and starts with one device and one prop.
- [ ] Given duplicate station ids, import fails with a reference error.
- [ ] Given a round-trip export/import, the mission is byte-stable apart from formatting.
