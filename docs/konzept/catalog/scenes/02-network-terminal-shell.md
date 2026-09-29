# Catalog — Network Terminal (Netzwerkterminal)

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Scene id `terminal` · Default in-world title `BLACKLINE` (company: Blackline Operations) · Code: `src/scenes/os/CyberOS.tsx` (1420 lines), `os/state.ts`, `os/data.ts`, `os/LockScreen.tsx`, `os/Messages.tsx`, `os/Visuals.tsx`, `os/ActorPlayback.tsx`, `os/os.css` (1846 lines)
> Used in: Film (scene `terminal`). Training maps module `terminal` to dossier cards instead — see [../components/18-training-controls.md](../components/18-training-controls.md)

## Naming (concept clarification)

- The scene is the **network terminal** (German UI name `Netzwerkterminal`); `BLACKLINE` is its default in-world title, i.e. the brand of the company Blackline Operations.
- Companies are identities, not scenes ([../20-companies-and-brands.md](../20-companies-and-brands.md)); any of the 14 companies MAY be applied to this scene via SystemProfiles.

## Purpose

The network terminal renders a complete fictional desktop OS: eight apps, a lock screen, and a sequence engine. It is the deepest scene in the product and the anchor of the dark theme family.

## Shell regions

| Region | Contents | Code |
| --- | --- | --- |
| Topbar | brand, title/subtitle, link dot, cue status, identifier, lock button | `CyberOS.tsx:331-354` |
| Desktop | 3 folder icons (Archives/Datasets/System), 7 app icons | `:356-394` |
| Start menu (sidebar) | 8 apps with codes, operator fingerprint `GUEST.2048`, access level 04 | `:395-427` |
| Workarea | window bar (app code/name, sequence status, close), app or sequence panel | `:428-1272` |
| Taskbar | start toggle, pinned Terminal/Files/Personnel, scene clock, READY/EXCEPTION | `:1275-1307` |
| File modal | path, classification, content, `Recover archive`, `Inspect projection`, focus trap | `:1308-1404` |
| Lock screen | 3-gate alignment + 3.5 s fingerprint hold | `:1405-1417`, `LockScreen.tsx` |

## Apps

| App | Code | Key behavior |
| --- | --- | --- |
| Workspace `overview` | 00 | Dashboard (TraceMap, case links, quick launch) — **unreachable** today (`:428` gates on `active \|\| app !== "overview"`) |
| Terminal `terminal` | 01 | 14 commands, history, Tab completion, `StageKeys`, actor mode, `TerminalVisual` |
| Filesystem `files` | 02 | 5 folders, search, file table, modal, archive recovery, generated reports |
| Personnel `personnel` | 03 | 3 persons, hero portrait, 4 dossier tabs, biometric analysis, record modal |
| Data clusters `clusters` | 04 | TraceMap, 3 collections, `Run correlation` |
| 4D projection `dimension` | 05 | Tesseract, XW/YZ sliders, freeze/rotate, `Reconstruct manifold` |
| Sequences `sequences` | 06 | 13 library cards + `Run full operation` (see [03-network-terminal-sequences.md](03-network-terminal-sequences.md)) |
| Messages `messages` | 07 | 5 secure messages with actions (decrypt/personnel/reconstruct/files) |

## Lock screen mechanics

- Gate 1–3: slider clamped to the current third; confirm via pointer up / Arrow / End / Enter / Space (`LockScreen.tsx:29-36, :91-128`).
- Fingerprint: hold 3.5 s; progress derives from the scene clock, so pausing freezes the scan (`:21-28, :130-172`).
- Unlock → `dispatch unlock` + `run("boot")` (`CyberOS.tsx:1411-1414`).

## Terminal commands

`help`, `clear`, `ls [path]`, `cd <folder>`, `cat <file>`, `open <app>`, `scan`, `decrypt`, `correlate`, `reconstruct`, `reboot`, `lock`, `status`, `inspect` (`CyberOS.tsx:229-316`). Commands map to sequences (`scan`→intrusion, `decrypt`, `correlate`, `reconstruct`, `reboot`→boot).

## Config, signals, sounds

- Config: `title/subtitle/identifier`, `brand`, `cue`, `seed`, `osApp`, `mediaIds`, `sequenceScale`, `actorMode/script/commandsUntilSuccess`, `overlays.glow`.
- Signals: `shell.submit`, `shell.success`, `file.found:<path>`, `file.decrypt:<path>`, `dossier.open`, `sequence.complete`.
- Sounds: `type`, `click`, `openFolder`, `openProfile`, `hack1`/`hack2`, `newline`, `scroll`.
- `operation` prop auto-runs a matching sequence and drives cue `active` → `warning` → `complete`.

## Target state (Soll)

- MUST make Workspace reachable (bug fix) or remove it from the app list; no dead app icons.
- SHOULD gate Personnel content by released dossiers in training and hide unreleased persons entirely.
- SHOULD keep all eight apps operable by touch (field) and keyboard (HQ/director) — see [../../usability/07-accessibility-devices.md](../../usability/07-accessibility-devices.md).
- MUST expose the lock screen as an optional start state per show/mission (`lockAtStart`).

## Edge cases

- Lock screen while clock paused: hold progress freezes (by design); `onPlay` resumes.
- File modal open when a sequence starts: modal stays on top; sequence continues behind.
- `osApp` points to a removed app: fall back to desktop with a notice.
- Media missing for Personnel portraits: monogram placeholder, no layout shift.

## Acceptance criteria

- [ ] Given the desktop, every icon opens a rendering app; no icon leads to a blank workarea.
- [ ] Given the lock screen, unlocking runs the boot sequence and lands on the desktop.
- [ ] Given actor mode, after `commandsUntilSuccess` submits the shell blocks further input and emits `shell.success`.
- [ ] Given a training session, unreleased dossiers never appear in Personnel.
