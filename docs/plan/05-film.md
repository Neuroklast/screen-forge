# Plan 05 — Film & TV

> ScreenForge concept set · Implementation plan · Phase 5 · Language: EN, UI labels DE
> Concept: [../konzept/domain/09-film-tv.md](../konzept/domain/09-film-tv.md) · [../konzept/catalog/components/16-show-editor.md](../konzept/catalog/components/16-show-editor.md)

## Goal

Film mode becomes production-ready: deliberate stage routing (push + sync), a unified rehearsal flag, and the operations editor completed.

## Work packages

| ID | Work package | Size | Files |
| --- | --- | --- | --- |
| T1 | Output inventory: list online stage devices with name, resolution, last seen, kiosk state | M | new `src/core/stageTargets.ts`, `src/App.tsx` |
| T2 | Push scene/config to one or more devices without reload | L | `src/core/stageTargets.ts`, `src/App.tsx`, `src/views/StageFrame.tsx` |
| T3 | `Synchron` toggle: cue/take changes apply to all targets within 250 ms | M | `src/core/stageTargets.ts`, `src/App.tsx` |
| T4 | Rehearsal unification: `rehearsal` flag replaces `workspace: "training"`; migration | M | `src/core/config.ts`, `src/App.tsx` |
| T5 | Operations UI: expose `operation` (sequence) in the step inspector | S | `src/components/SequenceEditor.tsx` |
| T6 | Show linter + `onFail` cleanup on step delete | S | `src/core/director.ts`, `src/components/SequenceEditor.tsx` |
| T7 | Tests: push/sync, rehearsal migration, operations, show linter | M | `src/core/*.test.ts`, `tests/studio.spec.ts` |

## Details

- **T1/T2:** no server dependency; transport via `BroadcastChannel` + localStorage for the same origin, with optional WS if an exercise server is present. Devices on older versions get a `Neu laden` prompt.
- **T3:** sync is opt-in; default is independent devices (current behavior). Pinned kiosk devices are skipped by `alle` pushes unless forced.
- **T4:** `workspace: "training"` maps to `rehearsal: true` on load; timeout fields and take log keyed on `rehearsal`, not mode ([../konzept/domain/09-film-tv.md](../konzept/domain/09-film-tv.md)).
- **T6:** deleting a step clears both `next` and `onFail` references; linter flags unreachable steps, empty values, missing codes.

## Acceptance criteria

- [ ] Given two stage devices and `Synchron`, a take change switches both within 250 ms.
- [ ] Given a pinned kiosk device, an `alle` push skips it unless forced.
- [ ] Given `workspace: "training"` in a stored config, it loads as `rehearsal: true` with timeouts enabled.
- [ ] Given a step with `operation`, starting the step runs the sequence.
- [ ] Given a deleted step, no dangling `next`/`onFail` references remain.

## Tests

- Unit: stage target reducer, sync fan-out, config migration, director link cleanup, show linter.
- E2E: two tabs push/sync; kiosk skip; rehearsal toggle; operations start.

## Risks

| Risk | Mitigation |
| --- | --- |
| Cross-tab transport not available | BroadcastChannel feature-check; fall back to `Neu laden` prompt |
| Sync causes double-advance | Single source of truth for the running step; idempotent apply |
| Kiosk accidentally overwritten | Pinned devices excluded by default; explicit force required |

## Docs to update

- Concept: film gaps in [../konzept/domain/12-gap-analysis.md](../konzept/domain/12-gap-analysis.md).
- Lessons: append for cross-tab/sync surprises.
