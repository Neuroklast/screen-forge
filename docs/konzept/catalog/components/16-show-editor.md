# Catalog — Components: Show Editor (SequenceEditor, Director, Templates)

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Code: `src/components/SequenceEditor.tsx` (445), `src/core/director.ts` (94), `src/core/showTemplates.ts` (272), `src/core/takeLog.ts` (24)

## SequenceEditor

- Purpose: build and run a `Show` (take graph) for the director; the only drag & drop surface in the repo today.
- Props: `show`, `onChange`, `config`, `onStart`, `running`, `onStop`, `onAdvance`.
- State: `selected` step, `page` (5 steps per page), `status`.
- Interactions:
  - Palette: scene/block buttons draggable with MIME `application/screenforge-scene`; template select; `+ Aktuelle Konfiguration`.
  - Chain: reorder via MIME `application/screenforge-node` or up/down buttons; link line shows next step or `ENDE`; pager.
  - Inspector: `name`, full `config`, `cue`, `osApp` (terminal only), `trigger` (`time|key|pin|signal`), `duration`, `value`, `timeout`/`onFail` (training workspace only), `next`, `Aktuelle Gestaltung übernehmen`, remove.
  - Import/export: JSON, import rejects > 12 MB and invalid JSON without touching the current show.
- Limits: max 60 steps; adding beyond is a silent no-op.
- Known issues: changing a step's scene resets its config to defaults (customization lost unless `Aktuelle Gestaltung übernehmen` is used); deleting a step clears other steps' `next` but not `onFail` (stale links possible); `operation` exists in the schema but is not exposed in the inspector.

## Director model

- `Show { version, name, steps[] }`; `Step { id, name, config, cue, operation?, trigger, duration, value, next, onFail, timeout }` (`director.ts:3-40`).
- `nextStep` / `failStep` resolve branches; `triggerMatches(step, time, input?)` gates on `time`, `key`, `pin`, `signal`.
- `loadShow()` restores from localStorage; take log records `ok|fail|timeout` (`takeLog.ts`).

## Show templates (8)

`Ortungsbake aktivieren`, `Sprengkopf-Wartung`, `Archiv-Extraktion`, `Service-Image laden`, `Gegenmaßnahme`, `Türverriegelung`, `Medizinischer Notfall`, `Einrichtungsterminal` (`showTemplates.ts:52-272`).

## Target state (Soll)

- MUST expose `operation` in the inspector (schema already supports it).
- MUST clean `onFail` references on step deletion (bug fix) and add a show linter (unreachable steps, missing codes, empty values).
- SHOULD add undo/redo and multi-select to the editor, matching builder expectations ([../../usability/03-advanced.md](../../usability/03-advanced.md)).
- SHOULD support stage targets and a rehearsal flag per show ([../../domain/09-film-tv.md](../../domain/09-film-tv.md)).
- MAY persist shows as `.sfshow.json` in the format family ([../../formats/03-show-theme-profile-formats.md](../../formats/03-show-theme-profile-formats.md)).

## Edge cases

- 60-step cap reached: palette adds show a notice instead of failing silently.
- Import while a show runs: import is blocked with `"Ablauf aktiv"`.
- Step references a deleted scene id: editor marks it invalid, run skips with a log entry.
- Two tabs editing the same show: last save wins (documented limitation; no merge).

## Acceptance criteria

- [ ] Given a new step added by drag, it lands at the drop position and links are consistent.
- [ ] Given a deleted step, no other step keeps a dangling `onFail` link.
- [ ] Given an `operation` value in a step, the scene runs the sequence at step start.
- [ ] Given an invalid import, the current show is unchanged and an error toast appears.
