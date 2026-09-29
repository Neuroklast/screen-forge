# Catalog — Block: Medical (Bio Monitor)

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Code: `src/scenes/blocks/Blocks.tsx:74-141`, `src/core/patient.ts` (133)
> Used in: Film (block `medical`), Training (module `medical` via `StageFrame` + intervention buttons — see [../components/18-training-controls.md](../components/18-training-controls.md))

## Purpose

The Medical block is a simulated patient monitor: seven vitals, an ECG trace, alarms, and a treatment action. It is the only block that bridges film and training natively.

## Component tree

- `HudFrame` labeled `BIO MONITOR` → alarm-class header: patient id + kind, ECG SVG, 7-vital grid, `MARK TREATED` (`Blocks.tsx:76-139`).
- Vitals: HR, SPO2, RR, NIBP, ETCO2, TEMP, GCS (`:99-121`).

## Data model

| Source | Behavior | Code |
| --- | --- | --- |
| Training context (`useExerciseMaybe`) | patient = station binding (`bindings.patient` / legacy `entityId`) | `Blocks.tsx:77-81` |
| No context (film) | `createPatient()` → `"UNKNOWN / FIELD"` | `:78` |
| Vitals | `vitalsOf(patient, time, seed)` merged with station `overrides` | `:79` |
| Alarm | kind `arrest` or `desat` | `:92` |
| ECG | waveform derived from kind + heart rate | `patient.ts:119-133` |

- Kinds: `stable`, `tachy`, `brady`, `desat`, `trauma`, `arrest`, `recovered` (`patient.ts:34-117`), deterministic 2 Hz seeded noise, `arrest` = fixed zeros.
- Overrides are applied in the UI only; the server state stays authoritative.

## `MARK TREATED`

| Context | Action | Code |
| --- | --- | --- |
| Training | sends intervention `treated`; disabled when offline, frozen, or already reported | `Blocks.tsx:124-136` |
| Film | `onPlay`, `onCue("complete")`, signal `medical.enable`, `prompt` sound | `:129-132` |

## Config, cues, signals

- Config: `seed` (vitals noise).
- Cue: `complete` on treatment in film.
- Signal: `medical.enable` (film); training forwards interventions server-side.

## Target state (Soll)

- MUST offer all four interventions in the block (`treated`, `tourniquet`, `oxygen`, `evacuated`) with parity to the training element view.
- SHOULD show the bound patient name in training and hide the "UNKNOWN / FIELD" fallback there.
- SHOULD drive alarm states from mission injects (e.g. `arrest` after an inject) and log each intervention with station + time.
- MUST keep vitals fictional and simulation-only; no real medical device behavior.

## Rework V2 (Soll)

- MUST show more values: vitals plus trend arrows, lab row, timeline strip, alarm history.
- MUST animate ECG, respiration and alarm states; alarm levels change color and pulse.
- MUST use a clean, dense layout (aligned grids, no cramped stacks, squared chrome).
- MUST be configurable via `sceneOptions.medical` (values shown, alarm limits, trend window, sounds).

## Edge cases

- Patient deleted mid-run: block falls back to `"UNKNOWN / FIELD"` and shows a binding warning.
- Station offline: treatment button disabled with reason tooltip.
- Frozen clock: vitals freeze (time-based), alarm state persists.
- Overrides cleared by a patient action: block returns to computed vitals within one tick.

## Acceptance criteria

- [ ] Given a bound patient in training, the monitor shows that patient's vitals and name.
- [ ] Given kind `arrest`, the block shows the alarm class and zeroed vitals.
- [ ] Given `MARK TREATED` in training, exactly one `treated` intervention is sent and the button disables.
- [ ] Given film mode, treatment plays the scene, sets `complete`, and emits `medical.enable`.
