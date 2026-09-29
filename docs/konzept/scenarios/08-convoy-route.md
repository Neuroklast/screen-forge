# Scenario — Convoy & Route (Transportbegleitung)

> ScreenForge concept set · Scenario library · Exercise-design realism (fiction only) · Language: EN, UI labels DE
> Related: [01-exercise-anatomy-and-mel.md](01-exercise-anatomy-and-mel.md) · [00-realism-and-safety-framework.md](00-realism-and-safety-framework.md)

## Purpose

A movement-coordination exercise: run a fictional multi-vehicle convoy through checkpoints, keep HQ's picture current, and handle delays, breakdowns, and route changes. Driving and protective procedures happen outside the simulation and are not prescribed.

## Training goals

- Convoy timing and checkpoint discipline (arrivals, spacing, handover).
- Proactive status reporting and manifest documentation.
- Contingency handling: delay, breakdown, reroute.
- Keeping a shared picture current for all cells.

## Fiction (briefing)

A fictional company moves equipment between two sites. HQ coordinates two vehicles through three checkpoints; a manifest dossier defines the cargo (fictional).

## Device layout

| Station | Module | Role | Notes |
| --- | --- | --- | --- |
| HQ-1 | `tracking` | hq | route, checkpoints, live positions |
| HQ-2 | `comms` | hq | command channel |
| ACC-1, ACC-2 | `access` | player | checkpoint gates (codes) |
| CAM-1 | `camera` | player | checkpoint camera |
| TERM-1 | `terminal` | player | manifest and route records |
| MED-1 (optional) | `medical` | player | incident casualty |

## Entities

| Entity | Type | Detail |
| --- | --- | --- |
| Manifest dossier | dossier | cargo list, released at start |
| Route | route (playback) | 5 waypoints, 3 checkpoints |
| Zone-1..3 | zone | checkpoints 1–3 |
| Objective-1 | objective | departure and manifest confirmed |
| Objective-2 | objective | all checkpoints reported on time |
| Objective-3 | objective | arrival and handover documented |
| Patient-1 (optional) | patient | `tachy` after incident inject |

## MEL

| T+ | Inject | Trigger | Action | Purpose | Fallback |
| --- | --- | --- | --- | --- | --- |
| 00:00 | Start, manifest released | manual | clock play | orientation | — |
| 03:00 | Checkpoint 1 delay | zone | message `"Verzögerung"` | timing management | comms |
| 06:00 | Vehicle breakdown (fictional) | timer | message + route edit | contingency | manual |
| 09:00 | Gate 2 code change | timer | access code change | adaptation | manual |
| 12:00 | Incident (optional) | manual | patient `tachy` + camera focus | response decision | comms |
| 15:00 | Reroute order | manual | route edit | replanning | — |
| 18:00 | Arrival window | timer | message `"Ankunft in 5 min"` | coordination | — |
| 21:00 | End | timer | objective check | consolidation | — |

## Roles

- EXCON (1): MEL, route edits, incident.
- Safety (1): abort authority.
- Assessor (1): timing and reporting.
- HQ (2): map/comms.
- Players (2–3): gates, camera, terminal.
- Role player (1, optional): driver for realism.

## Objectives & evaluation

| Criterion | Observable | Weight |
| --- | --- | --- |
| Timing | checkpoints reported within ±2 min | 25 % |
| Reporting | status calls complete and proactive | 25 % |
| Contingency | breakdown handled ≤ 5 min, reroute confirmed | 30 % |
| Documentation | manifest and handover complete | 20 % |

## Variants

- Guided: 2 stations (HQ, access), no incident.
- Advanced: full layout, breakdown, reroute, incident.
- PLAYBACK: scripted route for rehearsal and demo.

## Debrief questions

1. When did HQ lose the picture, and why?
2. How was the reroute decided and communicated?
3. What did the manifest confirm or contradict?
4. Which checkpoint was the weakest link?

## Safety notes

- No driving, escort, or intervention procedures are part of the simulation; it evaluates coordination, timing, and documentation only.
- The incident inject is simulated; abort rules apply.
