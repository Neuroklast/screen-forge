# 01 — Glossary & Jargon

> ScreenForge concept set · Target state (Soll) · Status: [12-gap-analysis.md](12-gap-analysis.md)
> Rule: one concept, one name. **Element content (scenes, blocks, field consoles) is English**; control-chrome labels resolve through the semantic terminology layer (English canonical, German via profiles — [../usability/12-terminology.md](../usability/12-terminology.md)); code/schema uses the English term.
> Distinct surfaces: `Firmenportal` (corporate intranet scene), `Betriebssystem` (OS desktop scene), `Terminal` (command line scene) — never call one the other.

## Terminology profiles

The control-chrome label for a concept is resolved through the semantic terminology layer ([../usability/12-terminology.md](../usability/12-terminology.md)), not hardcoded. English is canonical and the German `de-bundeswehr` (military) profile uses established Bundeswehr operational terminology: for example `mission → AUFTRAG`, `exercise_control → ÜBUNGSLEITUNG`, `common_operational_picture → Lagebild`. This intentionally supersedes the single German label column below for the military profile; the `de-professional` profile keeps the established operational German label. The German UI label column stays the reference for the default professional chrome, and the English column stays normative for code/schema.

## Core terms

| English (code/schema) | German UI label | Definition | Never call it |
| --- | --- | --- | --- |
| `mission` | `"Einsatz"` | The composed scenario: devices, entities, zones, objectives, injects. One mission per exercise room. | Scenario, Level, Case |
| `template` | `"Vorlage"` | A pre-composed mission skeleton the user can load and edit. | Preset (reserved for film look), Blueprint |
| `exercise` | `"Übung"` | A running or prepared training instance of a mission. | Game, Session |
| `room` | `"Übungsraum"` | Named server-side instance holding one mission + live state. | Lobby, Channel |
| `station` | `"Gerät"` | One screen endpoint bound to one module. | Device, Node, Screen |
| `module` | `"Modul"` | The application running on a station (terminal, medical, camera, …). | Scene (reserved for film), App |
| `entity` | `"Entität"` | Anything a mission can contain besides stations: patient, prop, dossier, zone, objective, team, actor. | Object, Item |
| `prop` | `"Requisite"` | Fictional physical object with states: ordnance, beacon, payload, keycard, custom. | Gadget, Item |
| `ordnance` | `"Sprengkörper"` | Fictional explosive device prop (antimatter/nuclear containment) used for bomb-disposal exercises. | Bomb (only in UI copy where short), IED |
| `beacon` | `"Bake"` | Fictional signal device prop: off, active, interference. | Marker, Tracker |
| `payload` | `"Datenkern"` | Fictional data carrier prop: empty, copied, destroyed. | Loot, USB |
| `patient` | `"Patient"` | Simulated casualty with vitals, triage, injuries. Optional. | Casualty, Victim |
| `dossier` | `"Akte"` | Person file released to roles during an exercise. | File, Document |
| `zone` | `"Zone"` | Geographic circle on the map; triggers rules, defines objectives. | Area, Sector |
| `objective` | `"Einsatzziel"` | A mission goal with a success condition. | Task, Goal |
| `inject` | `"Ereignis"` | Timed/triggered event that changes state (was `rule` in schema v1). | Trigger, Event |
| `team` | `"Team"` | Color/label group for stations and players. | Squad, Faction |
| `actor` | `"Darsteller"` | Human playing a character (film role, training role player). | Player (reserved for training operator) |

## Roles

