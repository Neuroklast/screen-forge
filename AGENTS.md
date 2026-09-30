# AGENTS.md — ScreenForge Agent Contract & Router

ScreenForge turns arbitrary screens into fictional system surfaces for **Film & TV**, **Training**, and **Demo**.
This file is a **router**, not an encyclopedia. Read only the files the current task needs.

## Session start

1. Read this file.
2. Read exactly the topic file(s) matching the task (routing table below).
3. For any implementation work: read [docs/plan/00-guardrails.md](docs/plan/00-guardrails.md) and the matching phase + backlog task.
4. Read [docs/plan/README.md](docs/plan/README.md) only when starting a phase; [docs/konzept/README.md](docs/konzept/README.md) only when the task touches product behavior.

## Project facts

| Item | Value |
| --- | --- |
| Stack | React 19, TypeScript 7, Vite 8, Zod 4, motion, three, Leaflet, `ws` exercise server |
| Package manager | npm (`package-lock.json`) |
| Node | >= 24 |
| Check | `npm run check` |
| Unit/server tests | `npm test` |
| Build | `npm run build` |
| E2E | `npm run test:e2e` |
| Dev servers | `npm run dev` (5173), `npm run exercise` (8787) |
| CI | [.github/workflows/ci.yml](.github/workflows/ci.yml) |

## Hard rules (always apply)

- The concept set [docs/konzept/](docs/konzept/README.md) is the SSOT. Code follows it or records a deviation there.
- NEVER add real weapon, explosive, CBRN, medical, or tactical procedure content; all systems are fictional (`EXERCISE` / `DEMO — FIKTIV`).
- NEVER name a scene after a company: scenes are functional (`corporate`, `terminal`, `countdown`, `tracking`, `hologram`); `VESPER`/`BLACKLINE`/`AEON` are brand titles.
- Element content (scenes, blocks, field consoles) MUST be English; German is only for the studio/training control chrome.
- The server is authoritative for exercise state; enforce role projections server-side.
- Mission edits only while `draft`/`ready`/`paused`; every save bumps `revision`; stale saves are rejected, never merged.
- Abort MUST be reachable in ≤ 2 taps and independent of EXCON availability.
- Smallest change that fully solves the task; no drive-by refactors, no unrequested UX, no new dependency without a recorded reason.
- NEVER treat a symptom: always find and fix the root cause, without exception. A patch that hides the defect (clipping, magic-number tuning, swallowed errors) is not a fix; if the root cause is out of scope, record it instead of masking it.
- NEVER `as any`, `@ts-ignore`, or blanket disables; keep validation, auth, and redaction.
- NEVER commit `secret data/` or media masters, secrets, or tokens.
- ALWAYS run the check pipeline before claiming done; NEVER report done on failing checks.
- Docs are part of the deliverable; update the affected concept file and the gap analysis in the same change.
- NEVER force-push, deploy, or run destructive migrations without explicit approval.

## Routing table — read by task

| Task | Files |
| --- | --- |
| Any implementation task | [docs/plan/00-guardrails.md](docs/plan/00-guardrails.md), [docs/plan/08-tests-and-dod.md](docs/plan/08-tests-and-dod.md) |
| Phase work / task order | [docs/plan/README.md](docs/plan/README.md), [docs/plan/09-backlog-foundation-to-catalog.md](docs/plan/09-backlog-foundation-to-catalog.md), [docs/plan/10-backlog-runtime-to-cleanup.md](docs/plan/10-backlog-runtime-to-cleanup.md) |
| Product behavior / features | [docs/konzept/README.md](docs/konzept/README.md), [docs/konzept/domain/12-gap-analysis.md](docs/konzept/domain/12-gap-analysis.md) |
| UI / UX work | [docs/konzept/usability/00-principles.md](docs/konzept/usability/00-principles.md), [docs/konzept/usability/06-copy-jargon.md](docs/konzept/usability/06-copy-jargon.md) |
| Layout / overflow / z-index | [docs/konzept/usability/09-layout-contracts.md](docs/konzept/usability/09-layout-contracts.md) — grid over flex, viewport prison, z registry, truncation, aspect lock |
| Scenes / blocks / components | [docs/konzept/catalog/](docs/konzept/catalog/19-themes.md) |
| Tasks / workflows / interaction | [docs/konzept/domain/14-interaction-model.md](docs/konzept/domain/14-interaction-model.md), [docs/plan/14-interaction-engine.md](docs/plan/14-interaction-engine.md) |
| Training scenarios | [docs/konzept/scenarios/00-realism-and-safety-framework.md](docs/konzept/scenarios/00-realism-and-safety-framework.md) |
| Data formats / import/export | [docs/konzept/formats/00-format-family.md](docs/konzept/formats/00-format-family.md) |
| Exercise control | [docs/konzept/control/00-control-model.md](docs/konzept/control/00-control-model.md) |
| Naming / jargon | [docs/konzept/domain/01-glossary.md](docs/konzept/domain/01-glossary.md) |
| Art direction | [docs/ART_DIRECTION.md](docs/ART_DIRECTION.md) |
| Assets / cleanup findings | [docs/konzept/catalog/23-asset-and-catalog-gaps.md](docs/konzept/catalog/23-asset-and-catalog-gaps.md) |
| New feature spec | [docs/templates/feature-spec.md](docs/templates/feature-spec.md) |
| Lessons learned | [docs/lessons/README.md](docs/lessons/README.md) |

## Session closeout

1. Implement → 2. run checks (`npm run check`, `npm test`, `npm run build`, `npm run test:e2e`) → 3. update docs → 4. report.
Checklist: [docs/checklists/session.md](docs/checklists/session.md). Definition of Done: [docs/plan/08-tests-and-dod.md](docs/plan/08-tests-and-dod.md).

## Multi-agent

- Parallel agents only in isolated git worktrees; one writer per working tree.
- Never let two agents edit the same file; split by file ownership.
