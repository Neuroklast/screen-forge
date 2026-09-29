# Catalog — Block: Lock (Keypad)

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Code: `src/scenes/blocks/Blocks.tsx:18-36`, `src/components/CodePad.tsx` (129)
> Used in: Film (block `lock`). Training maps module `lock` to `TrainingTerminal` instead — see [../components/18-training-controls.md](../components/18-training-controls.md)

## Purpose

The Lock block is a standalone access keypad: a small framed surface that gates a scene behind a code. It is the simplest interactive block and the basis for the global stage CodePad.

## Component tree

- `HudFrame` labeled `KEYPAD` (`data-frame` hud/plate/none aware) → embedded `CodePad` (`Blocks.tsx:21-33`).
- `CodePad` modes: numeric (`1-9, clear, 0, enter`) and alphanumeric (A–Z, 0–9, clear, enter) (`CodePad.tsx:4-10`).
- Mode switch buttons inside the pad; keyboard listener supports digits/letters/Enter/Backspace (`:59-75`).

## Behavior

| Action | Result | Code |
| --- | --- | --- |
| Key press | `type` sound, value appends (max 8 chars) | `CodePad.tsx:53-57` |
| `clear` | resets value, `click` | `:32` |
| `enter` correct | `load` sound, emits `screenforge:input {type:"pin", value}`, `onUnlock()` | `:36-45` |
| `enter` wrong | `fail` sound, shake (`key={denied}`), `"SIGNATURE MISMATCH / RETRY"` | `:46-50` |
| Mount | `prompt` sound | `:57` |
| Fake mode | accepts any 4–8 char code (staging) | `:37-44` |

- Comparison is case-insensitive (`value.toUpperCase() === code.toUpperCase()`).
- Block completion: `onCue("complete")` + signal `lock.open` (`Blocks.tsx:28-31`).

## Config

| Field | Meaning | Default |
| --- | --- | --- |
| `pin` | expected code (4–8 alphanumeric) | `2048` |
| `pinMode` | `numeric` or `alphanumeric` pad | `numeric` |
| `pinFake` | staging mode: any valid-length code unlocks | `false` |

## Target state (Soll)

- MUST add a retry lockout to the block (training terminal already locks 3 s server-side after a wrong code — align behavior).
- SHOULD show attempt count and lockout countdown in the pad (`"Noch 2 Versuche"`).
- SHOULD support per-step codes in shows (a step may set `config.pin` and the pad uses it — already partially wired via `applyStep`).
- MAY add an optional "access granted" full-screen flash for stage use.

## Rework V2 (Soll)

- MUST animate key presses, the scan/verify step, the unlock sequence and the error shake; sounds per event.
- SHOULD show an unlock sequence (bolt release, door state) instead of only a cue change.
- MUST be configurable via `sceneOptions.lock` (code length, attempts, animations, sounds).

## Edge cases

- Pad unmounted mid-entry: no signal emitted; state discarded.
- `pinFake` toggled while open: next entry uses the new mode; current value kept.
- Empty code configured: pad always denies; linter should warn in show editor.
- Alphanumeric mode on a numeric-only show: pads switch at runtime, no reload.

## Acceptance criteria

- [ ] Given the correct code, the pad unlocks once and emits `pin` + `lock.open`.
- [ ] Given a wrong code, the pad shakes, plays `fail`, and keeps the value cleared.
- [ ] Given `pinFake`, any 4–8 char code unlocks without changing the configured code.
- [ ] Given 8 entered chars, further keys are ignored.
