# Scenario — Counter-Intrusion (Einbruch & Datenzugriff)

> ScreenForge concept set · Scenario library · Exercise-design realism (fiction only) · Language: EN, UI labels DE
> Related: [01-exercise-anatomy-and-mel.md](01-exercise-anatomy-and-mel.md) · [../catalog/scenes/02-network-terminal-shell.md](../catalog/scenes/02-network-terminal-shell.md)

## Purpose

A detection-and-response exercise: verify an intrusion alarm through cameras and records, decide on lockdown, coordinate with HQ, and document the timeline. This is a screen- and information-driven scenario; physical response procedures happen outside the simulation.

## Training goals

- Alarm verification discipline (confirm before acting; avoid escalation on false positives).
- Lockdown decision quality and timing.
- Coordination across cameras, access, and records.
- Complete incident timeline documentation.

## Fiction (briefing)

A fictional facility reports a perimeter alarm near the server room. The cell verifies, protects the data area, and documents the incident. A fictional `payload` (data core) is the protected asset.

## Device layout

| Station | Module | Role | Notes |
| --- | --- | --- | --- |
| HQ-1 | `tracking` | hq | zones, positions, perimeter |
| HQ-2 | `comms` | hq | command channel |
| CAM-1..3 | `camera` | player | perimeter, corridor, server room |
| ACC-1 | `access` | player | server room door |
| LOCK-1 | `lock` | player | facility lockdown |
| TERM-1 | `terminal` | player | access logs, payload status |
| OS-1 (optional) | `os` | player | network records |

## Entities

| Entity | Type | Detail |
| --- | --- | --- |
| Payload-1 | prop (`payload`) | protected asset; `copied` if access succeeds (failure path) |
| Dossier A | dossier | access log note (released T+03:00) |
| Zone-1, Zone-2 | zone | perimeter, server room |
| Objective-1 | objective | alarm verified (true or false) and reported |
| Objective-2 | objective | server room secured before access |
| Objective-3 | objective | timeline documented with sources |
| Objective-4 | objective | payload status confirmed |

## MEL

| T+ | Inject | Trigger | Action | Purpose | Fallback |
| --- | --- | --- | --- | --- | --- |
| 00:00 | Start | manual | clock play | orientation | — |
| 02:00 | Perimeter alarm | timer | message + camera focus | verification start | manual |
| 03:00 | Access log released | timer | release Dossier A | cross-check | comms |
| 05:00 | False-positive option | manual | second alarm elsewhere | verification discipline | — |
| 07:00 | Door attempt | prop | access code change | lockdown timing | manual |
| 09:00 | Comms interference | timer | 60 s channel loss | resilience | — |
| 11:00 | Data access attempt | prop | terminal task enabled | protected asset | manual |
| 14:00 | Resolution | manual | lockdown released | decision documentation | — |
| 16:00 | End | timer | objective check | consolidation | — |

## Roles

- EXCON (1): MEL, alarms, false-positive option.
- Safety (1): abort authority.
- Assessor (1–2): verification and timeline notes.
- HQ (2): picture and comms.
- Players (2–3): cameras, access/lock, terminal.
- Role player (1, optional): employee on site.

## Objectives & evaluation

| Criterion | Observable | Weight |
| --- | --- | --- |
| Verification | alarm confirmed or dismissed with sources | 30 % |
| Lockdown timing | server room secured ≤ 3 min after confirmation | 25 % |
| Coordination | all cells kept current | 20 % |
| Documentation | timeline with timestamps and sources | 25 % |

## Variants

- Guided: 2 stations (HQ, camera), no false-positive option.
- Advanced: full layout, false-positive, comms loss, data access attempt.
- PLAYBACK: scripted alarm timeline for rehearsal.

## Debrief questions

1. What convinced you the alarm was real (or false)?
2. How long did the lockdown decision take, and what gated it?
3. Which source was missing from the timeline?
4. What would have protected the payload earlier?

## Safety notes

- No physical response, detention, or cyber techniques are described; the exercise evaluates verification, decisions, and documentation.
- All logs and assets are fictional; no real systems are probed or accessed.
