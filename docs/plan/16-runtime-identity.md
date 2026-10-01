# Plan 16 — Runtime Identity & Single-Language Boundary

> ScreenForge concept set · Implementation plan · Status: implemented (part 1)
> Related: [README.md](README.md) · [../konzept/domain/03-modes-and-entry.md](../konzept/domain/03-modes-and-entry.md) · [../konzept/usability/11-preparation-ia.md](../konzept/usability/11-preparation-ia.md)

## Problem

The app could serve an old cached bundle from a service worker while the server
had already moved on, and the concept dictionaries allowed German chrome to leak
into an English UI (and vice versa). For an exercise-control product this is a
correctness problem: the operator may be editing a build that no longer exists.

## Build identity

- `vite.config.ts` computes a build identity (git SHA, ISO timestamp, `PROTOCOL`,
  package version), injects it as `__SCREENFORGE_BUILD__`, and writes
  `dist/build.json` on every build. Dev builds use `id: "dev"`.
- `src/core/build.ts` exposes the identity and `buildsCompatible()`. A missing or
  `"dev"` identity is always compatible, so local development and older field
  devices are never blocked.
- `server/exercise.mjs` reads `dist/build.json` at startup and exposes it at
  `GET /version` and in the WS `ready` message (`build`).
- `BuildGate` wraps the control surfaces (`trainer`/`safety`/`assessor`): on a
  protocol/build mismatch it blocks with "ScreenForge was updated — reload".
  Field/output shells are not hard-blocked.

## Service worker split

- Field/output shells (`element`, `hq`, kiosk, demo) register the self-updating
  worker in production (`registerType: "autoUpdate"`, `injectRegister: null`).
- Control/editor surfaces never register a worker; they actively unregister any
  existing worker and clear caches before mounting, so a stale app shell cannot
  survive on a control device.
- The exercise server keeps `no-cache` for `.html`/`sw.js` and denies
  `navigateFallback` for `/exercise`, `/health`, `/version`.

## Language boundary

- English is the default locale. `t()` never falls back to another language; a
  missing key renders the key so the gap is visible.
- `src/i18n/i18n.test.ts` enforces identical key sets across locales.
- `src/i18n/keys.test.ts` enforces that every literal `t("key")` exists in both
  locales.
- In-world fictional stage content stays as designed (art direction); control and
  field chrome is localized.

## Tests

- `server/exercise.test.mjs`: `/version` and `ready.build`.
- `src/i18n/i18n.test.ts`, `src/i18n/keys.test.ts`.
- `tests/artifact/version.spec.ts` (`npm run test:e2e:artifact`): builds A, lets
  the worker control a field page, deploys B, and proves the trainer is blocked
  and recovers after reload. Runs against the built `dist` served by the real
  exercise server, not the Vite dev server.

## Open

- Full `Show` → shared-graph migration (film `Ablauf`).
- `PreparationLocation` navigation state, readiness model, review focus.
- Control-UI design system and legacy `MissionBuilder` removal.
