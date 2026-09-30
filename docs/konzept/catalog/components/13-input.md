# Catalog — Components: Input (CodePad, StageKeys, GestureSurface)

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Code: `src/components/CodePad.tsx` (129), `StageKeys.tsx` (42), `GestureSurface.tsx` (129)

## CodePad / CodeEntry

- `CodeEntry` (`src/components/CodeEntry.tsx`) is the single code-entry capability (SSOT: never two implementations): value buffer, numeric/alphanumeric QWERTY keypad, keyboard input, sounds and the denied shake. `CodePad` wraps it with the modal/embedded chrome, heading and mode switch; the workflow code-challenge surface (`src/scenes/workflow/Surfaces.tsx`) reuses the same component with a fixed `length` and `mask`.
- Purpose: modal or embedded access-code dialog; used globally (`App.tsx:470`) and inside the Lock block (`Blocks.tsx:22`).
- Props (`CodePad`): `code`, `title`, `heading` (SSOT dialog heading, e.g. `Maintenance login`), `onUnlock()`, `mode` (`numeric` default), `fake`, `embedded`, `attempts` (lockout after N denials; the Lock block passes `sceneOptions.lock.attempts`).
- Props (`CodeEntry`): `length`, `minLength`, `mode`, `mask`, `denied`, `disabled`, `showModeSwitch`, `labels`, `onSubmit` (returning `true`/`false` drives the `load`/`fail` sounds).
- Alphanumeric pad is **QWERTY** (`1234567890` / `QWERTYUIOP` / `ASDFGHJKL` / `ZXCVBNM` + `CLEAR`/`ENTER`), not alphabetical.
- State: `value`, `denied` counter (drives shake), `pad` mode (switchable at runtime).
- Behavior:
  - Key press appends (max `length`), `type` sound; `clear` resets with `click`; mount plays `prompt`.
  - Correct: case-insensitive compare → `load` sound + `screenforge:input {type:"pin", value}` + `onUnlock()`.
  - Wrong: `fail` sound, shake, `"SIGNATURE MISMATCH / RETRY"`.
  - `fake` mode: any 4–8 char code unlocks (staging).
  - Global keyboard listener for digits/letters/Enter/Backspace.
- Known issues: keyboard effect re-binds every render (no dependency array).
- Soll: focus management (autofocus first key, `Esc` cancels in modal mode), aria-live for denied state.

## StageKeys

- Purpose: on-screen keyboard for the terminal scene (actor typing on touch stages).
- Props: `onKey(key)`, `disabled?`, `active?` (key currently shown as pressed).
- Layout: rows `1234567890`, `QWERTYUIOP`, `ASDFGHJKL`, `ZXCVBNM-.`; extras `SPC`, `DEL` (Backspace), `RET` (Enter).
- Feedback: the key matching `active` renders with the pressed style (`is-active`), so on-screen and physical typing light the same key that appears in the console.
- Soll: German QWERTZ layout option, key repeat on hold, aria-labels per key (currently only a group label).

## GestureSurface

- Purpose: pointer/touch/wheel transform surface for spatial scenes (Tracking, Hologram, 4D projection).
- Props: `children`, `label` (aria). Exports `Transform {x, y, scale, rotation}`.
- Behavior: 1 pointer = pan; 2 pointers = pan + pinch + rotate (`atan2` delta); wheel zoom ×0.94/×1.06.
- Clamps: scale 0.5–3; x ±450 px; y ±300 px. Pointer capture; rebase on up/cancel/lost-capture; native `wheel` listener with `{passive:false}`.
- Coordinate scaling accounts for CSS transform via `rect.width / offsetWidth`.
- Soll: keyboard pan/zoom alternative (arrow keys + `+`/`-`), `prefers-reduced-motion` unaffected (transform only), double-tap reset gesture, and a visible reset control in every consumer.

## Cross-cutting requirements

- All three components MUST be operable by touch and keyboard; drag/pinch is never the only path ([../../usability/04-builder-interaction.md](../../usability/04-builder-interaction.md)).
- All three MUST respect `prefers-reduced-motion` for their own animations (shake, key press feedback).
- Inputs MUST NOT steal global shortcuts while a text field is focused.

## Acceptance criteria

- [ ] Given CodePad in modal mode, `Esc` closes it and focus returns to the opener.
- [ ] Given a wrong code, the pad shows the denied state and increments the attempt count.
- [ ] Given GestureSurface focused, arrow keys pan within clamps.
- [ ] Given StageKeys disabled, no `onKey` fires for any input.
