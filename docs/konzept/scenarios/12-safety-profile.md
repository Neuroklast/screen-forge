# Scenarios — Safety Profile & Deconfliction

> ScreenForge concept set · Scenario library · Exercise-design realism (fiction only) · Language: EN, UI labels DE
> Framework: [00-realism-and-safety-framework.md](00-realism-and-safety-framework.md) · Checklist: [../../checklists/exercise-prep.md](../../checklists/exercise-prep.md)

## Purpose

A safety profile keeps a technically correct simulation from overriding the real situation. It is
metadata on the mission; it does not change the simulation logic.

## Safety profile fields

| Field | Purpose |
| --- | --- |
| `realEmergencyCode` | real emergency call-out, known to all staff |
| `exerciseStopSignal` | the word/signal that halts the exercise immediately |
| `safetyOfficer` | named responsible person |
| `restrictedZones[]` | areas excluded from play |
| `propRegister[]` | inert props, owner, distinct from real material |
| `realMedicalPlan` | real medical coverage, separate from simulation |
| `publicExposureRisk` | whether the public can see the scenario |
| `authorityNotifications[]` | notifications required before the run |
| `abortRecipients[]` | who receives the abort |

## Prop and legal framing (constraints, not legal advice)

| Area | Default rule |
| --- | --- |
| Weapon props | inert or legally checked |
| Transport | closed container, not publicly presented |
| Film set | property master / safety lead documents props |
| Airsoft | only on a suitable private/authorised field under its rules |
| Pyrotechnics | no DIY effects; external specialist responsibility |
| EOD props | fully inert and clearly documented internally |
| Public | no realistically perceived weapon/explosive scenario in uncontrolled public space |
| Abort | real safety overrides simulation immediately |

- German law is the operator's responsibility; § 42a WaffG (carrying imitation weapons) and the
  SprengG (explosives/pyrotechnics) are the relevant constraints. ScreenForge states the boundary and
  never supplies pyrotechnic or explosive features.

## Deconfliction as a product feature

- `EXERCISE` watermark on every training surface; `DEMO — FIKTIV` in demo mode.
- Abort reachable in ≤ 2 taps and shown on all devices ([../control/00-control-model.md](../control/00-control-model.md)).
- The stop signal is shown on the briefing and on the safety console.
- Every scenario declares `safetyProfile`; a missing profile is a linter warning before start.

## Acceptance criteria

- [ ] Given a scenario without a stop signal or safety officer, then the linter warns before start.
- [ ] Given an abort, then real safety is unaffected and all devices show the banner.
- [ ] Given a prop register entry, then the prop is marked inert and distinct from real material.
