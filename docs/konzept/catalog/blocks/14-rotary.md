# Catalog — Block: Rotary (Drehregler)

> ScreenForge concept set · Catalog · Target block (Soll, new) · Language: EN, UI labels DE
> Scene id `rotary` (new) · Code: new `src/scenes/blocks/Rotary.tsx` · Film block first, training module later
> Related: [12-slide.md](12-slide.md) · [../scenes/04-sequence-control.md](../scenes/04-sequence-control.md)

## Purpose

A panel of rotary controls (dials) with detents and target values: tuning a frequency, setting a valve, aligning phases, dialing a combination. It gives scenes a physical, tactile control element and a clear success condition.

## Component tree (target)

- `HudFrame` `ROTARY` → dial row (1–4 knobs), per-dial label, value readout, target marker, lock state, status line.
- Each dial: SVG ring with ticks, pointer, detents, drag/keyboard control, fine adjustment.

## Behaviour

| Action | Result |
| --- | --- |
| Drag / arrow keys | Rotate the dial; detents snap every step |
| Fine mode (Shift) | Smaller steps between detents |
| Target reached (all dials) | Dial locks, status turns `aligned`, emits `rotary.aligned` |
| Wrong combination on confirm | Error shake, `rotary.rejected`, optional attempt counter |
| Reset | All dials return to start positions |

- Dials are deterministic: positions derive from state, not pointer history.
- Touch: large hit areas, no hover-only affordances.

## Config (`sceneOptions.rotary`)

| Option | Meaning |
| --- | --- |
| `dials` | 1–4 dials: label, min, max, step, target, start |
| `confirm` | require explicit confirmation vs auto-align |
| `attempts` | optional max attempts |
| `labels` | success/error text |

## Film & training use

- Film: tuning sequences, valve/phase alignment, combination entry.
- Training: later as a module for multi-step alignment tasks; emits `rotary.aligned` / `rotary.rejected`.

## Target state (Soll)

- MUST be operable by touch and keyboard; detents visible.
- MUST be deterministic and freeze with the scene clock where animated.
- MUST stay squared and dense.
- SHOULD animate the pointer with a short ease and play a tick sound per detent.

## Edge cases

- Target outside min/max: config error shown in the inspector.
- Only some dials aligned: status shows progress (`2/3`).
- Rapid input: value clamps to range, no jitter.
- Reduced motion: pointer jumps without easing.

## Acceptance criteria

- [ ] Given all dials on target, the block emits `rotary.aligned` once.
- [ ] Given a wrong confirmation, an error state appears and the dials remain editable.
- [ ] Given keyboard-only use, every dial is settable to its target.
- [ ] Given reset, all dials return to their start positions.
