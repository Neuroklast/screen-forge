# Plan 12 — Durable Engine

> ScreenForge concept set · Implementation plan · Phase 8 · Language: EN, UI labels DE
> Concept: [../konzept/control/05-sync-and-durability.md](../konzept/control/05-sync-and-durability.md) · [../konzept/domain/08-exercise-runtime.md](../konzept/domain/08-exercise-runtime.md) · [../konzept/usability/10-experience-profiles.md](../konzept/usability/10-experience-profiles.md)

## Goal

Turn the snapshot/WebSocket runtime into a durable, offline-capable command/event engine, then build
MEL v2, the guided builder and the professional layer on top — without a rewrite.

## Work packages

| ID | Work package | Size | Files |
| --- | --- | --- | --- |
| E1 | Protocol v2: envelope, `eventId` dedup, ACK/rejected, handshake | L | `server/exercise.mjs`, new `src/core/protocol.ts`, `src/core/useExercise.tsx` |
| E2 | Domain events + pure reducer + JSONL journal + snapshot + restart replay | XL | new `src/core/events.ts`, `src/core/training.ts`, `server/exercise.mjs` |
| E3 | Resume/delta + role-projected events | L | `server/exercise.mjs`, `src/core/protocol.ts`, `src/core/useExercise.tsx` |
| E4 | Clock: `serverNow`/`exerciseElapsed`/`deadlineAtServer`/`clockRevision` | M | new `src/core/clock.ts`, `server/exercise.mjs` |
| E5 | IndexedDB outbox + reconnect rebase/replay | L | new `src/core/outbox.ts`, `src/core/useExercise.tsx` |
| E6 | Telemetry store split (ring buffer + `useSyncExternalStore`) | M | new `src/core/telemetry.ts`, `src/core/useExercise.tsx` |
| E7 | MEL v2 fields/statuses/classes + reschedule audit | L | `src/core/training.ts`, `server/exercise.mjs`, `src/training/InjectScheduler.tsx` |
| E8 | Mission linter + dependency graph validator | L | `src/core/missionLint.ts`, new `src/core/graph.ts` |
| E9 | Live-MEL timeline + AAR replay (R10/R11) | L | `src/views/DebriefView.tsx`, new `src/training/MelTimeline.tsx`, `src/core/export.ts` |
| E10 | TaskBlock registry + generated builder | L | new `src/core/taskBlocks.ts`, `src/builder/MissionBuilder.tsx` |
| E11 | Easy wizard (story beats, ≤ 5 min) | M | `src/training/ScenarioWizard.tsx` |
| E12 | Three templates (airsoft, film, professional) + MSEL | M | `src/core/templates.ts`, `presets/missions/*.json` |
| E13 | Experience profiles + provenance/staleness + degradation | L | new `src/core/profiles.ts`, views |
| E14 | Patient model split + doctrine packs + MARCH/EOD states | L | `src/core/patient.ts`, `src/core/training.ts` |
| E15 | Symbology provider | M | new `src/core/symbology.ts` |
| E16 | MapAdapter + offline spike + field shell | M | new `src/map/adapters.ts`, docs |
| E17 | Optional desktop dependency graph (React Flow) | M | `src/builder/MissionBuilder.tsx` |

## Order and gates

1. **Wave 1 (critical):** E1 → E2 → E3, E4; E5 and E6 in parallel after E2.
2. **Wave 2 (engine value):** E7 → E8 → E9; E10 → E11 → E12 in parallel (engine-independent).
3. **Wave 3 (professional):** E13, E14, E15.
4. **Wave 4 (field):** E16; E17 optional.

- E2 unblocks R10/R11 (timeline replay, CSV export) from [10-backlog-runtime-to-cleanup.md](10-backlog-runtime-to-cleanup.md).
- Every wave MUST leave the app building and the checks green.

## Acceptance criteria

- [ ] Given a dropped link before ACK, exactly one domain effect exists after reconnect.
- [ ] Given a server restart mid-exercise, state resumes from snapshot + journal.
- [ ] Given a device clock off by ±5 min, the displayed deadline is authoritative.
- [ ] Given a MEL entry rescheduled, planned and actual times stay distinguishable in the AAR.
- [ ] Given a new task block, one registry definition provides schema, form and lint.
- [ ] Given a professional source, its age and quality are visible.

## Tests

- Unit: envelope/dedup, reducer determinism, journal replay, clock offset, MEL transitions, graph lint,
  registry defaults, doctrine pinning.
- Server: ACK/rejected, restart replay, role-projected events, redaction per new event type.
- E2E: offline command survives reconnect, countdown after freeze, abort banner, MEL reschedule.

## Risks

| Risk | Mitigation |
| --- | --- |
| Protocol churn breaks devices | version handshake; client+server ship together; e2e reconnect paths |
| Journal growth | domain events only; telemetry excluded; snapshot compaction |
| Event redaction leak | project events per role exactly like state; mandatory redaction tests |
| Dependency creep | each new dependency needs a recorded reason and size check |

## Docs to update

- Concept: [../konzept/control/05-sync-and-durability.md](../konzept/control/05-sync-and-durability.md),
  [../konzept/domain/08-exercise-runtime.md](../konzept/domain/08-exercise-runtime.md),
  [../konzept/domain/11-data-model.md](../konzept/domain/11-data-model.md),
  gap analysis.
- Lessons: append for protocol/replay surprises.
