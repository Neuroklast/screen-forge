# Catalog — Terminal (Kommandozeile)

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Scene id `terminal` · Own component (extracted from the former combined OS) · Code: new `src/scenes/terminal/Terminal.tsx`
> Related: [02-operating-system.md](02-operating-system.md) · [03-os-sequences.md](03-os-sequences.md)

## Purpose

The terminal is its own scene: a command line that **has a goal**. Instead of free typing with no outcome, it runs a configurable chain of commands that ends in a defined result — e.g. bypassing a login, unlocking a file, or recovering a session.

## Look & feel (normative)

| Rule | Detail |
| --- | --- |
| Squared | No border radius; 1 px frame; monospace grid |
| Dense | Base type 12 px monospace, 18 px line height, generous padding |
| Honest | Fictional commands and outputs only; no real system access |
| Feedback | Every command gives a typed response line; errors are visible and recoverable |

## Behaviour

- Prompt with host/user label, blinking block cursor, command history (↑/↓), Tab completion.
- Scripted typing mode (actor): the expected command is typed automatically for stage use.
- On-screen keyboard for touch stages.
- Output lines appear with a short delay per line (`newline` sound), scrollable log.
- Reset returns to step 0; failures show a typed error and keep the goal open.

## Goal chain (the point of the scene)

| Concept | Meaning |
| --- | --- |
| Goal | Named objective shown in the header, e.g. `"Login überbrücken"` |
| Steps | Ordered `{ command, outputs[], hint? }` — the exact command advances the chain |
| Wrong input | Typed error + hint, no progress; optional attempt counter |
| Completion | Final step prints the success text, sets the cue to `complete`, emits `terminal.bypass` |
| Progress | Step indicator (`Schritt 2/4`) and a progress rail |

## Config (`sceneOptions.terminal`)

| Option | Meaning |
| --- | --- |
| `goal` | Goal label shown in the header |
| `prompt` | Prompt label (host/user) |
| `steps` | Command chain: command, output lines, optional hint |
| `successText` | Final confirmation text |
| `attempts` | Optional max attempts before a soft lock |
| `actorMode` / `script` | Prepared typing (existing behaviour, moved here) |

## Film & training use

- Film: a director step starts the terminal; steps can be advanced manually or by input (`signal`/`key` triggers).
- Training: module `terminal` renders this scene; completion emits `terminal.bypass` for injects/objectives; the previous dossier cards move to the OS module ([02-operating-system.md](02-operating-system.md)).

## Target state (Soll)

- MUST have a defined goal and a completion signal; free typing without a goal is not the default.
- MUST be usable by touch (on-screen keys) and keyboard.
- SHOULD keep the goal chain editable in the inspector (steps, outputs, success text).
- SHOULD play `type`/`newline` sounds and keep outputs fictional.

## Edge cases

- Wrong command: error line, hint after the second attempt, no progress.
- Chain completed: further input is ignored until reset; success stays visible.
- Actor mode with a mismatched script: fall back to free input with a notice.
- Scene started mid-chain (director seek): chain state derives from the step index, not wall time.

## Acceptance criteria

- [ ] Given the correct command sequence, the terminal completes the goal and emits `terminal.bypass` once.
- [ ] Given a wrong command, an error and hint appear and the step does not advance.
- [ ] Given touch-only use, the goal is completable with the on-screen keyboard.
- [ ] Given reset, the chain returns to step 0 with a cleared log.
