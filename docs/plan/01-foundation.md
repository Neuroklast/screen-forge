# Plan 01 — Foundation

> ScreenForge concept set · Implementation plan · Phase 1 · Language: EN, UI labels DE
> Concept: [../konzept/domain/03-modes-and-entry.md](../konzept/domain/03-modes-and-entry.md) · [../konzept/domain/02-roles.md](../konzept/domain/02-roles.md) · [../konzept/domain/11-data-model.md](../konzept/domain/11-data-model.md)

## Goal

A selectable entry point (start page), the full role model, and mission schema v2 with lossless migration — the base every later phase builds on.

## Work packages

| ID | Work package | Size | Files |
| --- | --- | --- | --- |
| F1 | Start page with mode cards, resume, role shortcuts, depth toggle | L | new `src/views/StartPage.tsx`, `src/main.tsx` |
| F2 | Resume per mode (studio config, mission draft, demo stop) | S | `src/core/session.ts`, `src/views/StartPage.tsx` |
| F3 | Role routing + aliases (`trainer→excon`, `element→player`, `film→director`) | M | `src/main.tsx`, `src/core/session.ts` |
| F4 | Depth setting (`guided`/`advanced`) persisted per device | S | `src/core/session.ts`, `src/views/StartPage.tsx` |
| F5 | Mission v2 schema (props, teams, actors, bindings, injects) | L | `src/core/training.ts` |
| F6 | v1→v2 migration (`scene→module`, `entityId→bindings.patient`, `rules→injects`) | M | `src/core/training.ts`, `src/core/migration.ts` (new) |
| F7 | Server accepts/persists v2 and projects new roles | M | `server/exercise.mjs` |
| F8 | Tests: migration, session/role parsing, server lifecycle | M | `src/core/*.test.ts`, `server/exercise.test.mjs` |

## Details

- **F1:** `/` without params MUST render the start page; deep links (`role`, `room`, `station`, `kiosk`, `demo`) bypass it. Cards: Film & TV, Training, Demo; footer notice; server status chip.
- **F3:** keep old links working; unknown roles fall back to the start page with a notice.
- **F5/F6:** version bump to `2`; v1 remains readable; migration is idempotent and lossless for known fields; unknown fields preserved where the schema allows ([../konzept/formats/04-import-export-migration.md](../konzept/formats/04-import-export-migration.md)).
- **F7:** projection gains role scoping for `safety`/`assessor`/`technician` (can be stubbed until Phase 4, but must not leak).
- **Deviation (F3):** the exercise wire protocol still uses the legacy role ids (`trainer`/`element`); canonical public roles (`excon`/`player`) map to them via `wireRole()` in [../../src/core/session.ts](../../src/core/session.ts). The protocol rename is task R1/R7 (Phase 4).
- **Migration mechanism (F5/F6):** `scenarioSchema` is `z.preprocess(normalizeScenario, scenarioV2Schema)`; v1 (`scene`/`entityId`/`rules`) and alias forms normalize to v2 on every parse, so import, server load and tests share one path. New entity arrays (`props`/`teams`/`actors`) default to empty.

## Acceptance criteria

- [ ] Given no params, `/` renders the start page in < 1 s with three mode cards.
- [ ] Given `?role=hq`, the HQ view opens without the start page; `?role=trainer` maps to `excon`.
- [ ] Given a v1 scenario file, it loads as v2 with identical runtime behavior.
- [ ] Given a mission export/import round-trip, entities and injects survive unchanged.
- [ ] Given depth `advanced` → `guided` switch, no advanced data is lost.

## Tests

- Unit: migration mappings, session parsing/aliases, depth persistence.
- Server: v1 payload accepted and stored as v2; restart persistence intact.
- E2E: start page renders; mode card opens each mode; deep link bypass.

## Risks

| Risk | Mitigation |
| --- | --- |
| Breaking existing QR/kiosk links | Aliases + tests for legacy URLs |
| Migration data loss | Idempotent migration + round-trip test |
| Start page slows kiosk entry | Deep links bypass; kiosk never routes via start page |

## Docs to update

- Concept: mark F-items done in [../konzept/domain/12-gap-analysis.md](../konzept/domain/12-gap-analysis.md).
- Lessons: append if migration or routing surprised you.
