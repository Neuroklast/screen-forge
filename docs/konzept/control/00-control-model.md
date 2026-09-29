# Control — Control Model

> ScreenForge concept set · Control & orchestration · Target state (Soll) · Language: EN, UI labels DE
> Related: [../domain/02-roles.md](../domain/02-roles.md) · [../domain/08-exercise-runtime.md](../domain/08-exercise-runtime.md)

## Purpose

One clean, efficient way to steer everything: who may do what, in which phase, from which surface — with safety and audit built in. The server stays authoritative; every control is a permission-checked command.

## Exercise phases

| Phase | German | Enter | Allowed |
| --- | --- | --- | --- |
| `draft` | `"Entwurf"` | create/open mission | build, edit, provision |
| `ready` | `"Bereit"` | readiness green | start, edit (back to draft) |
| `running` | `"Läuft"` | start | injects, messages, interventions, abort |
| `paused` | `"Pausiert"` | pause | edit (bumps revision), resume, abort |
| `aborted` | `"Abgebrochen"` | safety/EXCON abort | reset, debrief |
| `ended` | `"Beendet"` | time/objectives | debrief, export, reset |

- Mission edits are allowed only in `draft`, `ready`, and `paused`; the builder is read-only while `running`.
- Every phase change is logged with role, actor, and timestamp.

## Authority matrix (control actions)

| Action | excon | safety | assessor | hq | technician |
| --- | --- | --- | --- | --- | --- |
| Start / pause | yes | pause only | — | — | — |
| **Abort** | yes | yes (no confirm) | — | — | — |
| Reset | yes | yes | — | — | — |
| Fire manual inject | yes | — | — | — | — |
| Hold/skip/delay inject | yes | — | — | — | — |
| Release dossier | yes | — | — | mission-gated | — |
| Send message | yes | yes | — | yes | — |
| Complete objective | yes | — | — | mission-gated | — |
| Provision/revoke device | yes | — | — | — | yes |
| Edit mission | yes | — | — | — | — |
| Add note / score | yes | yes | yes | — | — |
| Remote device actions | yes | abort only | — | — | yes |

- `safety` abort MUST work without EXCON confirmation and without network round-trip blocking the UI.
- `technician` is content-blind: device metadata only.

## Control surfaces

| Surface | Role | Contents |
| --- | --- | --- |
| Exercise Control | excon | phase bar, MEL/inject panel, patient panel, devices, live map, log, debrief |
| Safety console | safety | status board, abort, message, notes |
| Assessor view | assessor | timeline, notes, criteria sheet |
| HQ console | hq | map, objectives, stations, patients, cameras, dossiers, messages |
| Device admin | technician | device list, provisioning, health, remote actions |

## Efficiency principles

- **Keyboard-first for control roles**: phase control, inject fire, message, abort all have shortcuts; every shortcut has a visible equivalent.
- **One primary action per surface**: EXCON's primary is the next MEL event; the UI suggests it.
- **Bulk operations**: provision multiple devices, message multiple stations, duplicate missions.
- **Presets**: room templates, inject macros, message templates ([01-inject-orchestration.md](01-inject-orchestration.md)).
- **No hidden state**: phase, revision, clock, and pending actions are always visible in the header.

## Safety model

- Abort in ≤ 2 taps from any EXCON/safety surface; banner on all devices within one tick.
- Abort is irreversible without reset; reset requires confirmation with consequence text.
- Destructive actions (delete mission, revoke all, reset) are confirmed and logged with actor + time.
- Emergency path: if EXCON disconnects, safety keeps full abort/reset authority.

## Audit trail

- Every control action logs: `at` (server clock), `role`, `actor` (station/session), `action`, `target`, `result`.
- The log is append-only per exercise and included in the debrief export.
- Auth events (login, invite redemption, revoke, failed unlock) are part of the audit trail.

## Target state (Soll)

- Implement the phase model server-side (today: `frozen` boolean only) with explicit transitions.
- Implement the safety and assessor surfaces; today only trainer/HQ/element exist.
- Add the audit trail with actor identity; today log messages carry no role.
- Add a command palette and shortcuts for control roles.

## Acceptance criteria

- [ ] Given a running exercise, the builder is read-only and pause is one click away.
- [ ] Given a safety abort, all devices show the banner within one tick and the log records role + time.
- [ ] Given a technician session, no mission content is visible.
- [ ] Given a phase change, the header reflects it on every surface within one tick.
