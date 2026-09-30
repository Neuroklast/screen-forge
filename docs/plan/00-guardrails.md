# Plan 00 — Guardrails

> ScreenForge concept set · Implementation plan · Read before any phase · Language: EN, UI labels DE
> Related: [README.md](README.md) · [../konzept/domain/00-vision.md](../konzept/domain/00-vision.md)

## Source of truth

- The concept set in [../konzept/](../konzept/README.md) is the SSOT. Code MUST follow it.
- If code must deviate, record it (reason + scope) in the concept file and in the gap analysis — never silently.
- The gap analysis [../konzept/domain/12-gap-analysis.md](../konzept/domain/12-gap-analysis.md) is updated in the same change as the code.

## Fiction and safety (NEVER violate)

- All systems are fictional; training surfaces carry `EXERCISE`, demo surfaces `DEMO — FIKTIV`.
- NEVER add real weapon, explosive, CBRN, medical, or tactical procedure content — not in scenes, dossiers, sounds, or scenario text.
- NEVER use real unit names, insignia, locations, frequencies, or callsigns.
- Ordnance stays an abstract prop (`Containment-Baugruppe` / `Spaltmaterial-Baugruppe`), never real wiring/chemistry.
- No simulation control may actuate real systems; no network calls to real infrastructure.

## Naming

- Scenes are functional surfaces (`intranet`, `terminal`, `countdown`, `tracking`, `hologram`); companies are identities ([../konzept/catalog/20-companies-and-brands.md](../konzept/catalog/20-companies-and-brands.md)).
- NEVER name a scene after a company; `VESPER`/`BLACKLINE`/`AEON` are brand titles, not scene names.
- UI uses the German labels from [../konzept/domain/01-glossary.md](../konzept/domain/01-glossary.md); code/schema uses the English terms.

## Scope discipline

- One purpose per change/PR. No drive-by refactors, no reformatting, no unrequested UX.
- Smallest change that fully solves the task; reuse existing components and patterns.
- No new dependency without a recorded reason; prefer platform APIs and existing libs.
- Keep validation, auth, and redaction checks — never strip them to reduce lines.
- NEVER `as any`, `@ts-ignore`, or blanket disables.

## Runtime and state rules

- The server is authoritative for exercise state; clients never invent state.
- Workflow/task logic is deterministic core code (`src/core`); it emits journaled domain events and never touches React, sockets, or wall-clock timers ([../konzept/domain/14-interaction-model.md](../konzept/domain/14-interaction-model.md)).
- Mission edits are allowed only in `draft`, `ready`, `paused`; the builder is read-only while `running`.
- Every mission save bumps `revision`; stale saves are rejected, never silently merged.
- Role projections are enforced server-side; hidden data (rules, codes, unreleased dossiers) never reaches non-EXCON clients.
- Abort must be reachable in ≤ 2 taps and must not depend on EXCON availability.

## Assets and data

- NEVER commit `secret data/` or any media master; media handling follows [07-cleanup.md](07-cleanup.md).
- No secrets, tokens, or connection strings in code, logs, or frontend bundles.
- All example media and dossiers are fictional; no real persons or logos.

## Checks before "done"

| Command | Purpose |
| --- | --- |
| `npm run check` | TypeScript |
| `npm test` | Unit (`src/core`) + server lifecycle |
| `npm run build` | Production build |
| `npm run test:e2e` | Playwright user flows |

- NEVER report done on failing checks. Name any check not run explicitly.
- Docs are part of the deliverable; update the affected concept file, this plan's backlog status, and lessons.

## Git

- Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`).
- One purpose per commit; stage only intended files.
- No force-push, no production deploy, no destructive migration without explicit approval.
