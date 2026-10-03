# Control — Inject Orchestration

> ScreenForge concept set · Control & orchestration · Target state (Soll) · Language: EN, UI labels DE
> Related: [00-control-model.md](00-control-model.md) · [../domain/08-exercise-runtime.md](../domain/08-exercise-runtime.md) · [../scenarios/01-exercise-anatomy-and-mel.md](../scenarios/01-exercise-anatomy-and-mel.md)

## Purpose

The MEL (Master Event List) is the exercise's script. Orchestration makes it controllable in real time: see what comes next, fire it manually, hold or skip it, and understand what each inject will do before it lands.

## Inject model (target)

| Capability | Rule |
| --- | --- |
| Scheduled | `timer` trigger with `at` + seeded `jitter` |
| Manual | `manual` trigger, fireable any time while `running` |
| Conditional | `zone`, `prop`, `signal`, `intervention` triggers |
| Re-firable | explicit `"Erneut auslösen"` with cooldown; default once per run |
| Chainable | action `inject` (fire another inject) with depth limit 3 |
| Delayed | `delay` field (seconds) applied before actions |
| Repeatable | `repeat` (count + interval) with hard cap |
| Skippable | EXCON can mark `"Übersprungen"`; logged |
| Holdable | pause a pending inject until resumed; logged |

- Every inject keeps its `purpose` and `fallback` text from the scenario file and shows them in the panel.
- Actions are the v2 set: `patient`, `release`, `camera`, `objective`, `message`, `prop`, `lock`, `beacon`, `ordnance`, `sound`, `state`, `inject`.

## MEL v2 (management layer)

Beyond trigger + action, every MEL entry carries training intent and audit state:

| Field | Purpose |
| --- | --- |
| `purpose` | why the inject exists (no decorative injects) |
| `objective` | the training objective the event serves (links to `objectives[]`) |
| `expectedOutcome[]` | observable reaction |
| `evidence[]` | which log event proves the outcome |
| `failurePolicy` | `continue` / `degrade` / `hold` / `branch` / `trainerDecision` |
| `fallback` | alternative delivery if the primary fails |
| `escalation` | optional follow-up inject |
| `safetyGate` | preconditions without which the inject never fires |
| `owner` | responsible controller |
| `audience[]` | roles/stations that see the effect |
| `conditions[]` | extra guards |
| `plannedAtOriginal` | original planned time (never overwritten) |
| `scheduledAt` | current planned time (live edits) |
| `timeBasis` | `exercise` or `wall` |
| `status` | `planned` / `held` / `armed` / `fired` / `skipped` / `expired` / `replaced` |
| `revision` | live-edit conflict control |

- The event editor exposes `purpose`, `objective`, `expectedOutcome` and `evidence` under `"Auswertung (MSEL)"`; the linked objective is named in the event summary (`"… → Ziel: …"`), so the "why" is visible without opening Advanced.
- Inject classes group the palette: Information, Communications, Resource, Human, Environment, Authority, Safety, Evaluation.
- A reschedule is a command, not a field overwrite: `MSEL_RESCHEDULED { entryId, from, to, actor, reason, revision }`.
- A fired inject is never "withdrawn" by moving its time; a new controller event is created instead.
- Failure never produces a game-over: `failurePolicy` yields a new state or a trainer branch.

## Scheduler panel (EXCON)

```text
MEL — nächste Ereignisse                    [Filter] [Nur aktive]
T+07:00  Interview-Akte freigeben   (timer)   [Jetzt] [Halten] [Skip]
T+09:00  Patient verschlechtert     (timer)   [Jetzt] [Halten] [Skip]
—        Kanal belegt (manuell)     (manual)  [Auslösen]
> Effekt: Akte B freigegeben → HQ & Spieler sichtbar. Zweck: widersprüchliche Infos.
```

| Element | Behavior |
| --- | --- |
| Upcoming list | sorted by due time; manual injects listed separately |
| Countdown | live time-to-fire per pending timer |
| `Jetzt` | fire immediately (manual fire), logged |
| `Halten` / `Fortsetzen` | hold/resume a pending timer |
| `Skip` | mark skipped with reason (dropdown: not needed / missed / replaced) |
| `Erneut auslösen` | re-fire with cooldown (default 60 s) |
| Effect preview | plain-language summary of actions before firing |
| Undo | within 10 s for message/camera/objective actions; patient changes are not undoable |

## AAR / debrief

The debrief is a projection of the authored scenario plus the exercise state (`buildDebrief` in `src/core/debrief.ts`): every event is grouped under the training objective it serves and carries its `purpose`, `expectedOutcome` and `evidence`; each objective shows whether it was met and which of its events fired.

- Events without an objective and objectives without an event are surfaced as gaps, not hidden.
- Status is `planned`, `fired` or `skipped`. A suppressed inject (`unless` guard met) is **skipped**, never fired: the runtime keeps `state.skipped` next to `state.fired` for exactly this reason.
- The AAR panel lives in the Overview (heading from the `after_action_review` terminology term), next to the existing debrief log export. The JSON export includes the report; a separate CSV lists objective / event / status / expected / evidence.
- After a run the report projects the executed scenario (`state.scenario`); before the first fire it is a planning checklist over `draft`, so unsaved MEL edits are visible while preparing.
- Every CSV export goes through the shared `csvCell` encoder, which neutralises spreadsheet formula injection (a leading `=`/`+`/`-`/`@`/tab/CR gets an apostrophe).

## Macros

- A macro is a named set of actions + optional delay, fired from a hotkey or button (e.g. `"Funkausfall 60 s"`).
- Macros are mission data (reusable) and MAY reference existing injects.
- Hotkeys: `F1..F8` for macros, `M` for manual fire of the next manual inject, `Space` pause/resume.
- Macros are logged like injects (name + actor).

## Trigger and action v2 (extensions)

| New | Detail |
| --- | --- |
| Trigger `manual` | no condition; EXCON fires |
| Trigger `intervention` | already exists; extend with `count` (e.g. after 2nd intervention) |
| Action `prop` | set a prop state (`from` → `to`) |
| Action `beacon` | force beacon state (`active`, `interference`, `off`) |
| Action `ordnance` | force ordnance stage (`tampered`, `disarmed`) |
| Action `lock` | engage/release lockdown |
| Action `sound` | play a sound on selected stations |
| Action `state` | set scene mood (warning/critical) |
| Action `inject` | chain another inject (depth ≤ 3) |

- Extensions build on the existing rules engine ([../domain/08-exercise-runtime.md](../domain/08-exercise-runtime.md)); no parallel system.

## Rules

- Firing is blocked while `paused` except explicit manual fire (which prompts to resume or applies on resume).
- Each fire/attempt is logged with result (`fired`, `skipped`, `held`, `blocked`).
- `jitter` stays seeded and deterministic; manual fire bypasses timing only, never randomness of content.
- The MEL panel MUST show the same order the engine evaluates.

## Target state (Soll)

- Implement `manual` trigger and the scheduler panel; today the live tab is a read-only list.
- Implement hold/skip/re-fire with logging.
- Implement macros with hotkeys.
- Implement effect preview and the 10 s undo for reversible actions.

## Acceptance criteria

- [ ] Given a running exercise, EXCON fires a manual inject and all affected roles update within one tick.
- [ ] Given a held timer, it does not fire until resumed; both events are logged.
- [ ] Given a skipped inject, the MEL shows the reason and the engine never fires it.
- [ ] Given a macro hotkey, its actions apply and are logged with the macro name.
