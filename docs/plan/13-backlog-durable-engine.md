# Plan 13 — Backlog: Durable Engine

> ScreenForge concept set · Implementation plan · Task backlog (phase 8) · Language: EN
> Phase details: [12-durable-engine.md](12-durable-engine.md)
> Status: `todo` / `doing` / `done`. Update the row when the task ships.

## Progress

- Done: E1 protocol v2; E2 domain events + journal + replay; E3 resume delta; E4 clock; E5 outbox; E6 telemetry store; E7 MEL v2; E8 graph linter.
- Doing: —
- Open: E9–E17.

## Wave 1 — Critical

| ID | Task | File(s) | Depends | Done when |
| --- | --- | --- | --- | --- |
| E1 | Protocol v2 envelope, `eventId` dedup, ACK/rejected, handshake | `server/exercise.mjs`, `src/core/protocol.ts`, `src/core/useExercise.tsx` | — | duplicate ×100 → one effect |
| E2 | Domain events + reducer + JSONL journal + snapshot + restart replay | `src/core/events.ts`, `src/core/training.ts`, `server/exercise.mjs` | E1 | replay twice → identical state |
| E3 | Resume/delta + role-projected events | `server/exercise.mjs`, `src/core/protocol.ts` | E2 | offline 30 min → ordered reconciliation |
| E4 | Clock model + offset + deadline authority | `src/core/clock.ts`, `server/exercise.mjs` | E1 | ±5 min clock → same deadline |
| E5 | IndexedDB outbox + reconnect rebase/replay | `src/core/outbox.ts`, `src/core/useExercise.tsx` | E2 | disconnect before ACK → one effect |
| E6 | Telemetry store split | `src/core/telemetry.ts`, `src/core/useExercise.tsx` | E2 | sustained rate → bounded memory |

## Wave 2 — Engine value

| ID | Task | File(s) | Depends | Done when |
| --- | --- | --- | --- | --- |
| E7 | MEL v2 fields/statuses/classes + reschedule audit | `src/core/training.ts`, `server/exercise.mjs`, `src/training/InjectScheduler.tsx` | E2 | reschedule keeps `plannedAt` |
| E8 | Linter + dependency graph validator | `src/core/missionLint.ts`, `src/core/graph.ts` | E7 | rule classes detected |
| E9 | Live-MEL timeline + AAR replay (R10/R11) | `src/views/DebriefView.tsx`, `src/training/MelTimeline.tsx`, `src/core/export.ts` | E2 | replay matches run |
| E10 | TaskBlock registry + generated builder | `src/core/taskBlocks.ts`, `src/builder/MissionBuilder.tsx` | — | new block = one definition |
| E11 | Easy wizard (story beats) | `src/training/ScenarioWizard.tsx` | E12 | ≤ 5 min valid mission |
| E12 | Three templates + MSEL | `src/core/templates.ts`, `presets/missions/*.json` | — | templates validate |

## Wave 3 — Professional

| ID | Task | File(s) | Depends | Done when |
| --- | --- | --- | --- | --- |
| E13 | Experience profiles + provenance/staleness + degradation | `src/core/profiles.ts`, views | E7 | stale source visible |
| E14 | Patient split + doctrine packs + MARCH/EOD states | `src/core/patient.ts`, `src/core/training.ts` | E7 | doctrine pinning reproducible |
| E15 | Symbology provider | `src/core/symbology.ts` | E13 | version-pinned rendering |

## Wave 4 — Field

| ID | Task | File(s) | Depends | Done when |
| --- | --- | --- | --- | --- |
| E16 | MapAdapter + offline spike + field shell | `src/map/adapters.ts`, docs | E13 | offline map renders, spike recorded |
| E17 | Optional desktop dependency graph | `src/builder/MissionBuilder.tsx` | E10 | graph view optional |

## Working rules

- Keep the protocol versioned and tested; never silently drop a control command.
- Project events per role; add a redaction test for every new event type.
- Mark `done` only after the DoD ([08](08-tests-and-dod.md)); update the concept gap analysis.
