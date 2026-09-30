# Plan 10 — Backlog: Runtime → Cleanup

> ScreenForge concept set · Implementation plan · Task backlog (phases 4–7) · Language: EN
> Phase details: [04-runtime.md](04-runtime.md) · [05-film.md](05-film.md) · [06-demo.md](06-demo.md) · [07-cleanup.md](07-cleanup.md)
> Status: `todo` / `doing` / `done`. Update the row when the task ships.

## Progress

- Done: R1 server phase model + abort, R2 manual trigger + `fire`, R3 prop action, R4 MEL scheduler (fire/enable + effect state), R6 safety view + abort banner, R7 assessor view + notes, R15 tests ([../../server/exercise-control.test.mjs](../../server/exercise-control.test.mjs), [../../src/core/control.test.ts](../../src/core/control.test.ts)).
- Done: R8/R9 comms — EXCON message composer (all/HQ/station) with server-side storage and per-role projection; element and HQ views show a message drawer. R11 partial — CSV export of the event log added.
- Done: D1–D7 demo mode — `/?demo=1` / `?mode=demo` hub, bundled seed (`demoContent`), 7-stop guided tour (`tour.json`), sandbox reset, kiosk idle restart + presenter PIN, offline guard (no `/exercise` socket), tests.
- Partial: R10/R11 — event log, notes and CSV export done; timeline replay is still open.
- Open: R5 macros, R12 readiness automation, R13 remote device actions, R14 multi-room dashboard.

## Phase 4 — Runtime & Control

| ID | Task | File(s) | Depends | Done when |
| --- | --- | --- | --- | --- |
| R1 | Server phase model + transitions | `server/exercise.mjs`, `src/core/training.ts` | F7 | phases logged |
| R2 | Trigger `manual` | `src/core/training.ts`, `server/exercise.mjs` | R1 | EXCON fires |
| R3 | Action v2 (prop/lock/beacon/ordnance/sound/state/inject) | `src/core/training.ts`, `server/exercise.mjs` | C1, C4 | all actions tested |
| R4 | MEL scheduler panel (fire/hold/skip/refire/preview) | `src/training/InjectScheduler.tsx` | R2 | actions logged |
| R5 | Macros + hotkeys | `src/core/macros.ts`, `src/training/InjectScheduler.tsx` | R4 | macro applies |
| R6 | Safety view + abort + banner | `src/views/SafetyView.tsx`, `server/exercise.mjs` | R1 | ≤ 2 taps, all devices |
| R7 | Assessor view + notes/scores | `src/views/AssessorView.tsx`, `server/exercise.mjs` | R1 | notes persist |
| R8 | Comms: model, composer, drawer, ack | `src/core/training.ts`, `src/training/Composer.tsx`, `MessageDrawer.tsx` | R1 | delivery + ack |
| R9 | Notifications | `src/core/training.ts`, views | R8 | events surfaced |
| R10 | Debrief timeline + replay | `src/views/DebriefView.tsx` | R1 | seek matches run |
| R11 | Exports JSON/CSV/print/GPS | `src/core/export.ts` | R10 | reconstructable |
| R12 | Readiness automation + alerts | `src/training/ReadinessPanel.tsx`, `DeviceTools.tsx` | R1 | gating works |
| R13 | Remote device actions | `server/exercise.mjs`, `src/training/DeviceTools.tsx` | R12 | ack + effect |
| R14 | Multi-room dashboard | `src/views/RoomsView.tsx`, `server/exercise.mjs` | R1 | two rooms shown |
| R15 | Tests: phases/injects/abort/replay | `src/core/*.test.ts`, `server/exercise.test.mjs`, `tests/*.spec.ts` | R1–R14 | green |

## Phase 5 — Film & TV

| ID | Task | File(s) | Depends | Done when |
| --- | --- | --- | --- | --- |
| T1 | Output inventory | `src/core/stageTargets.ts`, `src/App.tsx` | F3 | devices listed |
| T2 | Push scene/config | `src/core/stageTargets.ts`, `src/App.tsx`, `src/views/StageFrame.tsx` | T1 | no reload needed |
| T3 | `Synchron` toggle | `src/core/stageTargets.ts`, `src/App.tsx` | T2 | ≤ 250 ms fan-out |
| T4 | Rehearsal unification + migration | `src/core/config.ts`, `src/App.tsx` | — | `training`→`rehearsal` |
| T5 | Operations UI in inspector | `src/components/SequenceEditor.tsx` | — | sequence runs |
| T6 | Show linter + `onFail` cleanup | `src/core/director.ts`, `src/components/SequenceEditor.tsx` | — | no dangling links |
| T7 | Tests: push/sync/rehearsal/show | `src/core/*.test.ts`, `tests/studio.spec.ts` | T1–T6 | green |

## Phase 6 — Demo

| ID | Task | File(s) | Depends | Done when |
| --- | --- | --- | --- | --- |
| D1 | Demo hub + route | `src/demo/DemoHub.tsx`, `src/main.tsx`, `src/views/StartPage.tsx` | F1 | `/` card opens |
| D2 | Seeded content | `src/core/demoContent.ts` | C5 | validates |
| D3 | Guided tour (7 stops) | `src/demo/Tour.tsx`, `src/demo/tour.json` | D1 | end-to-end |
| D4 | Sandbox + reset | `src/demo/DemoHub.tsx` | B1, D2 | reset exact |
| D5 | Kiosk idle restart + PIN | `src/demo/DemoHub.tsx` | D3 | 90 s restart |
| D6 | Offline guard (no WS) | `src/demo/DemoHub.tsx`, `src/core/useExercise.tsx` | D1 | no socket |
| D7 | Tests: offline/reset/kiosk | `tests/demo.spec.ts` | D3–D6 | green |

## Phase 7 — Cleanup & Assets

| ID | Task | File(s) | Depends | Done when |
| --- | --- | --- | --- | --- |
| X1 | `.gitignore` `secret data/` | `.gitignore` | — | not untracked |
| X2 | Media pack decision + tracking | `public/media/` | X1 | fresh clone seeds |
| X3 | Remove duplicate asset + `index.json` | `public/media/` | X2 | no dupes |
| X4 | Remove dead code | `src/core/sound.ts`, `src/core/dossiers.ts` | R5 | grep clean |
| X5 | Sounds assign/remove + licenses | `src/core/sound.ts`, `sounds/manifest.json` | C8 | manifest complete |
| X6 | Fix/remove OS Workspace app | `src/scenes/os/CyberOS.tsx` | — | no dead icon |
| X7 | HQ GPS toggle fix | `src/training/DeviceTools.tsx`, `server/exercise.mjs` | R1 | consistent |
| X8 | Fonts wire or reduce | `src/fonts.css`, `src/App.tsx`, `src/core/config.ts` | — | no inert option |
| X9 | README update | `README.md` | F1, R1 | matches code |
| X10 | Favicon link | `index.html` | — | icon loads |
| X11 | Preview images cleanup | `docs/previews/` | — | no dupes |

## Working rules

- Runtime tasks (R) are the largest block; keep protocol changes versioned and tested.
- Film (T) and Demo (D) can run in parallel with Runtime once Foundation is done.
- Cleanup (X) can be done anytime but MUST NOT break build/e2e.
- Mark `done` only after the DoD ([08](08-tests-and-dod.md)); update the concept gap analysis.
