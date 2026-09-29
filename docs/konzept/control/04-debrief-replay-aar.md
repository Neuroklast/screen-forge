# Control — Debrief, Replay & AAR

> ScreenForge concept set · Control & orchestration · Target state (Soll) · Language: EN, UI labels DE
> Related: [00-control-model.md](00-control-model.md) · [../scenarios/10-evaluation-and-aar.md](../scenarios/10-evaluation-and-aar.md) · [../domain/08-exercise-runtime.md](../domain/08-exercise-runtime.md)

## Purpose

The debrief turns the exercise into evidence: a complete timeline, deterministic replay, assessor notes and scores, and exports that survive the day. It is the last phase of every exercise and the basis of the AAR.

## Timeline

| Element | Behavior |
| --- | --- |
| Event list | every log entry with server time, type, actor, detail |
| Types | inject, intervention, objective, message, camera, presence, auth, abort, note |
| Filters | type, station, team, severity, time range, free text |
| Grouping | by phase (`T+` buckets) or by station |
| Markers | objective completions, injects, aborts highlighted |
| Live | updates during the run; frozen at `ended` |

- The timeline is the single source for the AAR; every finding must reference at least one event ([../scenarios/10-evaluation-and-aar.md](../scenarios/10-evaluation-and-aar.md)).

## Replay

- Deterministic by design: same seed + same inputs reproduce positions, injects, and states ([../domain/08-exercise-runtime.md](../domain/08-exercise-runtime.md)).
- Replay modes: `Zeitstrahl` (seek to any time), `Abspielen` (1×/2×/4×), `Schritt` (next event).
- Replay is read-only: no injects can fire, no messages can be sent; notes remain editable.
- PLAYBACK missions replay routes; LIVE missions replay recorded GPS tracks (when track export is enabled).

## Notes & scores

| Item | Rule |
| --- | --- |
| Assessor note | time-stamped, event-linked, free text ≤ 500 chars |
| Score | optional 1–5 per criterion, requires a note |
| Criteria sheet | per scenario ([../scenarios/10-evaluation-and-aar.md](../scenarios/10-evaluation-and-aar.md)) |
| Actions | 1–3 improvements with owner, persisted with the exercise |
| Visibility | notes are for EXCON/safety/assessor/HQ after `ended`; players see only the AAR summary |

## Exports

| Export | Content | Format |
| --- | --- | --- |
| Archive | mission + full log + notes + scores + actions | JSON |
| Analysis | event table | CSV |
| Summary | one page: timeline, criteria, actions | print/PDF via browser |
| GPS tracks | per-station positions | CSV |
| Take log | film rehearsal events | JSON (existing) |

- Exports are deterministic and offline; file names use `<mission-slug>-<date>`.

## AAR flow (product support)

1. Open debrief → timeline visible to all permitted roles.
2. Walk the timeline; jump to marked events.
3. Read assessor notes per event; add remaining notes.
4. Fill the criteria sheet; write actions.
5. Export archive + summary; optionally reset for the next run.

## Target state (Soll)

- Implement notes/scores in server state and UI; today only EXCON has any note-like surface and none persist.
- Implement the timeline view with filters and seek.
- Implement replay controls with deterministic re-simulation.
- Implement JSON/CSV/print exports and GPS track export.
- Implement the actions list persisted with the exercise.

## Acceptance criteria

- [ ] Given a finished exercise, the timeline contains every event with server timestamps.
- [ ] Given a seek in replay, states match the original run at that time.
- [ ] Given an assessor note, it is exportable and linked to its event.
- [ ] Given an export, a third party can reconstruct the exercise from the archive.
