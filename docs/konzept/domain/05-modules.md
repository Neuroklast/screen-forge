# 05 — Module Catalog

> ScreenForge concept set · Target state (Soll) · Status: [12-gap-analysis.md](12-gap-analysis.md)
> Bindings: [06-entities-and-props.md](06-entities-and-props.md). Builder rules: [04-mission-builder.md](04-mission-builder.md).

## Module contract

Every module declares:

| Field | Meaning |
| --- | --- |
| `id` | Schema id (English, stable) |
| `label` | German UI label |
| `capabilities` | `film`, `training`, or both |
| `requires` | Bindings that MUST exist (linter error if missing) |
| `optional` | Bindings allowed but not required |
| `config` | Per-station fields (duration, code, route, …) |
| `emits` | Events the module can send to the rules engine |
| `accepts` | State changes the module renders |
| `operatedBy` | Roles allowed to perform module tasks |

- One station runs exactly one module in v2.
- Modules MUST work in `LIVE` and `PLAYBACK`; GPS-dependent ones degrade to routes in playback.
- Module UI MUST be operable with one hand on a tablet (field) and by keyboard (HQ/EXCON).

## Modules, tasks and workflows

- A module is the surface a station shows; the interaction behind it is described by tasks and workflows ([14-interaction-model.md](14-interaction-model.md)).
- A module MAY be driven by a workflow: the workflow's active node decides which surface/task the station shows. `emits` stays the event vocabulary injects trigger on.
- The task registry (`src/core/taskBlocks.ts`) owns task schemas and UI fields; the workflow interpreter owns execution. Neither is duplicated in a module.

## Field modules (station-side)

| id | Label | Requires | Emits | Key config | Operated by |
| --- | --- | --- | --- | --- | --- |
| `tracking` | `"Karte"` | — | `gps`, `zone-enter` | route (playback), player flag | player, hq |
| `camera` | `"Kamera"` | — | `camera-online` | cut/offline state | player, hq |
| `comms` | `"Funk"` | — | `message` | channels, canned texts | player, hq, excon |
| `medical` | `"Medizin"` | `patient` | `intervention` | vitals overrides | player |
| `terminal` | `"Terminal"` | `code` | `diagnostic`, `unlock`, `task-complete` | duration, code, task list | player |
| `countdown` | `"Zeitgeber"` | — | `expired`, `started`, `stopped` | duration, device type (fiction) | player, excon |
| `access` | `"Zugang"` | `code` | `granted`, `denied` | code, auto-relock | player |
| `lock` | `"Verriegelung"` | — | `locked`, `unlocked` | seal duration | player, hq |
| `beacon` | `"Bake"` | `beacon` prop | `beacon-active`, `beacon-lost` | signal window, hold time | player |
| `clock` | `"Uhr"` | — | — | mode, label | player |
| `rotary` | `"Drehregler"` | — | `rotary.aligned` | dials, targets | player |
| `code-table` | `"Codetabelle"` | — | `code.solved` | message, group size | player |
| `data-sheet` | `"Datenblatt"` | — | `data.relay` | schematic, steps, relay text | player |
| `ordnance` | `"Sprengkörper"` | `ordnance` prop | `stage-passed`, `tampered`, `disarmed` | stages, timer, fictional type | player |

### Module notes

- **tracking:** map with own position, team positions (if allowed), zones, routes; shows `SIG_LOST` after 10 s stale GPS; player flag enables GPS sharing.
- **camera:** publishes WebRTC feed to HQ; EXCON can cut the feed as an inject; offline shows a static `"KEIN SIGNAL"` pattern.
- **comms:** two-way text/radio messages; HQ and EXCON can broadcast; messages appear as injects in the log.
- **medical:** vitals simulation per patient kind; interventions `treated`, `tourniquet`, `oxygen`, `evacuated`; each intervention is an inject trigger.
- **terminal:** sequence of task steps (diagnose → code entry); wrong code locks input 3 s (server-enforced); task completion can satisfy objectives.
- **countdown:** fictional device timer; start/stop/pause; on expiry emits `expired`; never implies real ordnance behavior.
- **access:** door/gate simulation with keypad; code entry; optional auto-relock after N seconds.
- **lock:** lockdown state for a facility; toggles visual `"VERSIEGELT"` state; usable as objective.
- **beacon:** activation requires hold gesture (3 s); emits `beacon-active`; interference injects can force `beacon-lost`.
- **ordnance:** fictional EOD console: read diagnostics, pass N bypass stages in order, then disarm; wrong order sets `tampered`; all labels fictional (`"Containment-Baugruppe"`, `"Spaltmaterial-Baugruppe"`).

## System modules (in-world systems)

| id | Label | Capabilities | Purpose | Requires |
| --- | --- | --- | --- | --- |
| `corporate` | `"Konzernsystem"` | film, training | corporate records, search, access states (default brand VESPER) | — |
| `hologram` | `"Projektion"` | film, training | spatial assembly, analysis (default brand AEON) | — |
| `slide` | `"Briefing"` | film, training | Briefing/debrief slides | — |
| `os` | `"Betriebssystem"` | film, training | desktop applications (files, personnel, clusters, messages; default brand BLACKLINE) | — |
| `terminal` (scene) | `"Terminal"` | film, training | goal-driven command line with a completion signal (`terminal.bypass`) | — |

- System modules in training are read-mostly in-world stations (briefing, records, analysis); they MUST NOT bypass exercise permissions.
- `os` is one module hosting the OS scene family; app switching stays inside the module.

## Scene mapping (implementation hint)

| Module | Scene family |
| --- | --- |
| tracking | Orbital Survey |
| camera | Camera block |
| comms | Comms block |
| medical | Medical block |
| terminal / access / lock | Terminal / Access / Lock scenes |
| countdown | Sequence Control |
| beacon / ordnance | new scenes (fictional control surfaces) |
| corporate / hologram / slide / os | Corporate system / Analysis table / Slide / Network terminal |

## Module configuration defaults

- New stations MUST default to `terminal` with no binding and a generated 4-digit code shown in the inspector.
- Durations default: countdown 600 s, terminal 120 s, access 30 s relock, beacon hold 3 s, ordnance stages 4.
- Codes MUST be unique per mission (linter warning on duplicates).
- All config fields are mission data; nothing is hardcoded per module beyond defaults.

## Edge cases

- Module changed while devices are connected but exercise paused: devices reload; task progress resets; log notes the change.
- Camera without HQ receiver: feed stays local; linter info `"Kein Empfänger für Kamera."`.
- Ordnance module used without prop: blocked at start, not at drop.
- Beacon interference inject while device offline: state applies on reconnect; timestamp from server clock.

## Acceptance criteria

- [ ] Given a station with `terminal`, when the code is entered correctly after diagnostics, then `unlock` is emitted and the event is logged once.
- [ ] Given a `medical` station bound to a patient, when the player sets `tourniquet`, then vitals change within one tick and an inject trigger can fire.
- [ ] Given `PLAYBACK`, when the mission runs, then `tracking` shows the configured route and no GPS permission is requested.
- [ ] Given a wrong ordnance stage order, then `tampered` fires and the console shows a recoverable reset.
