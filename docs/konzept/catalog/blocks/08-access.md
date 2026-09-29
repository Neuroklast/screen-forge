# Catalog — Block: Access (Interlock)

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Code: `src/scenes/blocks/Blocks.tsx:37-73`
> Used in: Film (block `access`). Training maps module `access` to `TrainingTerminal` — see [../components/18-training-controls.md](../components/18-training-controls.md)

## Purpose

The Access block simulates a door interlock: the operator must hold a button while a bolt current builds, then the door unlatches. It is a pure hold interaction with no code.

## Component tree

- `HudFrame` labeled `INTERLOCK` → bolt-current meter (fill bar) → hold button (`Blocks.tsx:40-71`).
- Button label: `"HOLD TO UNLATCH n%"` while held, `"UNLATCHED"` when complete (`:55-63`).

## Behavior

| Action | Result | Code |
| --- | --- | --- |
| Pointer/key hold | progress `(time - hold) / 2` → 2 s to complete; `prompt` on press | `:42-63` |
| Release early | progress resets to 0; no signal | `:44-47` |
| Complete | door opens, `onCue("complete")`, signal `access.open` | `:44-45` |
| Complete (state) | button disabled, meter full | `:55-63` |

- The hold uses the scene clock: pausing the scene freezes progress.
- No sounds besides `prompt` on press; no config fields.

## Target state (Soll)

- SHOULD make hold duration configurable per step/station (default 2 s) and expose it in the inspector.
- SHOULD support a code-gated variant (hold + code) for training `access` objectives.
- MUST keep release-to-cancel semantics — no accidental unlock.
- MAY add a relock action (door closes) for scenario reuse.

## Edge cases

- Hold started while scene paused: progress stays 0 until play.
- Reset during hold: hold state clears, button returns to idle.
- Multiple pointers: only the first active hold counts; extra pointers ignored.
- Cue `warning` active: no visual change defined yet — Soll adds a degraded interlock style.

## Acceptance criteria

- [ ] Given a 2 s hold, the block completes once and emits `access.open`.
- [ ] Given an early release, no signal is emitted and progress resets.
- [ ] Given a paused scene, hold progress does not advance.
- [ ] Given completion, the button stays disabled until reset.
