# Scenario — Casualty Response (Medizinischer Notfall)

> ScreenForge concept set · Scenario library · Exercise-design realism (fiction only) · Language: EN, UI labels DE
> Related: [01-exercise-anatomy-and-mel.md](01-exercise-anatomy-and-mel.md) · [../catalog/blocks/09-medical.md](../catalog/blocks/09-medical.md)

## Purpose

A casualty-response coordination drill: triage simulated patients, perform abstract interventions in the right order, coordinate evacuation, and produce a handover note. The simulation uses abstract intervention events — it contains no real medical procedure content.

## Training goals

- Triage under time pressure with two casualties.
- Correct intervention order per the mission's configuration.
- Evacuation coordination and route use.
- Complete, structured handover documentation.

## Fiction (briefing)

A fictional facility reports an accident with two casualties. The medical station, HQ, and a transport route are available; the cell coordinates response and documentation.

## Device layout

| Station | Module | Role | Notes |
| --- | --- | --- | --- |
| MED-1 | `medical` | player | Patient-1 bound |
| MED-2 | `medical` | player | Patient-2 bound (advanced variant) |
| HQ-1 | `tracking` | hq | evacuation route, zones |
| HQ-2 | `comms` | hq | medical channel |
| TERM-1 | `terminal` | player | patient records, handover form |
| CAM-1 (optional) | `camera` | player | scene overview |

## Entities

| Entity | Type | Detail |
| --- | --- | --- |
| Patient-1 | patient | `trauma`; deteriorates unless `tourniquet` within 4 min |
| Patient-2 | patient | `desat`; deteriorates unless `oxygen` within 6 min (advanced) |
| Zone-1 | zone | evacuation point |
| Objective-1 | objective | both casualties triaged |
| Objective-2 | objective | correct interventions in order |
| Objective-3 | objective | evacuation coordinated to Zone-1 |
| Objective-4 | objective | handover note completed |

## Assessment log

The Medic view records MARCH as an assessment status sequence (M/A/R/C/H each `assessed` /
`pending` / `not-assessed`) with timestamps and a report action — no procedure instructions
([11-role-sops.md](11-role-sops.md), [13-doctrine-packs.md](13-doctrine-packs.md)).

## MEL

| T+ | Inject | Trigger | Action | Purpose | Fallback |
| --- | --- | --- | --- | --- | --- |
| 00:00 | Start, Patient-1 reported | manual | clock play | orientation | — |
| 03:00 | Triage reminder | timer | message `"Triage offen"` | documentation | comms |
| 04:00 | Deterioration window 1 | timer | Patient-1 worsens unless treated | intervention order | — |
| 06:00 | Patient-2 found | timer | second patient appears | resource split | manual |
| 08:00 | Evacuation window | timer | message `"Transport bereit"` | coordination | comms |
| 11:00 | Route blocked (optional) | zone | route edit | replanning | manual |
| 14:00 | Handover deadline | timer | note due | documentation | — |
| 16:00 | End | timer | objective check | consolidation | — |

## Roles

- EXCON (1): MEL, patient edits, windows.
- Safety (1): abort authority.
- Assessor (1–2): triage and documentation notes.
- HQ (1): coordination and route.
- Players (2–3): medical stations, terminal, camera.
- Role player (1, optional): casualty actor (welfare rules apply).

## Objectives & evaluation

| Criterion | Observable | Weight |
| --- | --- | --- |
| Triage | both patients categorized before treatment | 25 % |
| Intervention order | configured order respected, windows met | 30 % |
| Coordination | transport and route confirmed | 20 % |
| Documentation | handover complete, reproducible | 25 % |

## Variants

- Guided: 1 patient, 2 stations (medical, HQ), no route edit.
- Advanced: 2 patients, route block, handover deadline.
- PLAYBACK: fixed deterioration timeline for rehearsal.

## Debrief questions

1. How was the order of interventions decided?
2. What did the second casualty change?
3. Was the handover note enough for a third person?
4. Where did communication cost time?

## Safety notes

- Interventions are abstract simulation events (`treated`, `tourniquet`, `oxygen`, `evacuated`); no real medical procedures are described or implied.
- Casualty role players get welfare rules, a stop signal, and a debrief; abort is always available.
