# Plan 08 — Tests & Definition of Done

> ScreenForge concept set · Implementation plan · Applies to every phase · Language: EN, UI labels DE
> Related: [00-guardrails.md](00-guardrails.md) · [../checklists/session.md](../checklists/session.md)

## Test layers

| Layer | Tool | Location | Use |
| --- | --- | --- | --- |
| Unit | Vitest | `src/core/*.test.ts` | Schemas, migration, linter, engines, reducers |
| Server | Node test | `server/exercise.test.mjs` | Auth, protocol, phases, redaction, persistence |
| E2E | Playwright | `tests/*.spec.ts` | User flows, touch layouts, offline, abort |

- Run non-interactively: `npm test` (unit + server), `npm run test:e2e` (Playwright starts Vite + exercise server with `EXERCISE_ADMIN_KEY=browser-test-key`).
- NEVER run watch mode in agent sessions; run once.

## What to test (by phase)

| Phase | New tests |
| --- | --- |
| 1 Foundation | Migration v1→v2, session/role aliases, start-page routing, server v2 persistence |
| 2 Builder | Linter severities, defaults, undo/redo, DnD + keyboard, revision conflict |
| 3 Catalog | Prop transitions, ordnance/beacon flows, template validation, gallery load |
| 4 Runtime | Phase model, manual/held/skipped injects, action v2, safety abort, message ack, replay, exports |
| 5 Film | Push/sync, kiosk skip, rehearsal migration, operations, show linter |
| 6 Demo | Offline tour, WS guard, reset, kiosk idle |
| 7 Cleanup | Fresh-clone smoke (manual), build/e2e green after removals |

## Test rules

- Assert observable behavior (payload, state, rendered result), not mock call counts.
- Every MUST in the concept files should map to at least one test where feasible.
- Redaction tests are mandatory for every new role or data class.
- Playwright: isolate state per test; use a dedicated data dir; kill stale servers (see lessons).
- A failing test is fixed at the cause; never disabled to pass.

## CI gates

- Existing: `npm ci` → `npm test` → `npm run build` → `npx playwright install` → `npm run test:e2e`.
- Add when ready: a docs link/budget check for `docs/` (≤150 lines per file, links resolve), and a guard that `secret data/` is not tracked.
- CI MUST NOT be fixed by disabling a check.

## Manual acceptance (not automatable)

- Touch devices: field tablet in bright light, gloves, one-hand tasks.
- Stage: distance readability, moiré, brightness, contrast at the target display.
- LAN: two physical devices, QR provisioning, WebRTC camera feed.
- Kiosk: 24 h idle stability.

## Definition of Done

- [ ] Task acceptance criteria met and covered by tests where testable.
- [ ] `npm run check` green.
- [ ] `npm test` green (with new tests).
- [ ] `npm run build` green.
- [ ] `npm run test:e2e` green (or explicitly deferred with a reason).
- [ ] Concept file(s) updated; gap analysis updated; links valid.
- [ ] No new dependency without a recorded reason; no secrets/media master committed.
- [ ] Backlog task marked done; lesson added if something surprised you.
- [ ] One purpose per commit; conventional message.

## Reporting

- Report: what changed, where, why; checks run + results; open items/blockers.
- Name any check not run explicitly; never claim done on failing checks.
