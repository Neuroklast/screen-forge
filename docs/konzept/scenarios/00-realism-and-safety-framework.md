# Scenarios — Realism & Safety Framework

> ScreenForge concept set · Scenario library · Exercise-design realism (fiction only) · Language: EN, UI labels DE
> Related: [../domain/00-vision.md](../domain/00-vision.md) · [../domain/08-exercise-runtime.md](../domain/08-exercise-runtime.md)

## Scope

This library defines **exercise design**: scenario structure, screen content, injects, roles, timing, evaluation, and debrief. It deliberately contains **no tactical, weapons, breaching, or medical procedures**. ScreenForge supplies believable surfaces; real-world doctrine and safety stay with the operating organization.

## Realism dimensions

| Dimension | What makes it believable | ScreenForge contribution |
| --- | --- | --- |
| Visual | Plausible systems, stable UI, correct terminology | Scenes, modules, themes, brands ([../catalog/](../catalog/)) |
| Procedural | Clear roles, comms discipline, inject cadence, time pressure | MEL, roles, messages, objectives ([01-exercise-anatomy-and-mel.md](01-exercise-anatomy-and-mel.md)) |
| Environmental | Noise, camera feeds, signal loss, device friction | Camera, comms, GPS, `SIG_LOST`, overlays |
| Evaluative | Observable criteria, notes, AAR | Log, assessor notes, debrief ([10-evaluation-and-aar.md](10-evaluation-and-aar.md)) |

## Reference sources and boundaries

Prioritise authorised, current, reproducible sources: exercise frameworks (e.g. CJCSM 3500.03F, NATO
exercise doctrine, BBK LÜKEX), casualty-care guidelines (JTS) and symbology standards
(MIL-STD-2525/APP-6) for terminology only. Never import leaked or unofficial SOPs/TTPs, and never
encode real special-operations procedures; professional customers supply their own authorised
criteria. See [11-role-sops.md](11-role-sops.md) and [12-safety-profile.md](12-safety-profile.md).

## Failure philosophy

A missed inject or error yields a new state (later information, harder objective, degraded system,
alternate route, trainer branch) — never a game-over. `failurePolicy` is defined per inject
([../control/01-inject-orchestration.md](../control/01-inject-orchestration.md)).

## Fidelity levels

| Level | German | Elements | Use |
| --- | --- | --- | --- |
| F1 Orientation | `"Orientierung"` | Screens, static content, guided wizard | New teams, demos, onboarding |
| F2 Procedural | `"Verfahren"` | Live injects, role players, timed objectives | Standard training |
| F3 Immersive | `"Immersiv"` | All devices, live cameras, comms, multiple role players, pressure injects | Evaluation, certification runs |

- Fidelity is chosen per exercise, not per scenario; every scenario in this library supports all three.

## Fictional framing (MUST)

- EXERCISE watermark on every training surface; `DEMO — FIKTIV` in demo mode.
- Fictional unit, company, and place names only; no real units, insignia, or locations.
- No real weapon, explosive, CBRN, or medical procedure content — ordnance is an abstract prop ([../domain/06-entities-and-props.md](../domain/06-entities-and-props.md)).
- Messages and dossiers are fictional; no real frequencies or callsigns.

## Safety rules (MUST)

| Rule | Detail |
| --- | --- |
| Abort authority | `safety` and EXCON can abort in ≤ 2 taps; abort shows on all devices ([../control/00-control-model.md](../control/00-control-model.md)) |
| Separation | Simulation controls never actuate real systems; no network calls to real infrastructure |
| Real-world safety | Weapons, movement, and medical safety are the operator's responsibility; the simulation never instructs them |
| Role-player welfare | Role players get briefings, a stop signal, and a debrief; pressure injects are configurable per group |
| Data hygiene | No real names, photos, or personal data in dossiers; all content fictional |

## Scenario design rules

- Every scenario MUST state: training goals, target roles, device layout, entities, MEL, objectives, evaluation criteria, debrief questions, variants.
- Objectives MUST be observable (screen events, messages, positions, timings) — never "do it well".
- Inject cadence SHOULD be 1 event per 3–5 minutes in F2, denser in F3; each inject has a purpose and a fallback if missed.
- Scenarios MUST run in `LIVE` and `PLAYBACK`; playback runs are for rehearsal and demo.
- Guided variants use templates ([../domain/07-templates.md](../domain/07-templates.md)); advanced variants may add injects, zones, and extra stations.

## Evaluation model

- Criteria per scenario: information handling, comms discipline, timing, decision quality, documentation/handover.
- Assessor notes attach to events; scores are optional 1–5 per criterion ([10-evaluation-and-aar.md](10-evaluation-and-aar.md)).
- AAR MUST reference concrete log events, not general impressions.

## Acceptance criteria

- [ ] Given any scenario file, it contains no tactical/weapons/medical procedure content.
- [ ] Given F1/F2/F3, the same scenario data is used with different fidelity settings.
- [ ] Given an abort, the exercise ends without any simulation action affecting real systems.
- [ ] Given a role player, a briefing and a stop signal exist before the exercise starts.
