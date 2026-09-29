# Scenario — Objective Clearance (Objektsicherung)

> ScreenForge concept set · Scenario library · Exercise-design realism (fiction only) · Language: EN, UI labels DE
> Related: [01-exercise-anatomy-and-mel.md](01-exercise-anatomy-and-mel.md) · [00-realism-and-safety-framework.md](00-realism-and-safety-framework.md)

## Purpose

A systematic-search and facility-security exercise: secure a fictional building section, search it in a structured way, and locate a target object — coordinated through cameras, access control, maps, and comms. Movement and search procedures happen outside the simulation and are not prescribed here.

## Training goals

- Systematic search organization and documentation (which areas, in what order, with what result).
- Use of facility systems (cameras, doors, locks) to support the search.
- Comms and reporting discipline; keeping HQ's picture current.
- Handling an unexpected find (payload) and a casualty.

## Fiction (briefing)

A fictional logistics company reports a tampered shipment; a target object (fictional `payload`) is hidden in one of the facility sections. HQ coordinates two teams through the facility systems.

## Device layout

| Station | Module | Role | Notes |
| --- | --- | --- | --- |
| HQ-1 | `tracking` | hq | floor plan zones, team positions |
| HQ-2 | `comms` | hq | command channel |
| CAM-1..3 | `camera` | player | entry, corridor, storage hall |
| ACC-1 | `access` | player | section doors |
| LOCK-1 | `lock` | player | emergency lockdown control |
| TERM-1 | `terminal` | player | inventory records, payload status |
| MED-1 | `medical` | player | optional casualty |

## Entities

| Entity | Type | Detail |
| --- | --- | --- |
| Payload-1 | prop (`payload`) | `empty` → `copied` when found via terminal |
| Zone-1..3 | zone | section A, B, C |
| Objective-1 | objective | sections searched and reported |
| Objective-2 | objective | payload located and status documented |
| Objective-3 | objective | facility secured (lockdown released) |
| Patient-1 (optional) | patient | `desat`; found in storage hall at T+10:00 |

## MEL

| T+ | Inject | Trigger | Action | Purpose | Fallback |
| --- | --- | --- | --- | --- | --- |
| 00:00 | Start | manual | clock play | orientation | — |
| 03:00 | Inventory mismatch report | timer | message | focus search | comms |
| 05:00 | Door ACC-1 fault | timer | access code change | adapt plan | manual |
| 08:00 | Alarm in section B | zone | message + camera focus | verify source | radio |
| 10:00 | Casualty found (optional) | zone | patient `desat` | medical coordination | — |
| 13:00 | Payload located | prop | terminal task enabled | documentation | manual |
| 16:00 | Lockdown test | manual | lock engaged | contingency | — |
| 20:00 | End | timer | objective check | consolidation | — |

## Roles

- EXCON (1): MEL, codes, patient edits.
- Safety (1): abort authority.
- Assessor (1–2): search documentation, comms notes.
- HQ (1–2): map and comms.
- Players (2–4): cameras, doors, terminal, medical.
- Role player (1): facility employee (optional interview).

## Objectives & evaluation

| Criterion | Observable | Weight |
| --- | --- | --- |
| Search organization | zones reported in order, no double-search | 30 % |
| System use | cameras and access used effectively | 20 % |
| Comms discipline | reports complete (what/where/status) | 20 % |
| Find handling | payload status documented via terminal | 15 % |
| Casualty handling | medical response and handover | 15 % |

## Variants

- Guided: 3 stations (HQ, camera, terminal), one zone, no casualty.
- Advanced: full layout, fault inject, casualty, lockdown test.
- PLAYBACK: pre-set routes for rehearsal.

## Debrief questions

1. Was the search plan visible to HQ at all times?
2. Which camera or report changed your focus, and why?
3. How was the find documented, and who could reproduce it?
4. Where did the access fault cost the most time?

## Safety notes

- No entry, movement, or search procedures are prescribed; the simulation evaluates organization, information, and documentation only.
- The optional casualty is simulated; abort and role-player welfare rules apply.
