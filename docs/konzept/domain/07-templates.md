# 07 — Scenario Templates

> ScreenForge concept set · Target state (Soll) · Status: [12-gap-analysis.md](12-gap-analysis.md)
> Builder: [04-mission-builder.md](04-mission-builder.md). Entities: [06-entities-and-props.md](06-entities-and-props.md).

## Purpose

Templates are pre-composed mission skeletons shown in a gallery. They MUST be fully editable after loading: no fixed stations, no hidden bindings, no forced patient.

## Template schema

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | Stable slug (`eod-disposal`) |
| `name` / `nameDe` | string | Display name EN / DE |
| `summary` | string | One sentence for the gallery card |
| `type` | scenario type | `disposal` / `medical` / `film` / `field` / `custom`; sets the capability preset of the loaded mission ([15-scenario-capabilities.md](15-scenario-capabilities.md)) |
| `modes` | `film` / `training` | Where it can be loaded |
| `difficulty` | 1–3 | Guided suitability |
| `durationMin` | number | Typical exercise length |
| `stations` | array | Suggested stations (module + config), all removable |
| `entities` | array | Suggested entities, all removable |
| `injects` | array | Suggested injects, disabled-by-default only if marked |
| `briefing` | markdown | Shorting text for the mission brief |
| `debriefHints` | string[] | What to observe in AAR |
| `preview` | path | Optional image in `docs/previews/` |

- Templates live as JSON in `presets/missions/` and are validated by the same schema as missions.
- `"Als Vorlage speichern"` exports the current mission into the same format with a new id.
- Gallery filters: mode, difficulty, duration, required roles (e.g. `"braucht 2 Spieler"`).

## Template library (target)

| id | Name (DE) | Purpose | Devices | Entities | Duration |
| --- | --- | --- | --- | --- | --- |
| `blank` | `"Leerer Einsatz"` | Free build | 0 | 0 | — |
| `eod-disposal` | `"Sprengkörper entschärfen"` | Bomb disposal, fictional | 4 | ordnance, 1 zone | 20–30 min |
| `data-exfiltration` | `"Datenübernahme"` | Steal data from opposing team | 5 | payload, keycard, dossiers | 20–30 min |
| `beacon-activation` | `"Bake aktivieren"` | Reach and hold a beacon | 4 | beacon, 2 zones | 15–25 min |
| `search-rescue` | `"Search & Rescue"` | Find, stabilize, evacuate | 5 | 1 patient, zone | 20–40 min |
| `medical-emergency` | `"Medical Emergency"` | Patient-only response drill | 3 | 1–2 patients | 10–20 min |
| `access-lockdown` | `"Zugang & Verriegelung"` | Doors, codes, lockdown | 4 | keycard, 2 zones | 15–20 min |
| `milsim-skirmish` | `"MILSIM-Gefecht"` | Two teams, capture point | 4 | teams, 1 zone | 15–30 min |
| `film-playback` | `"Film-Aufzeichnung"` | Film/TV show rehearsal | n stage | none | show length |

## Template details

### eod-disposal — `"Sprengkörper entschärfen"`

- Stations: `ordnance` (console), `terminal` (diagnostics), `camera`, `hq` (`tracking`).
- Entities: 1 ordnance prop (`armed`, countdown 600 s), 1 zone (cordon).
- Injects: countdown start at T+0; `tampered` on wrong stage order; comms loss at T+300; `expired` consequence = objective failed + warning state.
- Objectives: secure zone → diagnose → bypass stages → disarm.
- Debrief hints: stage order, time pressure handling, communication with HQ.
- Fiction note: console labels stay abstract; no real EOD procedure.

### data-exfiltration — `"Datenübernahme"`

- Stations: target `terminal`, vault `terminal` (second code), `tracking` (player route), `camera`, `hq`.
- Entities: payload (`empty`), keycard, 2 dossiers (released by injects), 1 objective (compound: copied + exited zone).
- Injects: alarm at copy start (optional), counter-hack (terminal relock), opposing-team message, camera cut.
- Debrief hints: route choice, time in zone, handling of alarms.

### beacon-activation — `"Bake aktivieren"`

- Stations: `beacon` (control), `tracking`, `terminal` (arming code), `hq`.
- Entities: beacon prop, approach zone, exfil zone.
- Injects: signal window opens T+120 for 240 s; interference T+240 for 60 s; window close = `beacon-lost`.
- Objectives: reach zone → enter code → activate (hold 3 s) → hold 180 s → extract.
- Debrief hints: timing, fallback when interference hits.

### search-rescue — `"Search & Rescue"` (exists as `sar`)

- Stations: `hq`, `medical` (patient-bound), `tracking` (player), `camera`, `countdown` (prop terminal).
- Entities: 1 patient (`stable`), search zone.
- Injects: deterioration at T+180 unless `treated`; optional second casualty reveal.
- Objectives: locate → report → stabilize → evacuate.

### medical-emergency — `"Medical Emergency"`

- Stations: `medical`, `hq`, `terminal` (records), optional `camera`.
- Entities: 1–2 patients with different kinds (e.g. `trauma`, `desat`).
- Injects: arrest at T+240 unless `oxygen`; second patient discovered at T+300.
- Objectives: triage both, correct interventions, handover note.

### access-lockdown — `"Zugang & Verriegelung"`

- Stations: `access`, `lock`, `terminal`, `hq`.
- Entities: keycard, inner zone.
- Injects: alarm on wrong code, lockdown auto-trigger, relock after 30 s.
- Objectives: gain access → hold area → lift lockdown.

### milsim-skirmish — `"MILSIM-Gefecht"`

- Stations: 2× `tracking` (one per team, player flag), `comms`, `hq`.
- Entities: 2 teams, capture zone.
- Injects: zone capture timer, respawn/spawn messages (fiction), time limit.
- Objectives: team-scoped capture objective; no patients/props.
- Note: airsoft/MILSIM framing; no weapon mechanics beyond fiction.

### film-playback — `"Film-Aufzeichnung"`

- Uses existing show templates (e.g. `"Activate Locator Beacon"`, `"Archive Extraction"`, `"Warhead Maintenance"`).
- No server, no entities; stations are stage outputs; rehearsal take log enabled.

## Guided mapping

1. **Intent:** pick a domain (Search & Rescue, Medical, Technical, Disposal, Film, Free); templates load through the gallery.
2. **Interview:** only questions that change the flow are asked; answers drive suggestions.
3. **Suggestions:** accept, modify or skip; the real graph grows next to the interview.
4. **Reconciliation:** changing an earlier answer marks generated content for remove/keep; user content is never deleted silently.
5. **Review:** linter summary in `"Prüfen"`; `"Szenario anlegen"` creates a paused mission.

- The expert flow workspace MUST be reachable at any time via `"Im Expertenmodus öffnen"` without losing input.

## Edge cases

- Template references a module removed in a later version: migration maps or drops it with a warning.
- Imported template with duplicate station ids: ids are suffixed on load; warning shown.
- Template loaded over a non-empty draft: confirmation dialog with `"Ersetzen"` / `"Abbrechen"`.
- Gallery offline (no server): bundled templates still load (they ship with the app).

## Acceptance criteria

- [ ] Given the gallery, when `blank` is chosen, then an empty mission with 0 stations opens in the builder.
- [ ] Given any template, when loaded, then every station and entity can be removed without errors.
- [ ] Given `search-rescue`, when the wizard is completed, then a paused mission exists and the linter is clean.
- [ ] Given a custom mission, when saved as template, then it appears in the gallery for the same mode.
