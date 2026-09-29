# Scenario — Recon & Surveillance (Aufklärung)

> ScreenForge concept set · Scenario library · Exercise-design realism (fiction only) · Language: EN, UI labels DE
> Related: [01-exercise-anatomy-and-mel.md](01-exercise-anatomy-and-mel.md) · [00-realism-and-safety-framework.md](00-realism-and-safety-framework.md)

## Purpose

An observation and reporting exercise: build and maintain a picture from fictional sensor surfaces (cameras, tracking, beacon, messages) and deliver timely, structured reports. Real reconnaissance techniques are not part of this scenario.

## Training goals

- Source discipline: which information comes from where, how reliable is it.
- Structured, timely reporting (what/where/when/confidence).
- Maintaining a picture under degraded sensors.
- Recognizing and reporting pattern changes.

## Fiction (briefing)

A fictional facility reports unusual activity in a remote sector. A small cell observes through available sensors and reports to HQ; a fictional beacon marks a point of interest.

## Device layout

| Station | Module | Role | Notes |
| --- | --- | --- | --- |
| HQ-1 | `tracking` | hq | sector map, contacts, zones |
| HQ-2 | `comms` | hq | report channel |
| CAM-1, CAM-2 | `camera` | player | sector cameras (one fails as inject) |
| BEACON-1 | `beacon` | player | beacon activation/hold (optional path) |
| TERM-1 | `terminal` | player | archive records, pattern reference |
| OBS-1 | `tracking` | player | observer position (player GPS) |

## Entities

| Entity | Type | Detail |
| --- | --- | --- |
| Beacon-1 | prop (`beacon`) | `off` → `active` when activated; window-limited |
| Zone-1 | zone | sector of interest |
| Zone-2 | zone | observation point |
| Dossier A | dossier | previous activity log (released T+02:00) |
| Dossier B | dossier | vehicle registry note (released T+08:00) |
| Objective-1 | objective | sector under continuous observation |
| Objective-2 | objective | three structured reports delivered |
| Objective-3 | objective | pattern change reported within 5 min |

## MEL

| T+ | Inject | Trigger | Action | Purpose | Fallback |
| --- | --- | --- | --- | --- | --- |
| 00:00 | Start | manual | clock play | orientation | — |
| 02:00 | Previous log released | timer | release Dossier A | baseline | comms |
| 05:00 | Camera 1 fails | timer | camera offline | degraded picture | radio |
| 08:00 | Registry note released | timer | release Dossier B | cross-reference | comms |
| 10:00 | Contact appears | zone | message `"Bewegung Zone 1"` | observation start | manual |
| 13:00 | Signal interference | prop | beacon `interference` | resilience | — |
| 16:00 | Pattern change | manual | message + second contact | reporting test | comms |
| 20:00 | End | timer | objective check | consolidation | — |

## Roles

- EXCON (1): MEL, manual contacts, interference.
- Safety (1): abort authority.
- Assessor (1–2): report quality notes.
- HQ (1): report intake and picture.
- Players (2–3): cameras, beacon, observer.
- Role player (1, optional): field element for realism.

## Objectives & evaluation

| Criterion | Observable | Weight |
| --- | --- | --- |
| Source discipline | reports name source and confidence | 30 % |
| Timeliness | pattern change reported ≤ 5 min | 25 % |
| Structure | what/where/when complete | 25 % |
| Resilience | picture maintained after camera loss | 20 % |

## Variants

- Guided: 2 stations (HQ, camera), no interference.
- Advanced: full layout, camera loss, interference, second contact.
- PLAYBACK: scripted contacts for rehearsal.

## Debrief questions

1. Which report changed HQ's picture most?
2. How was confidence communicated?
3. What did you lose when camera 1 failed?
4. Where did the timeline break down?

## Safety notes

- No real surveillance, concealment, or collection techniques; the exercise evaluates reporting and information flow only.
- All contacts and locations are fictional.
