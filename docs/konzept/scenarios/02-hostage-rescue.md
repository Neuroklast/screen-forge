# Scenario — Hostage Situation (Geiselbefreiung)

> ScreenForge concept set · Scenario library · Exercise-design realism (fiction only) · Language: EN, UI labels DE
> Related: [01-exercise-anatomy-and-mel.md](01-exercise-anatomy-and-mel.md) · [00-realism-and-safety-framework.md](00-realism-and-safety-framework.md)

## Purpose

A screen-driven command exercise: locate, isolate, and resolve a fictional hostage situation through information management, communication, and coordination. The simulation provides cameras, maps, access control, comms, and medical surfaces; all tactical movement happens outside the simulation and is not prescribed by this file.

## Training goals

- Information management under time pressure (sources, reliability, gaps).
- Comms discipline across command, coordination, and medical channels.
- Decision making with incomplete information; documenting decisions.
- Medical handover and casualty documentation.

## Fiction (briefing)

A fictional research facility (company from [../catalog/20-companies-and-brands.md](../catalog/20-companies-and-brands.md)) reports an intruder situation in the archive wing; two staff members are unaccounted for. HQ operates remotely through facility systems.

## Device layout

| Station | Module | Role | Notes |
| --- | --- | --- | --- |
| HQ-1 | `tracking` | hq | map, zones, positions |
| HQ-2 | `comms` | hq | command channel, messages |
| CAM-1, CAM-2 | `camera` | player | archive corridor + lobby |
| ACC-1 | `access` | player | archive door control |
| LOCK-1 | `lock` | player | wing lockdown |
| MED-1 | `medical` | player | casualty monitor (patient bound) |
| TERM-1 | `terminal` | player | facility records / dossiers |

## Entities

| Entity | Type | Detail |
| --- | --- | --- |
| Patient-1 | patient | `stable`; deteriorates if untreated after T+09:00 |
| Dossier A | dossier | facility plan note (released T+02:00) |
| Dossier B | dossier | staff interview note (released T+07:00) |
| Zone-1 | zone | archive wing (restricted) |
| Zone-2 | zone | casualty location (revealed by inject) |
| Objective-1 | objective | locate both staff members |
| Objective-2 | objective | establish and hold comms with the location |
| Objective-3 | objective | resolve situation (manual by EXCON) |
| Objective-4 | objective | medical handover documented |

## MEL

| T+ | Inject | Trigger | Action | Purpose | Fallback |
| --- | --- | --- | --- | --- | --- |
| 00:00 | Exercise start | manual | clock play | orientation | — |
| 02:00 | Facility plan released | timer | release Dossier A | information start | comms message |
| 04:00 | Camera 2 fails | timer | camera offline | adapt sources | radio report |
| 06:00 | Comms drop (60 s) | timer | message `"Kanal belegt"` | discipline under loss | — |
| 07:00 | Interview note released | timer | release Dossier B | conflicting info | comms message |
| 09:00 | Casualty deteriorates | timer | patient `trauma` | medical response | — |
| 12:00 | Archive door relocks | prop | access relock | planning vs. reality | manual by EXCON |
| 15:00 | Resolution window | timer | message `"Lage klären"` | decision point | manual |
| 18:00 | End | timer | objective check | consolidation | — |

## Roles

- EXCON (1): runs MEL, manual injects, patient edits.
- Safety (1): abort authority; observes.
- Assessor (1–2): notes per event, criteria scoring.
- HQ (2): map/comms operators; the decision-making cell.
- Players (2–3): cameras, access/lock, terminal.
- Role players (2): facility staff (released interviews), optional caller.

## Objectives & evaluation

| Criterion | Observable | Weight |
| --- | --- | --- |
| Information handling | dossiers used, source comparison noted | 25 % |
| Comms discipline | channel use, silence window kept | 20 % |
| Timing | door held, medical response ≤ 3 min after inject | 20 % |
| Decision quality | resolution decision documented with rationale | 25 % |
| Documentation | handover note complete | 10 % |

## Variants

- Guided: 4 stations (HQ, camera, access, medical), 1 dossier, no comms drop.
- Advanced: full layout, comms drop, relock inject, role-player caller.
- PLAYBACK: routes and camera stills; for rehearsal and demo runs.

## Debrief questions

1. Which information changed your picture, and when?
2. Where did the comms drop hurt most?
3. How was the medical decision documented?
4. What would you do differently with the same time budget?

## Safety notes

- No tactical movement or intervention procedures are part of this exercise; the simulation ends at the resolution decision.
- Abort covers role-player welfare; pressure injects are configurable.
