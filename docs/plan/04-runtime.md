# Plan 04 — Runtime & Control

> ScreenForge concept set · Implementation plan · Phase 4 · Language: EN, UI labels DE
> Concept: [../konzept/domain/08-exercise-runtime.md](../konzept/domain/08-exercise-runtime.md) · [../konzept/control/](../konzept/control/00-control-model.md) · [../konzept/domain/02-roles.md](../konzept/domain/02-roles.md)

## Goal

Full exercise control: explicit phases, inject orchestration (manual, hold/skip, macros), safety/assessor roles, comms, readiness/monitoring, and a real debrief.

## Work packages

| ID | Work package | Size | Files |
| --- | --- | --- | --- |
| R1 | Server phase model (draft/ready/running/paused/aborted/ended) | M | `server/exercise.mjs`, `src/core/training.ts` |
| R2 | Trigger `manual` + engine support | M | `src/core/training.ts`, `server/exercise.mjs` |
| R3 | Action v2: `prop`, `lock`, `beacon`, `ordnance`, `sound`, `state`, `inject` (chain ≤ 3) | L | `src/core/training.ts`, `server/exercise.mjs` |
| R4 | MEL scheduler panel: upcoming, fire, hold/resume, skip, re-fire, effect preview | L | new `src/training/InjectScheduler.tsx` |
| R5 | Macros + hotkeys (F1–F8, `M`) | M | new `src/core/macros.ts`, `src/training/InjectScheduler.tsx` |
| R6 | Safety role + view + abort (≤ 2 taps, banner all devices) | M | new `src/views/SafetyView.tsx`, `server/exercise.mjs` |
| R7 | Assessor role + view + notes/scores | M | new `src/views/AssessorView.tsx`, `server/exercise.mjs` |
| R8 | Comms: message model, composer, device drawer, ack | L | `src/core/training.ts`, new `src/training/Composer.tsx`, `MessageDrawer.tsx` |
| R9 | Notifications (objective, inject, device, camera) | M | `src/core/training.ts`, views |
| R10 | Debrief timeline + deterministic replay (seek/step) | L | new `src/views/DebriefView.tsx` |
| R11 | Exports: JSON, CSV, print summary, GPS tracks | M | new `src/core/export.ts` |
| R12 | Readiness automation + alerts | M | `src/training/DeviceTools.tsx`, new `src/training/ReadinessPanel.tsx` |
| R13 | Remote device actions (reload, lock, wake, reset, revoke) | M | `server/exercise.mjs`, `src/training/DeviceTools.tsx` |
| R14 | Multi-room dashboard | M | new `src/views/RoomsView.tsx`, `server/exercise.mjs` |
| R15 | Tests: phases, injects, safety abort, redaction, replay | L | `src/core/*.test.ts`, `server/exercise.test.mjs`, `tests/*.spec.ts` |

## Details

- **R1:** transitions logged with role + time; edits only in draft/ready/paused; `aborted` cannot resume (only reset).
- **R4/R5:** the scheduler is EXCON-only; macros are mission data; firing blocked while paused except explicit manual fire.
- **R6:** safety abort works without EXCON session and without round-trip blocking; banner on every device within one tick.
- **R7:** assessor is read-mostly + notes/scores; never mutates exercise state except notes.
- **R8:** text-first, offline queue, ack tracking; silence windows block outgoing but never incoming.
- **R10/R11:** replay is read-only and deterministic (seed); exports offline, deterministic file names.
- **R12/R13:** device ACK protocol (module ready, permissions, battery, version, clock offset); remote actions acknowledged.

## Acceptance criteria

- [ ] Given a running exercise, EXCON fires a manual inject; all affected roles update within one tick.
- [ ] Given safety abort, every device shows the banner within one tick and the log records role + time.
- [ ] Given a held timer, it does not fire until resumed; both events are logged.
- [ ] Given an EXCON message, targeted devices show it within one tick; unacked stations are listed.
- [ ] Given a finished exercise, the timeline contains every event and exports reconstruct the run.
- [ ] Given two rooms, the dashboard shows both with live phase and device counts.

## Tests

- Unit: phase transitions, manual/held/skipped injects, action v2, macro application, message ack.
- Server: safety abort without EXCON, redaction for safety/assessor/technician, persistence across restart.
- E2E: abort banner, message to device, debrief export, readiness gating.

## Risks

| Risk | Mitigation |
| --- | --- |
| Protocol churn breaks devices | Version the protocol; keep old messages readable one cycle |
| Abort reliability | Server-side capability independent of session; test disconnect path |
| Full-state broadcast load | Role-scoped payloads; measure tick p95 at 40 stations |

## Docs to update

- Concept: runtime/control gaps in [../konzept/domain/12-gap-analysis.md](../konzept/domain/12-gap-analysis.md).
- Lessons: append for protocol/abort surprises.