| English | German UI label | Definition |
| --- | --- | --- |
| `director` | `"Regie"` | Film control: stage, shows, takes, media, themes. |
| `stage-operator` | `"Bühne"` | Operates output devices in kiosk; no authoring. |
| `excon` | `"Übungsleitung"` | Exercise control: authors and runs the mission. |
| `safety` | `"Sicherheit"` | Can pause/abort at any time; sees everything. |
| `assessor` | `"Beobachter"` | Read-only plus notes/scores for after-action review. |
| `hq` | `"Einsatzleitung"` | Command-post view: operational picture, limited actions. |
| `player` | `"Spieler"` | Field operator at a station; executes module tasks. |
| `technician` | `"Technik"` | Provisioning, network, media, device binding. |
| `presenter` | `"Vorführer"` | Demo mode host; drives the guided tour. |
| `visitor` | `"Besucher"` | Demo mode observer; optional sandbox interaction. |

## Modes and depth

| English | German UI label | Definition |
| --- | --- | --- |
| `film` | `"Film & TV"` | Production mode: scenes, shows/takes, stage output. |
| `training` | `"Training"` | Exercise mode: missions, live runtime, debrief. |
| `demo` | `"Demo"` | Offline showcase mode: seeded content, guided tour. |
| `guided` | `"Geführt"` | Depth level: wizard, defaults, reduced choices. |
| `advanced` | `"Experte"` | Depth level: full builder, bindings, injects. |
| `profile` | `"Profil"` | Experience profile (orthogonal to depth): Easy / Advanced / Professional. |
| `easy` | `"Einfach"` | Profile: one task, large targets, deterministic recovery. |
| `professional` | `"Professionell"` | Profile: provenance, uncertainty, role separation, degradation. |
| `LIVE` | `"Live"` | Mission data source: real GPS, real time, server tick. |
| `PLAYBACK` | `"Aufzeichnung"` | Mission data source: deterministic routes, rehearsal/replay. |
| `EXCON` | `"Übungsleitung"` | Exercise control cell; the authority that runs the exercise. |

## Status and state words

| Term | UI label | Meaning |
| --- | --- | --- |
| `armed` | `"scharf"` | Ordnance prop is live; countdown may run. |
| `tampered` | `"manipuliert"` | Ordnance prop state after wrong handling; triggers injects. |
| `bypassed` | `"überbrückt"` | Stage passed in the fictional disposal sequence. |
| `disarmed` | `"entschärft"` | Ordnance prop neutralized; objective candidate. |
| `released` | `"freigegeben"` | Dossier visible to non-EXCON roles. |
| `SIG_LOST` | `"Signalverlust"` | Player GPS stale beyond threshold (10 s). |
| `frozen` | `"pausiert"` | Exercise clock paused; mission edits allowed. |
| `revision` | `"Version"` | Monotonic mission version; devices reload on change. |
| `command` | `"Befehl"` | Operator action sent to the server with a stable `eventId`. |
| `log event` | `"Log-Eintrag"` | Authoritative, server-sequenced change in the event journal. |
| `outbox` | `"Ausgangskorb"` | Client queue of unsent/unacked commands. |
| `deadline` | `"Frist"` | Absolute server time; display is a prediction, the server is authority. |
| `failurePolicy` | `"Fehlerstrategie"` | `continue` / `degrade` / `hold` / `branch` / `trainerDecision`. |
| `safetyGate` | `"Sicherheitsschwelle"` | Preconditions without which an inject never fires. |
| `stale` | `"veraltet"` | Data older than its freshness threshold; shown with age. |
| `SYNC UNKNOWN` | `"Abgleich unklar"` | Client cannot know the authoritative time after an offline gap. |

## Forbidden or deprecated terms

- `"Szenario"` → use `"Einsatz"` in UI; `scenario` survives only in schema v1 migration code.
- `"Level"`, `"Mission"` (EN) in German UI → use `"Einsatz"`.
- `"Spiel"`, `"Game"` → training is an exercise, not a game.
- `"Bombe"` alone in UI → prefer `"Sprengkörper"`; short `"Bombe"` allowed only in marketing/summary copy.
- `"Handy"`, `"Tablet"` for stations → use `"Gerät"`.
- Real-world CBRN/explosive vocabulary (detonator wiring, charge types, frequencies) → NEVER.
