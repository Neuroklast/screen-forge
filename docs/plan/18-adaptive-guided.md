# Plan 18 — Adaptive Guided Mode

> ScreenForge concept set · Implementation plan · Language: EN, UI labels DE
> Concept: [../konzept/usability/02-guided.md](../konzept/usability/02-guided.md) · [../konzept/domain/15-scenario-capabilities.md](../konzept/domain/15-scenario-capabilities.md)
> Related: [00-guardrails.md](00-guardrails.md) · [08-tests-and-dod.md](08-tests-and-dod.md) · [12-durable-engine.md](12-durable-engine.md)

## Goal

Replace the fixed five-step wizard with a constraint-driven scenario interview: questions are selected from `ScenarioIntent` + derived `ScenarioFacts`, answers produce suggestions (`ScenarioOperation[]`), and the real workflow graph grows live next to the interview. The guided mode is a projection over the scenario model, never a second domain model.

## The ten rules (binding)

1. Guided Mode is a projection over the scenario model, never a second domain model.
2. Rules return suggestions; rules never mutate scenarios directly.
3. Derived state is recomputed, never manually synchronized.
4. User-authored content is never silently overwritten or deleted.
5. Every generated entity/node records provenance (`origin`).
6. Rules must be deterministic, idempotent and independently testable.
7. Rule execution order must not affect the result (one immutable snapshot per evaluation).
8. Avoid rule chaining; dependencies must be explicit (`dependsOn` facts only).
9. Domain-specific rules stay inside domain packs; React components contain no business rules.
10. Any new guided behavior requires: rule test, reconciliation test, graph invariant test, one representative user journey.

## Architecture

- Core (framework-free): `src/core/guided/{types,facts,engine,operations,reconcile,meta}.ts`; packs in `src/core/guided/domains/`.
- Persisted truth: `Scenario` (with optional `guided` session) is the only state. `facts` are recomputed on load; `session.applied` is an append-only audit log, never a lookup source for reconciliation — ownership is read from each element's `origin`.
- Ownership tri-state: `generated-unmodified` (reconcilable), `generated-modified` (conflict), `user-created` (untouchable). Absence of `origin` = user-created.
- Operations are typed and reference-safe: no generic `remove-element`; removals clean edges, bindings and references or fail atomically.
- Suggestion ids carry a semantic fingerprint (`ruleId:subjectKey:fingerprint`) so a dismissal survives an unchanged situation but a materially changed recommendation may return.
- `Scenario.type` is a coarse persisted classification; guided domains (`primaryDomain` + `enabledDomains`) are independent authoring dimensions. Type changes only through an explicit transition.
- Domain correctness stays with `missionLint`/`graph.ts`; guided readiness only reports missing guided information.

## Work packages

| ID | Package | Content | Size | Status |
| --- | --- | --- | --- | --- |
| G0 | Schema foundation | `sar`/`technical` types + presets, `scenario.guided`, `origin` on all generatable entities/nodes/workflows/events, user-edit marking, i18n type labels | S | done |
| G1 | Engine + SAR/Medical slice | types, facts, operations, reconcile, engine, SAR (full) + Medical (minimal) packs, rule/invariant/property tests | L | done |
| G2 | Guided UI + wizard replacement | interview column + live `WorkflowCanvas`, accept/modify/skip, reconciliation panel, `TrainerView` wiring, `ScenarioWizard` deleted, preparation/journeys/training/artifact E2E migrated | XL | done |
| G3 | Remaining packs | technical, disposal, film, free packs; per-domain unit journeys + guided E2E journeys | L | done |
| G4 | Docs & cleanup | dead wizard keys, doc pass, lessons | S | done |

## G0/G1 acceptance (met)

- Deterministic evaluation, snapshot isolation, conflict detection.
- Atomic + idempotent operations, stable ids, reference-safe removals, regeneration only for untouched generated content.
- Reload reconstruction from persisted answers.
- Tri-state ownership; user content untouched; modified content conflicts.
- SAR + Medical compose into one valid, lint-clean scenario.
- Bounded exhaustive property test over SAR facts; boundary/representative values for numbers/strings.

## G2 delivered

- `src/training/guided/GuidedBuilder.tsx` (+ `guided.css`): domain intent, one active decision card (multi-select supported), answered-questions list with change, live `WorkflowCanvas` next to the interview, suggestion cards (apply/skip), and a reconciliation panel (remove/keep/details) driven by `reconcile`.
- `TrainerView` opens the builder on `?guided=0`; "Neues Szenario erstellen" resets to a blank draft, then the domain choice sets the type. The fixed five-step `ScenarioWizard` is deleted.
- Session state lives in `draft.guided`, so undo/redo, revision-safe save and reload/resume work through the existing shell.
- `tests/guided.spec.ts` is the representative journey: answer, apply the suggestion, see the graph grow, change the earlier answer, reconcile and remove.

## G3 delivered

- Packs for all six domains: `searchRescue` (full), `medical`, `technical` (diagnostics + access + escalation), `disposal` (assembly + cordon + consequence), `film` (linear/failure/reactions/timed sequence + actor + props) and `free` (empty canvas).
- `domains.test.ts` proves per domain: label keys exist in both dictionaries, apply-all produces a schema-valid, lint-clean, deterministic, idempotent scenario, plus compositions SAR+medical and technical+disposal.
- `tests/guided.spec.ts` adds guided E2E journeys for technical, disposal and film.

## G4 delivered

- Removed dead wizard copy from `de`/`en` (only `wizard.name`, `wizard.lat`, `wizard.lng`, `wizard.zoom` remain) and the unused legacy `prep.scenario.advanced` labels.
- Concept set updated to the adaptive surface: README U2, catalog training-controls, templates mapping and mission-builder defaults.

## G2 UI contract

- Interview, real graph and suggestions visible together; no modal-only navigation.
- Direct manual graph editing always reachable; `"Im Expertenmodus öffnen"` jumps into the flow workspace.
- One active decision card (may bundle related choices); optional questions collapsed.
- Layout follows [U9 layout contracts](../konzept/usability/09-layout-contracts.md); no layout pattern is fixed beyond that.

## Checks

`npm run check`, `npm test`, `npm run build`, `npm run check:i18n`, `npm run check:layout`; `npm run test:e2e` from G2 on.
