# Plan 02 — Builder

> ScreenForge concept set · Implementation plan · Phase 2 · Language: EN, UI labels DE
> Concept: [../konzept/domain/04-mission-builder.md](../konzept/domain/04-mission-builder.md) · [../konzept/usability/03-advanced.md](../konzept/usability/03-advanced.md) · [../konzept/usability/04-builder-interaction.md](../konzept/usability/04-builder-interaction.md)

## Goal

Replace the form-first scenario editor with a drag & drop mission builder: 0..n devices, 0..n entities, live linter, no forced content, undo/redo, revision-safe save.

## Work packages

| ID | Work package | Size | Files |
| --- | --- | --- | --- |
| B1 | Builder shell: palette / board / inspector, Plan + Karte views | L | new `src/builder/MissionBuilder.tsx`, `builder.css` |
| B2 | Palette: modules, entities, injects, teams; search + groups | M | new `src/builder/Palette.tsx` |
| B3 | Board: device cards, entity chips, bindings, linter badge | L | new `src/builder/Board.tsx` |
| B4 | Inspector: immediate edits, multi-select summary | M | new `src/builder/Inspector.tsx` |
| B5 | Drag & drop (mouse, HTML5 DnD like SequenceEditor) | M | `src/builder/Board.tsx` |
| B6 | Touch (long-press) + keyboard alternatives | M | `src/builder/*` |
| B7 | Linter: severities, findings, one-click fixes | M | new `src/core/missionLint.ts`, `src/builder/Linter.tsx` |
| B8 | Defaults fix: new station = `terminal`, no binding; empty mission valid | S | `src/builder/*`, `src/core/training.ts` |
| B9 | Entity add/remove + bindings (drag + inspector) | M | `src/builder/*` |
| B10 | Undo/redo (≥ 50 steps) | M | new `src/builder/history.ts` |
| B11 | Save/revision/conflict handling | M | `src/builder/*`, `server/exercise.mjs` |
| B12 | Integrate into `TrainerView` and wizard escape hatch | M | `src/views/TrainerView.tsx`, `src/training/ScenarioWizard.tsx` |
| B13 | E2E: DnD + keyboard + linter + optional entities | M | `tests/builder.spec.ts` (new) |

## Details

- **B5/B6:** HTML5 DnD for mouse (reuse the `SequenceEditor` pattern); long-press pickup on touch; every drag has a button/keyboard equivalent (WCAG 2.1 AA).
- **B7:** severities `error` (blocks start) / `warning` / `info`; clicking a finding selects the item ([../konzept/domain/04-mission-builder.md](../konzept/domain/04-mission-builder.md)).
- **B8:** dropping a module NEVER auto-creates a patient/prop; the linter offers `"Entität anlegen"`.
- **B11:** edits only while `frozen`; save bumps revision; stale revision → `Neu laden` / `Als Kopie speichern`.
- Keep `ScenarioEditor.tsx` temporarily behind advanced-only until B12 is complete, then delete.

## Acceptance criteria

- [ ] Given an empty mission, dragging `Terminal` creates exactly one station with no entities.
- [ ] Given 0 patients and no medical module, `Prüfen` reports no error.
- [ ] Given a medical station without patient, the linter error offers `Patient anlegen`.
- [ ] Given keyboard-only use, a station and a binding can be created without a pointer.
- [ ] Given a running exercise, the builder is read-only and offers `Pause`.
- [ ] Given `Strg+Z` after a delete, the item and its bindings return.

## Tests

- Unit: linter rules (all severities), defaults, undo/redo reducer.
- E2E: drag module → station; invalid drop; keyboard add; save/revision conflict; read-only while running.

## Risks

| Risk | Mitigation |
| --- | --- |
| Touch DnD flaky | Long-press + explicit add buttons as primary path |
| Board performance at 40 stations | Virtualize cards; measure fps target ≥ 50 |
| Scope creep into runtime | Builder only edits mission data; runtime is Phase 4 |

## Docs to update

- Concept: builder gaps in [../konzept/domain/12-gap-analysis.md](../konzept/domain/12-gap-analysis.md).
- Lessons: append if DnD/touch or revision handling surprised you.
