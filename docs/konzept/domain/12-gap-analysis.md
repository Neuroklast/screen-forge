# 12 — Gap Analysis (Soll vs. Ist)

> ScreenForge concept set · Target state (Soll) · Status of this file: **maintained** — update when code moves.
> Evidence paths are relative to the repo root. `Action`: `new` | `extend` | `refactor` | `keep` | `remove`.
> Asset/catalog findings (media, fonts, sounds, dead wiring): [../catalog/23-asset-and-catalog-gaps.md](../catalog/23-asset-and-catalog-gaps.md).
> Implementation progress: Phase 1 complete (F1–F8: start page, role aliases, depth, mode/demo parsing, mission v2 + v1→v2 migration, tests). Next: Phase 2 builder. See [../../plan/09-backlog-foundation-to-catalog.md](../../plan/09-backlog-foundation-to-catalog.md).

## Summary

| # | Area | Soll | Ist | Action |
| --- | --- | --- | --- | --- |
| 1 | Start page & mode entry | 3 mode cards, resume, roles, depth toggle | `/` is the studio; no start page (`src/main.tsx`) | new |
| 2 | Demo mode | Offline tour, sandbox, kiosk | No `demo` anywhere in code | new |
| 3 | Guided/Advanced depth | Orthogonal depth level, switchable | Only the 5-step wizard; no advanced/guided concept (`ScenarioWizard.tsx`) | refactor |
| 4 | Mission builder (drag & drop) | Palette + board + inspector, touch | Form fieldsets only; DnD only in film `SequenceEditor.tsx` | new |
| 5 | Devices 1..n | 0 allowed while building, ≥1 to start | Schema min 1, max 40 (`training.ts:141`); wizard fixed 6 stations | refactor |
| 6 | Optional patient | Never forced; medical linter error only | New station defaults `medical` + patient (`ScenarioEditor.tsx:205-222`); medical requires patient (`training.ts:161-166`); all templates include one | refactor |
| 7 | Optional ordnance/props | Prop entity + `ordnance`/`beacon` modules | No prop entity; no bomb/beacon module; props only as boolean flags (`TrainingState.props`) | new |
| 8 | Template library | 9 templates incl. EOD, data theft, beacon | 4 hardcoded (`sar/medical/airsoft/film`, `training.ts:276-360`); no gallery; wizard only renames stations | extend |
| 9 | Roles | 10 roles incl. safety, assessor, technician, presenter, visitor | 4 roles: `film/trainer/hq/element` (`session.ts`) | extend |
| 10 | Stage targets (film) | Push scene to device(s), sync toggle | Devices play independently; no push (`README.md:15`) | new |
| 11 | Injects engine | Triggers + actions incl. prop/beacon/ordnance/lock/sound | Rules engine exists with 5 triggers, 5 actions (`training.ts`) | extend |
| 12 | Data model v2 | `props/teams/actors/bindings/injects` | v1 scenario schema; no props/teams/actors | refactor |
| 13 | Rehearsal flag | Film rehearsal without mode switch | `workspace: "film"|"training"` flag in studio (`config.ts:118`) | refactor |
| 14 | Debrief/AAR | Log, timeline, notes, CSV/JSON | Event log + take log exist; no notes/scores/CSV | extend |
| 15 | Projection/redaction | Per role, server-enforced | Implemented (`training.ts:459-499`) | keep |
| 16 | Provisioning/invites | QR invites, revoke, readiness | Implemented (`server/exercise.mjs`, `TrainerView.tsx`) | keep |
| 17 | Film studio core | Scenes, shows, media, themes, kiosk | Implemented (`App.tsx`, `SequenceEditor.tsx`, …) | keep |
| 18 | Docs | Concept set is SSOT; README current | README describes film-only state, never mentions training (`README.md`) | refactor |
| 19 | Dead code | No unused modules | `core/dossiers.ts` load/save unused; legacy film dossiers | remove |
| 20 | Tests | Cover builder, roles, demo, migration | 21 unit + 19 e2e; none for builder/demo/migration | extend |

## Detailed notes

### 1–3 Entry, demo, depth

- `main.tsx:24-44` hard-routes by `role`; root renders `<App />`.
- Wizard (`ScenarioWizard.tsx`) is the only guided path; no `"Experte"` surface.
- Demo needs: bundled content, local simulation without WS, tour overlay, sandbox reset.

### 4–7 Builder and optionality

- `ScenarioEditor.tsx` (820 lines) is form-based; split into palette/board/inspector components.
- `training.ts:141` `.min(1).max(40)` → builder must allow 0 in draft; start gate enforces ≥1.
- Defaults to change: new station module `terminal`, no binding; wizard templates must not auto-seed 3 dossiers (`ScenarioWizard.tsx:23-27`).
- New: `Prop` entity, `ordnance` + `beacon` modules and scenes (fictional control surfaces).

### 8 Templates

- Move templates from `training.ts` into `presets/missions/*.json`; add `eod-disposal`, `data-exfiltration`, `beacon-activation`, `access-lockdown`, `blank`; keep `sar`, `medical`, `airsoft`; map `film` to a show template.
- Add gallery UI with filters (mode, difficulty, duration).

### 9 Roles

- Extend `session.ts` roles and server permission checks; add `safety` abort capability independent of EXCON session; `assessor` read-mostly; `technician` content-blind; `presenter`/`visitor` demo-only.
- Keep aliases `trainer→excon`, `element→player`, `film→director` for old links.

### 10 Stage targets

- Extend film runtime with output inventory + push/sync; devices currently load config independently (README limitation).
- No server dependency: reuse BroadcastChannel/localStorage or direct WS if server present; film MUST stay serverless.

### 11 Injects

- Extend `Action` union with `prop`, `lock`, `beacon`, `ordnance`, `sound`, `state`; keep `patient/release/camera/objective/message`.
- Rename UI `"Ereignis"`, keep schema field `injects` (migrate from `rules`).

### 12–13 Data model, rehearsal

- Migration `scene→module`, `entityId→bindings`, `rules→injects`, version 1→2 ([11-data-model.md](11-data-model.md)).
- Studio workspace flag becomes `rehearsal` toggle inside film; training uses missions, not the studio flag.

### 14 Debrief

- Add assessor notes (server state + UI), timeline view, CSV export; keep JSON log and take log.

### 18–19 Docs and cleanup

- Update `README.md`: modes, training, start page, concept link; remove claims that are now false (`README.md:88`).
- Remove `core/dossiers.ts` load/save; keep `defaultDossiers` only if wizard needs example data (prefer template JSON).

### 20 Tests

- Unit: migration, linter rules, inject actions, role projections for new roles, prop state machines.
- E2E: start page → mode → guided/advanced; builder drag & drop + keyboard alternative; demo offline run; stage push/sync; safety abort.

## Suggested workstreams (order)

1. **Foundation:** start page, roles/routing aliases, data model v2 + migration.
2. **Builder:** palette/board/inspector, linter, defaults fix, optional entities.
3. **Catalog:** prop entity, ordnance/beacon modules + scenes, template library.
4. **Runtime:** inject extensions, safety role, debrief additions.
5. **Film:** stage targets + sync; rehearsal unification.
6. **Demo:** bundled content, tour, sandbox.
7. **Cleanup:** README, dead code, tests.

## Definition of done for implementation

- Every acceptance criterion in this set passes as a test (unit or e2e).
- `npm test`, `npm run build`, `npm run test:e2e` green.
- No drift: this file updated in the same change as the code.
