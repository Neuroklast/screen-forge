# Checklist — Session Closeout

> ScreenForge · Copy into the session report. Order is fixed: implement → checks → docs → report.
> Definition of Done: [../plan/08-tests-and-dod.md](../plan/08-tests-and-dod.md) · Guardrails: [../plan/00-guardrails.md](../plan/00-guardrails.md)

## 1. Code

- [ ] Change matches the task and its acceptance criteria (concept file).
- [ ] Guardrails respected (fiction, naming, no new deps without reason).
- [ ] No `as any`, `@ts-ignore`, or blanket disables.
- [ ] No secrets or media masters in the diff.

## 2. Checks

- [ ] `npm run check` green (TypeScript).
- [ ] `npm test` green (Vitest `src/core` + server lifecycle), with new/updated tests.
- [ ] `npm run build` green.
- [ ] `npm run test:e2e` green for changed flows (or explicitly deferred with a reason).
- [ ] Any check not run named explicitly as "not run".
- [ ] Redaction tests added for any new role or data class.

## 3. Docs

- [ ] Concept file(s) updated for the changed behavior.
- [ ] [../konzept/domain/12-gap-analysis.md](../konzept/domain/12-gap-analysis.md) updated (or `unchanged because <reason>`).
- [ ] Plan backlog task marked `done` (09/10).
- [ ] New lesson appended if something surprised you ([../lessons/README.md](../lessons/README.md)).
- [ ] Links in touched docs still resolve.

## 4. Git

- [ ] One purpose per commit; conventional message (`feat:`/`fix:`/`refactor:`/`docs:`/`test:`/`chore:`).
- [ ] Only intended files staged; no `secret data/` or media masters.
- [ ] No force-push, no deploy, no destructive migration.

## 5. Report

- [ ] Summary: what changed, where, why.
- [ ] Checks run + results.
- [ ] Open items/blockers named explicitly.
- [ ] Nothing half-done left in the working tree.
