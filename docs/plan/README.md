# Plan — Implementation

> ScreenForge concept set · Implementation plan (target state) · Language: EN, UI labels DE
> Concept is the SSOT: [../konzept/README.md](../konzept/README.md) · Feature gaps: [../konzept/domain/12-gap-analysis.md](../konzept/domain/12-gap-analysis.md) · Asset gaps: [../konzept/catalog/23-asset-and-catalog-gaps.md](../konzept/catalog/23-asset-and-catalog-gaps.md)

## How to use this plan

1. Read [00-guardrails.md](00-guardrails.md) first — non-negotiables for every change.
2. Read the phase file you are implementing (01–07) plus [08-tests-and-dod.md](08-tests-and-dod.md).
3. Pick the next task from the matching backlog: [09-backlog-foundation-to-catalog.md](09-backlog-foundation-to-catalog.md) or [10-backlog-runtime-to-cleanup.md](10-backlog-runtime-to-cleanup.md).
4. Update the concept gap analysis in the same change; add a lesson if something surprised you ([../lessons/README.md](../lessons/README.md)).

- Tasks have stable ids (`F1`, `B3`, `R2`, `T4`, `D5`, `X9`); the backlog is the working order.
- A phase is done when its acceptance criteria pass as tests and the DoD in [08](08-tests-and-dod.md) is met.

## Project facts

| Item | Value |
| --- | --- |
| Stack | React 19, TypeScript 7, Vite 8, Zod 4, motion, three, Leaflet, `ws` server |
| Package manager | npm (`package-lock.json`) |
| Node | >= 24 |
| Check | `npm run check` (tsc --noEmit) |
| Unit/server tests | `npm test` (vitest `src/core` + `node --test server/*.test.mjs`) |
| Build | `npm run build` (tsc + vite build) |
| E2E | `npm run test:e2e` (Playwright) |
| Dev servers | `npm run dev` (5173), `npm run exercise` (8787, key from console) |
| CI | [.github/workflows/ci.yml](../../.github/workflows/ci.yml) runs check/test/build/e2e |

## Phases

| # | Phase | File | Depends on | Size | Outcome |
| --- | --- | --- | --- | --- | --- |
| 1 | Foundation | [01-foundation.md](01-foundation.md) | — | L | Start page, roles/routing, mission v2 + migration |
| 2 | Builder | [02-builder.md](02-builder.md) | 1 | L | Drag & drop mission assembly, linter, optional entities |
| 3 | Catalog | [03-catalog.md](03-catalog.md) | 1 | M | Props, ordnance/beacon modules, 9 templates + gallery |
| 4 | Runtime | [04-runtime.md](04-runtime.md) | 1, 3 | XL | Inject orchestration, phases, safety/assessor, comms, debrief |
| 5 | Film | [05-film.md](05-film.md) | 1 | M | Stage targets/sync, rehearsal, operations UI |
| 6 | Demo | [06-demo.md](06-demo.md) | 1 | M | Offline tour, seeded content, sandbox, kiosk |
| 7 | Cleanup | [07-cleanup.md](07-cleanup.md) | any | M | Assets, dead code, README, fonts/sounds |
| V2 | Scene rework | [11-scene-rework-v2.md](11-scene-rework-v2.md) | 1–3 | XL | OS/Terminal split, all scenes/blocks to V2 specs, new blocks |

- Parallelizable: 2 and 3 after 1; 5 and 6 after 1; 7 throughout.
- Every phase ships independently: no phase may leave the app in a non-building state.

## Definition of Done (summary)

- Acceptance criteria of the touched concept file(s) pass as automated tests where testable.
- `npm run check`, `npm test`, `npm run build`, `npm run test:e2e` green.
- Concept gap analysis updated in the same change; docs links valid.
- No new dependency without a recorded reason; no secret/media master committed.
- Full checklist: [08-tests-and-dod.md](08-tests-and-dod.md) · session closeout: [../checklists/session.md](../checklists/session.md).

## Out of scope

- Cloud/multi-tenant, real CBRN/explosive/medical procedures, real frequencies, video export, Electron, hand tracking.
- Estimates in calendar time; sizes are relative (S/M/L/XL).
