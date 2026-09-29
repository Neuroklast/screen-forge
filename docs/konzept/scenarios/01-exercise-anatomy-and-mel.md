# Scenarios — Exercise Anatomy & MEL

> ScreenForge concept set · Scenario library · Exercise-design realism (fiction only) · Language: EN, UI labels DE
> Related: [00-realism-and-safety-framework.md](00-realism-and-safety-framework.md) · [../control/01-inject-orchestration.md](../control/01-inject-orchestration.md)

## Exercise anatomy

| Element | German | Content | Where |
| --- | --- | --- | --- |
| Briefing | `"Einweisung"` | Situation, goals, constraints, safety | Mission briefing + HQ view |
| Roles | `"Rollen"` | EXCON, safety, assessor, HQ, players, role players | [../domain/02-roles.md](../domain/02-roles.md) |
| Stations | `"Geräte"` | Screens and modules per position | Mission `stations[]` |
| Entities | `"Entitäten"` | Patients, props, dossiers, zones, objectives, teams, actors | Mission entities |
| MEL | `"Ereignisliste"` | Master Event List: every planned inject | Mission `injects[]` |
| Comms plan | `"Funkplan"` | Channels, message formats, silence windows | Mission config + comms module |
| Evaluation | `"Bewertung"` | Criteria, notes, scores | Assessor view |
| AAR | `"Nachbesprechung"` | Structured debrief with log references | [10-evaluation-and-aar.md](10-evaluation-and-aar.md) |

## Master Event List (MEL)

| Column | Meaning | Example |
| --- | --- | --- |
| `T+` | Offset from exercise start (clock time) | `T+03:00` |
| Inject | What happens in the simulation | `"Kamera 2 fällt aus"` |
| Trigger | `timer` / `zone` / `intervention` / `prop` / `signal` / `manual` | `timer` |
| Action | Effect on mission state | `camera offline` |
| Purpose | Training intent | `"Informationen neu priorisieren"` |
| Fallback | If the inject cannot land (device offline, missed) | `"Nachricht über Funk"` |
| Escalation | Next inject if ignored | `"Kontaktverlust T+06:00"` |

- The MEL is authored in advanced mode ([../domain/04-mission-builder.md](../domain/04-mission-builder.md)) and fired by the inject scheduler ([../control/01-inject-orchestration.md](../control/01-inject-orchestration.md)).
- Every inject MUST have a purpose; decorative events are removed in review.
- Manual injects are reserved for EXCON discretion (escalation, recovery after missed events).

## Timing model

- All times are offsets from the exercise clock (`T+`), never wall-clock; pausing freezes everything.
- Standard phases: `T+00:00` start, `T+00:00–02:00` orientation, main phase, `T-05:00` consolidation, end.
- Recommended density: F2 one inject per 3–5 min; F3 one per 2–3 min; never two state-changing injects within 30 s unless intentional.
- Exercise duration SHOULD be declared; the clock shows elapsed and a soft end marker.

## Comms discipline (exercise-level)

- Message formats are generic and fictional: `"Lage"` (status), `"Anforderung"` (request), `"Meldung"` (report), `"Auftrag"` (task).
- Channel plan: one command channel, one coordination channel, one medical channel; silence windows are injects (`"Funkstille ab T+05:00"`).
- Messages are text-first in the product; voice discipline is practiced in the real exercise, not simulated.
- EXCON can broadcast canned messages; HQ can message stations ([../control/03-comms-and-notifications.md](../control/03-comms-and-notifications.md)).

## Role player briefings

- Each role player gets: character (from a dossier), goals, known facts, forbidden knowledge, stop signal.
- Role players MUST NOT reveal inject schedules or EXCON information.
- Pressure injects aimed at role players are marked in the MEL and configurable per fidelity level.

## Scenario file contract

Each scenario file in this library contains, in order: purpose, training goals, fiction/story, device layout, entities, MEL table, roles, objectives & evaluation, variants (guided/advanced, LIVE/PLAYBACK), debrief questions, safety notes.

## Acceptance criteria

- [ ] Given a scenario, its MEL lists every planned inject with trigger, action, purpose, and fallback.
- [ ] Given the exercise clock, all times are offsets and freeze on pause.
- [ ] Given a role player, their briefing contains goals, known facts, and the stop signal.
- [ ] Given a manual inject, EXCON can fire it without editing the mission.
