# Catalog — Countdown (Sequence Control / Warhead)

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Scene id `countdown` · Default in-world title `SEQUENCE CONTROL` (company: Obsidian Sequence)
> Code: `src/scenes/shared/Warhead.tsx` (468), `shared/warheadPhysics.ts` (119), `shared/warhead.css` (304)
> Used in: Film (scene `countdown`), Training (module `countdown` renders the shunt terminal instead — see [../components/18-training-controls.md](../components/18-training-controls.md))

## Purpose

The countdown scene renders the fictional device console (default title `SEQUENCE CONTROL`): a countdown with diagnostics, a maintenance shunt, phase alignment, and a hold-to-restore action. It is the "bomb scene" — deliberately fictional (`Containment-Baugruppe` / `Spaltmaterial-Baugruppe`), with no real ordnance detail.

## State machine

| State | Trigger | Effect |
| --- | --- | --- |
| `idle` | scene start | countdown runs toward `config.duration` |
| `diagnosed` | `RUN_CHANNEL_DIAGNOSTICS` (+8 s process) | bypass enabled |
| `bypassed` | checksum `A7F3` + `INITIATE_MAINTENANCE_SHUNT` (+7 s) | phase alignment enabled |
| `safe` | `HOLD TO RESTORE_CONTAINMENT` 3 s after bypass, before duration | countdown freezes, `device.safe` |
| `expired` | clock reaches `config.duration` | `device.expired`, warning cue |

## Controls

| Control | Behavior | Code |
| --- | --- | --- |
| `RUN_CHANNEL_DIAGNOSTICS` | 8 s progress, `prompt` sound, sets `diagnostic` | `Warhead.tsx:316-326` |
| Checksum input | scripted typing enforced to `A7F3`, `type` sound | `:346-361` |
| `INITIATE_MAINTENANCE_SHUNT` | requires diagnosed + checksum; 7 s | `:182-187, :362-367` |
| 3 × `PhaseTrim` bars | drag or arrow keys; targets `25 + noise(i, seed) * 50`; tolerance ±2; disabled until bypassed | `:35-103, :382-400` |
| `HOLD TO RESTORE_CONTAINMENT` | pointer/keyboard hold 3 s; release cancels | `:188-195, :402-437` |

## Telemetry and visuals

- Left core: `AtomEmblem`, contracting containment ellipses, 4 telemetry rows (B-field, cryo, vacuum, annihilation).
- Center: countdown `hh:mm:ss` + ms, progress bar, phase `Changed`, TTY log (10 rows), safe banner.
- Arming rail: 5 stages lit by `time / duration` (`:440-455`).
- TTY log rolls every 0.2 s; telemetry wobble from seeded noise (`warheadPhysics.ts:43-98`).

## Config, cues, signals, sounds

- Config: `duration` (1–35999 s), `seed`, `device` (`antimatter` | `nuclear`), `identifier`, title/branding.
- Cues: `warning` at 50 %, 25 % remaining, and 10 s (`Warhead.tsx:138-152`).
- Signals: `device.safe` (`:122-128`), `device.expired` (`:129-136`).
- Sounds: `alert` (expiry + warnings), `beep` (every 2 s; every 1 s at warning level ≥ 2), `prompt`, `type`.

## Target state (Soll)

- MUST keep all labels fictional and abstract; NEVER real wiring, charge, or chemistry detail (principle P1).
- SHOULD expose the four steps as separate director operations (`diagnose`, `shunt`, `align`, `restore`) so shows can script partial progress.
- SHOULD map to the training `ordnance` module: same stages, plus `tampered` on wrong order (see [../../domain/05-modules.md](../../domain/05-modules.md)).
- MUST treat `device.expired` as a mission-decided consequence in training (objective failed, warning state), never a hardcoded effect.

## Edge cases

- Hold started before bypass: button disabled, no partial state.
- Phase bars moved after safe: values freeze with the clock; no re-arm.
- `duration` reduced below elapsed time in film: countdown stops at zero, expiry fires once.
- Reset (`R`) mid-sequence: all states, sliders, and logs reset to idle.

## Acceptance criteria

- [ ] Given diagnose → checksum → shunt, phase alignment becomes enabled.
- [ ] Given aligned bars within tolerance and a 3 s hold before expiry, `device.safe` fires once and the countdown freezes.
- [ ] Given no interaction, `device.expired` fires at `duration` with `alert` and warning cue.
- [ ] Given reset, the console returns to `idle` with a full countdown.
