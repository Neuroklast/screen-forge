# Scenarios — Evaluation & AAR

> ScreenForge concept set · Scenario library · Exercise-design realism (fiction only) · Language: EN, UI labels DE
> Related: [../domain/02-roles.md](../domain/02-roles.md) · [../control/04-debrief-replay-aar.md](../control/04-debrief-replay-aar.md)

## Purpose

Evaluation turns a running exercise into learning: observable criteria, assessor notes bound to events, a structured after-action review (AAR), and exports that make findings reproducible.

## Evaluation criteria (baseline)

| Criterion | German | Observable evidence | Default weight |
| --- | --- | --- | --- |
| Information handling | `"Lagebild"` | sources named, contradictions resolved, dossiers used | 25 % |
| Comms discipline | `"Funkdisziplin"` | channel use, structure, silence windows kept | 20 % |
| Timing | `"Zeitverhalten"` | inject windows met, responses within limits | 20 % |
| Decision quality | `"Entscheidungen"` | decisions documented with rationale and time | 25 % |
| Documentation | `"Dokumentation"` | handover/timeline complete and reproducible | 10 % |

- Scenarios MAY override weights and add one domain criterion (e.g. procedure order in [06-eod-disposal.md](06-eod-disposal.md)).
- Scores are optional: 1–5 per criterion, only with a note justifying the value.
- Criteria MUST be observable in the log; no "attitude" or "leadership style" ratings.
- Every MEL entry declares `expectedOutcome` and the `evidence` log events that prove it, so the AAR can compare expected vs actual ([../control/01-inject-orchestration.md](../control/01-inject-orchestration.md)).

## Assessor workflow

1. Join as `assessor` ([../domain/02-roles.md](../domain/02-roles.md)); read-only plus notes.
2. During the run: attach short notes to events (time-stamped), no interaction with players.
3. After the run: complete criteria sheet; export notes.
4. In the AAR: present facts first, then findings; players speak before the assessor.

## Timeline and replay

- The log records injects, interventions, objectives, messages, aborts, and device presence with server timestamps.
- Replay is deterministic: same seed + same inputs reproduce the run ([../domain/08-exercise-runtime.md](../domain/08-exercise-runtime.md)).
- Playback replays routes and states for review; seek and pause are available in the debrief ([../control/04-debrief-replay-aar.md](../control/04-debrief-replay-aar.md)).
- GPS tracks SHOULD be exportable for route review (CSV).

## AAR structure

| Step | Content | Duration guide |
| --- | --- | --- |
| 1 Facts | timeline walkthrough, no judgment | 30 % |
| 2 Player view | what players experienced and decided | 20 % |
| 3 Findings | per criterion, with log references | 30 % |
| 4 Actions | 1–3 concrete improvements with owner | 20 % |

- Findings MUST cite events (`T+07:12 camera cut → focus switch`), never general impressions.
- Actions are written down and reviewed in the next exercise.

## Debrief question template

1. What was your picture at the start, and what changed it?
2. Which decision would you repeat, which not?
3. Where did time or information get lost?
4. What should the next exercise test?

## Exports

| Export | Content | Consumer |
| --- | --- | --- |
| JSON | full log + mission + notes | archive, tooling |
| CSV | event table (time, type, source, detail) | analysis |
| Print summary | one page: timeline, criteria, actions | leadership, files |
| GPS tracks | positions per station | route review |

## Target state (Soll)

- Add assessor notes and optional scores to server state and UI ([../domain/12-gap-analysis.md](../domain/12-gap-analysis.md)).
- Add timeline view with filters (type, station, criterion) and seek/replay in the debrief.
- Add CSV and print exports; keep JSON as the archive format.
- Add an "actions" list persisted with the exercise for follow-up.

## Acceptance criteria

- [ ] Given an assessor note, it is time-stamped, event-linked, and exportable.
- [ ] Given a finished exercise, the AAR can be run from the timeline without external notes.
- [ ] Given an export, every finding references at least one log event.
- [ ] Given a follow-up exercise, previous actions are visible.
