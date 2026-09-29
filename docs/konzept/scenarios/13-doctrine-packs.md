# Scenarios — Doctrine Packs

> ScreenForge concept set · Scenario library · Exercise-design realism (fiction only) · Language: EN, UI labels DE
> Related: [07-medical-casualty-response.md](07-medical-casualty-response.md) · [11-role-sops.md](11-role-sops.md) · [../catalog/blocks/09-medical.md](../catalog/blocks/09-medical.md)

## Purpose

Medical rules and terminology change over time. ScreenForge MUST NOT hardcode today's guidance as
permanent truth. A **doctrine pack** is a versioned profile the mission references, so old exercises
stay reproducible.

## Pack shape

```text
doctrineId
version
effectiveDate
supportedTrainingObjectives
patientStateDefinitions
interventionVocabulary
evaluationRules
displayTerminology
references
```

- The instructor selects a pack when creating a mission; the mission stores `doctrineId@version`.
- An old exercise keeps its pinned version even after the pack is updated.
- Packs contain **terminology and state models**, not treatment instructions.

## Patient model split

```text
Underlying patient state
  ├── injury / exposure model
  ├── interventions
  ├── elapsed scenario time
  └── trainer overrides
          ↓
  physiological model
          ↓
  ┌───────┴────────┐
visible monitor   clinical findings
```

- A correct action changes parameters, probabilities or curves — not `patient = healed`.
- The trainer MAY deliberately deviate from the simulated physiology (override).
- Triage (`green/yellow/red/black`) is a **display profile**, not universal doctrine.

## Rules

- Doctrine packs are versioned; a breaking change bumps `version` and keeps the old pack readable.
- The medical block reads terminology and states from the selected pack.
- CBRNe/EOD packs stay coordination-only ([11-role-sops.md](11-role-sops.md)).

## Acceptance criteria

- [ ] Given a mission pinned to `medical@1`, updating the pack does not change its behaviour.
- [ ] Given an intervention, the patient state changes progressively, never to an instant "healed".
- [ ] Given a trainer override, it takes precedence over the simulated physiology.
