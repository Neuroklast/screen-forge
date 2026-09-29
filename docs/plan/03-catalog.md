# Plan 03 — Catalog

> ScreenForge concept set · Implementation plan · Phase 3 · Language: EN, UI labels DE
> Concept: [../konzept/domain/05-modules.md](../konzept/domain/05-modules.md) · [../konzept/domain/06-entities-and-props.md](../konzept/domain/06-entities-and-props.md) · [../konzept/domain/07-templates.md](../konzept/domain/07-templates.md)

## Goal

The content catalog: prop entity with state machines, the new `ordnance` and `beacon` modules with fictional scenes, and the 9-template library with a gallery.

## Work packages

| ID | Work package | Size | Files |
| --- | --- | --- | --- |
| C1 | Prop entity + generic state machine (schema + runtime) | M | `src/core/training.ts` |
| C2 | `ordnance` module + fictional console scene | L | new `src/scenes/ordnance/*`, `src/training/OrdnanceConsole.tsx` |
| C3 | `beacon` module + scene (hold, window, interference) | M | new `src/scenes/beacon/*`, `src/training/BeaconControl.tsx` |
| C4 | Extend signal whitelist + server actions for new modules | M | `src/core/training.ts`, `server/exercise.mjs` |
| C5 | Template library as `presets/missions/*.json` (9 templates) | M | new `presets/missions/` |
| C6 | Template gallery UI with filters + preview | M | new `src/training/TemplateGallery.tsx` |
| C7 | Wizard loads templates; all elements removable | M | `src/training/ScenarioWizard.tsx` |
| C8 | Sounds: assign `abort`/`denied`, add manifest + missing events | S | `src/core/sound.ts`, new `sounds/manifest.json` |
| C9 | Tests: prop state machine, ordnance/beacon flows, templates valid | M | `src/core/*.test.ts`, `tests/training.spec.ts` |

## Details

- **C1:** props are generic: `{id, kind, name, states[], initial, state, visible}`; presets `ordnance`, `beacon`, `payload`, `keycard`, `custom` ([../konzept/domain/06-entities-and-props.md](../konzept/domain/06-entities-and-props.md)).
- **C2:** fictional EOD console: diagnostics → ordered stages → disarm; wrong order → `tampered` (recoverable); countdown optional. NEVER real ordnance detail.
- **C3:** beacon hold 3 s → `active`; window/interference from injects; emits `beacon-active`/`beacon-lost`.
- **C5:** the 9 templates: `blank`, `eod-disposal`, `data-exfiltration`, `beacon-activation`, `search-rescue`, `medical-emergency`, `access-lockdown`, `milsim-skirmish`, `film-playback`; each validated by the mission schema.
- **C6:** filters by mode, difficulty, duration, required roles; preview shows briefing, devices, entities, objectives.

## Acceptance criteria

- [ ] Given an ordnance prop + station, correct stage order ends `disarmed`; wrong order fires `tampered`.
- [ ] Given a beacon station + prop, a 3 s hold activates and the objective condition can fire.
- [ ] Given `blank`, the builder opens with 0 stations and 0 entities.
- [ ] Given any template, every station and entity can be removed without errors.
- [ ] Given the gallery offline, bundled templates still load.

## Tests

- Unit: prop transitions, ordnance stage logic, beacon hold/window, template schema validation.
- E2E: gallery → template → wizard → paused mission with clean linter.

## Risks

| Risk | Mitigation |
| --- | --- |
| Fiction boundary creep in EOD content | Guardrail review; abstract labels only; scenario text reviewed against [../konzept/scenarios/00-realism-and-safety-framework.md](../konzept/scenarios/00-realism-and-safety-framework.md) |
| Template drift from schema | Templates validated in tests on every build |
| New scenes bloat bundle | Lazy-load new scenes; measure build size |

## Docs to update

- Concept: module/entity/template gaps in [../konzept/domain/12-gap-analysis.md](../konzept/domain/12-gap-analysis.md).
- Lessons: append if prop/module patterns surprised you.
