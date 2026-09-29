# Scenario — Protective Detail (Personenschutz)

> ScreenForge concept set · Scenario library · Exercise-design realism (fiction only) · Language: EN, UI labels DE
> Related: [01-exercise-anatomy-and-mel.md](01-exercise-anatomy-and-mel.md) · [00-realism-and-safety-framework.md](00-realism-and-safety-framework.md)

## Purpose

A route and protection-coordination exercise: plan a movement, monitor it through checkpoints, and react to schedule and route changes. The simulation provides map, comms, gates, cameras, and medical surfaces; real movement and protective procedures happen outside the simulation.

## Training goals

- Route planning with checkpoints and fallback options.
- Proactive reporting and schedule management under change.
- Decision making when the plan is invalidated (route change, incident).
- Handover documentation at arrival.

## Fiction (briefing)

A fictional executive (dossier) moves between two facilities of a fictional company. HQ coordinates the movement remotely through facility and vehicle systems.

## Device layout

| Station | Module | Role | Notes |
| --- | --- | --- | --- |
| HQ-1 | `tracking` | hq | route, checkpoints, live positions |
| HQ-2 | `comms` | hq | command channel, canned status calls |
| CAM-1, CAM-2 | `camera` | player | facility gate + arrival point |
| ACC-1 | `access` | player | gate control (code) |
| TERM-1 | `terminal` | player | schedule and dossier access |
| MED-1 | `medical` | player | optional incident casualty |

## Entities

| Entity | Type | Detail |
| --- | --- | --- |
| VIP dossier | dossier | principal profile, released at start |
| Route | route (playback) | 4 waypoints with 2 checkpoints |
| Zone-1, Zone-2 | zone | checkpoint A, checkpoint B |
| Objective-1 | objective | departure confirmed |
| Objective-2 | objective | both checkpoints reported on time |
| Objective-3 | objective | arrival documented |
| Patient-1 (optional) | patient | `tachy` after incident inject |

## MEL

| T+ | Inject | Trigger | Action | Purpose | Fallback |
| --- | --- | --- | --- | --- | --- |
| 00:00 | Start, VIP released | manual | clock play, dossier release | orientation | — |
| 03:00 | Checkpoint A delay | zone | message `"Verzögerung 4 min"` | schedule management | comms |
| 06:00 | Route change | timer | message + route edit (EXCON) | replanning | manual |
| 09:00 | Gate fault | timer | access code change | contingency | manual |
| 12:00 | Incident (optional) | manual | camera cut + patient `tachy` | response decision | comms |
| 15:00 | Arrival window | timer | message `"Ankunft in 5 min"` | coordination | — |
| 18:00 | End | timer | objective check | consolidation | — |

## Roles

- EXCON (1): MEL, route edits, optional incident.
- Safety (1): abort authority.
- Assessor (1): timing and reporting notes.
- HQ (2): map/comms.
- Players (2): gate, camera, terminal.
- Role player (1): principal (optional, for handover practice).

## Objectives & evaluation

| Criterion | Observable | Weight |
| --- | --- | --- |
| Planning | checkpoints defined, fallback route named | 25 % |
| Proactive reporting | status calls before being asked | 25 % |
| Adaptation | route change handled ≤ 5 min | 25 % |
| Documentation | arrival handover complete | 25 % |

## Variants

- Guided: 3 stations (HQ, access, terminal), no incident.
- Advanced: full layout, incident inject, role-player principal.
- PLAYBACK: fixed route for rehearsal and demo.

## Debrief questions

1. When did you know the original plan would not hold?
2. How early did HQ learn about the delay?
3. What did the arrival handover contain?
4. Which fallback would you choose next time?

## Safety notes

- No protective, driving, or intervention procedures are part of the simulation; it evaluates coordination and documentation only.
- The optional incident is simulated; abort rules apply.
