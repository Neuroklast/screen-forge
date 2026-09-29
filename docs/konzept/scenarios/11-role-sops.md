# Scenarios — Role SOP Abstractions

> ScreenForge concept set · Scenario library · Exercise-design realism (fiction only) · Language: EN, UI labels DE
> Framework: [00-realism-and-safety-framework.md](00-realism-and-safety-framework.md) · Roles: [../domain/02-roles.md](../domain/02-roles.md)

## Purpose

A ScreenForge role SOP describes what a participant should **recognise, report, confirm or
document** — never how real force, breaching or disposal is technically executed. It is a
coordination and observation model, not a procedure manual.

## Operator (field)

```text
receive task → confirm objective/boundary → report READY → enter controlled area
→ work station/objective states → report changes → confirm objective → report handover/complete
```

Not in scope: formations, room clearance, fire and movement, target priorities, weapon handling.

## Access / Breaching (abstract)

The system knows access states, never a method to open a barrier:

```text
LOCKED → AUTHORIZED → SAFE → OPEN        (or ABORTED)
```

- Steps are EXCON/controller-driven; the participant reports `BLOCKED`, requests authorization and
  confirms `SAFE`/`OPEN`.
- For film and airsoft the release is fully electronic (hold-to-release), so no real technique is
  implied.

## Medic (assessment log)

MARCH appears only as an **assessment status sequence** with timestamps and reporting:

| Step | Meaning | Recorded as |
| --- | --- | --- |
| M | Massive hemorrhage | `assessed` / `pending` / `not-assessed` |
| A | Airway | status |
| R | Respiration | status |
| C | Circulation | status |
| H | Hypothermia / head injury | status |

- The app records `intervention.tourniquet.reported`, `airway.assessed`, timestamps and handover; it
  MUST NOT teach invasive or otherwise demanding medical measures.
- Real treatment methods come from an authorised medical/ first-aid training, not from ScreenForge.

## CBRNe / EOD (coordination only)

```text
UNKNOWN → SUSPECTED → ISOLATED → REPORTED → SPECIALIST_PENDING → CLEARED
```

- Training objective: recognise, stop interaction, keep distance, mark hazard, report, wait for a
  qualified release.
- Render-safe procedures, circuitry, initiation mechanisms and interference methods are NEVER part of
  the product; professional customers MAY add their own authorised evaluation criteria as private
  configuration.

## Acceptance criteria

- [ ] Given any role SOP, it contains no real procedure content (only states and reports).
- [ ] Given the Medic view, MARCH is a status log, not an instruction list.
- [ ] Given the Access view, opening is an EXCON/controller transition, not a described technique.
