# Plan 06 — Demo

> ScreenForge concept set · Implementation plan · Phase 6 · Language: EN, UI labels DE
> Concept: [../konzept/domain/10-demo.md](../konzept/domain/10-demo.md) · [../konzept/usability/01-start-page.md](../konzept/usability/01-start-page.md)

## Goal

An offline showcase mode that runs in five minutes without setup: seeded content, a guided tour, a sandbox, and kiosk resilience for trade shows.

## Work packages

| ID | Work package | Size | Files |
| --- | --- | --- | --- |
| D1 | Demo hub + route (`/?demo=1`, start-page card) | M | new `src/demo/DemoHub.tsx`, `src/main.tsx`, `src/views/StartPage.tsx` |
| D2 | Seeded content: EOD mission, SAR mission, film show, media, dossiers | M | new `src/core/demoContent.ts` |
| D3 | Guided tour overlay: 7 stops, next/back/end, progress | L | new `src/demo/Tour.tsx`, `src/demo/tour.json` |
| D4 | Sandbox: full builder, reset to seed, hidden server actions | M | `src/demo/DemoHub.tsx` |
| D5 | Kiosk idle: auto-restart tour after 90 s, PIN exit | S | `src/demo/DemoHub.tsx` |
| D6 | Offline guard: never open `/exercise` WS in demo | S | `src/demo/DemoHub.tsx`, `src/core/useExercise.tsx` |
| D7 | Tests: offline run, no WS, reset, kiosk restart | M | `tests/demo.spec.ts` (new) |

## Details

- **D2:** content is bundled with the app; a local in-browser simulation uses the same rules engine without WebSocket.
- **D3:** stops: film surfaces, exercise build, field device, HQ view, injects, debrief, sandbox; overlay text in German; auto-advance on action with short delay.
- **D4:** edits live in memory + localStorage only; `"Demo zurücksetzen"` restores the seed without confirmation; server/provisioning actions hidden with an explanation.
- **D5:** `?demo=1&kiosk=1` locks the tour; exit via presenter PIN.
- **D6:** demo MUST NOT connect to a server even if reachable; watermark `DEMO — FIKTIV` on all surfaces.

## Acceptance criteria

- [x] Given no network, all 7 tour stops work end-to-end.
- [x] Given `?demo=1` with a running server, no `/exercise` WebSocket is opened.
- [x] Given kiosk demo idle for 90 s, the tour restarts at stop 1.
- [x] Given sandbox edits, reset restores the seeded content exactly.
- [ ] Given WebGL/media failure, the affected stop is skipped with a notice.

## Tests

- E2E: full tour offline; WS guard assertion; reset; kiosk idle restart; touch-only controls ≥ 44 px.
- Unit: demo content validates against the mission schema.

## Risks

| Risk | Mitigation |
| --- | --- |
| Demo leaks into live data | Hard offline guard + test; no server import path |
| Heavy media slows trade-show hardware | Prefer light assets; lazy-load; test on mid-range device |
| Tour text drifts from UI | Tour stops reference labels from the glossary; review per release |

## Docs to update

- Concept: demo status in [../konzept/domain/12-gap-analysis.md](../konzept/domain/12-gap-analysis.md).
- Lessons: append for offline/tour surprises.
