# Scenario — Ordnance Disposal (Sprengkörper entschärfen, fiktiv)

> ScreenForge concept set · Scenario library · Exercise-design realism (fiction only) · Language: EN, UI labels DE
> Related: [01-exercise-anatomy-and-mel.md](01-exercise-anatomy-and-mel.md) · [../domain/06-entities-and-props.md](../domain/06-entities-and-props.md)

## Purpose

A fictional device-disposal coordination exercise: identify a fictional ordnance prop, establish a cordon, work through abstract console stages, and document the result. The device is deliberately abstract — no real explosive, wiring, or procedure content appears anywhere.

## Coordination state machine

```text
UNKNOWN → SUSPECTED → ISOLATED → REPORTED → SPECIALIST_PENDING → CLEARED
```

- The exercise trains recognition, isolation, reporting and waiting for a qualified release.
- No render-safe procedure, circuitry or initiation detail appears anywhere ([11-role-sops.md](11-role-sops.md)).

## Training goals

- Procedure adherence on a staged console (order matters; errors are recoverable but visible).
- Cordon and zone management with time pressure.
- Comms discipline and decision documentation.
- Evacuation decision and medical contingency.

## Fiction (briefing)

A fictional maintenance depot reports an unidentified device (`Containment-Baugruppe`, series 09). The cell coordinates from HQ; a fictional console shows diagnostics and abstract bypass stages.

## Device layout

| Station | Module | Role | Notes |
| --- | --- | --- | --- |
| ORD-1 | `ordnance` | player | fictional console: diagnose → stages → disarm |
| TERM-1 | `terminal` | player | maintenance records, stage code |
| CAM-1 | `camera` | player | device bay camera |
| HQ-1 | `tracking` | hq | cordon zones, positions |
| HQ-2 | `comms` | hq | command channel |
| DATA-1 | `data-sheet` | player | schematic + disposal steps to read and relay via comms |
| MED-1 (optional) | `medical` | player | contingency casualty |

## Entities

| Entity | Type | Detail |
| --- | --- | --- |
| Ordnance-1 | prop (`ordnance`) | `armed` → (`tampered`) / `bypassed[1..4]` → `disarmed` |
| Zone-1 | zone | cordon (inner) |
| Zone-2 | zone | evacuation area (outer) |
| Objective-1 | objective | cordon established and reported |
| Objective-2 | objective | diagnostics complete |
| Objective-3 | objective | all bypass stages passed in order |
| Objective-4 | objective | device disarmed and documented |

## MEL

| T+ | Inject | Trigger | Action | Purpose | Fallback |
| --- | --- | --- | --- | --- | --- |
| 00:00 | Start, device discovered | manual | clock play | orientation | — |
| 02:00 | Cordon order | manual | zone message | zone management | comms |
| 05:00 | Diagnostics available | timer | terminal task enabled | procedure start | manual |
| 08:00 | Wrong-stage window | prop | `tampered` if stage order broken | procedure discipline | reset stage |
| 10:00 | Countdown visible | timer | countdown starts (fictional) | time pressure | manual |
| 13:00 | Comms interference | timer | 60 s channel loss | resilience | — |
| 16:00 | Disarm window | timer | stages complete → `disarmed` | success path | manual |
| 18:00 | Contingency (optional) | manual | patient `trauma` | medical response | — |
| 20:00 | End | timer | objective check | consolidation | — |

## Roles

- EXCON (1): MEL, stage resets, optional contingency.
- Safety (1): abort authority; real-world safety lead.
- Assessor (1–2): procedure order and documentation.
- HQ (2): cordon and comms.
- Players (2): console, terminal/camera.
- Role player (1, optional): depot worker.

## Objectives & evaluation

| Criterion | Observable | Weight |
| --- | --- | --- |
| Procedure order | stages passed in sequence; no unresolved tamper | 35 % |
| Zone management | cordon reported and held | 20 % |
| Time discipline | stages complete before window closes | 20 % |
| Documentation | final report complete and reproducible | 25 % |

## Variants

- Guided: 2 stations (console, HQ), no tamper, no countdown.
- Advanced: full layout, tamper inject, countdown, contingency casualty.
- PLAYBACK: fixed stage timeline for rehearsal.

## Debrief questions

1. What told you the stage order mattered?
2. How did the countdown change decisions?
3. Where did the comms loss bite?
4. Is the final report reproducible by someone who was not there?

## Safety notes

- The device is entirely fictional and abstract; NEVER add real wiring, chemistry, or procedure detail (principle P1).
- Real-world EOD safety and procedure authority rest with the operating organization, not the simulation.
- Abort is available at all times; a `tampered` state is recoverable by design.
