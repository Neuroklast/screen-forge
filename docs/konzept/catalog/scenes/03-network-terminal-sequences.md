# Catalog — Network Terminal — Sequences

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Scene id `terminal` (sequences belong to the network terminal scene) · Code: `src/scenes/os/sequences.ts` (852 lines), `os/SequencePanel.tsx` (202), `os/Visuals.tsx` (403), `os/ActorPlayback.tsx` (338)
> Related: [02-network-terminal-shell.md](02-network-terminal-shell.md)

## Purpose

Sequences are time-coded choreographies that make the network terminal feel like a working system: each has phases, telemetry, logs, and a visual mode. They are pure functions of scene time — seek-safe, deterministic, no timers.

## Sequence library (14)

| # | id | Name / code | Duration | Phases | Visual modes |
| --- | --- | --- | --- | --- | --- |
| 1 | `boot` | Cold start / SYS 00 | 108 s | 6 | rings → matrix → spectrum → trace → lattice → rings |
| 2 | `intrusion` | Relay intrusion / NET 07 | 130 s | 6 | spectrum, trace, rings, matrix, lattice, spectrum |
| 3 | `decrypt` | Archive recovery / ARC 41 | 106 s | 5 | matrix, lattice, spectrum, trace, rings |
| 4 | `cluster` | Cluster correlation / DATA 12 | 112 s | 5 | matrix, spectrum, trace, lattice, matrix |
| 5 | `biometric` | Identity analysis / BIO 04 | 76 s | 4 | fingerprint ×2, trace, rings |
| 6 | `reconstruct` | Dimensional reconstruction / DIM 04 | 116 s | 5 | lattice, matrix, lattice, spectrum, trace |
| 7 | `beacon` | Locator handshake / LOC 12 | 37 s | 3 | spectrum, fingerprint, trace |
| 8 | `theft` | Archive extraction / ARC 04 | 47 s | 3 | lattice, matrix, trace |
| 9 | `payload` | Service image staging / IMG 08 | 41 s | 3 | matrix, rings, spectrum |
| 10 | `counterhack` | Intrusion response / RSP 05 | 39 s | 3 | spectrum, lattice, rings |
| 11 | `door` | Access controller / ACS 02 | 34 s | 3 | rings, matrix, trace |
| 12 | `medical` | Emergency protocol / MED 01 | 33 s | 3 | fingerprint, rings, trace |
| 13 | `facility` | Facility directory / DIR 00 | 18 s | 2 | matrix, spectrum |
| 14 | `operation` | Perimeter breach / OP 07 | 256 s | 13 (boot + intrusion + exception) | all + spectrum |

- Each phase carries name, detail, duration, channel, visual mode, and 4 log lines.
- `sequenceDuration` (`sequences.ts:822-824`) and `sequenceState` (`:825-852`) are pure; `config.sequenceScale` (0.25–4) multiplies durations.
- `operation` ends with `"Containment exception."` (`SequencePanel.tsx:126-137`).

## SequencePanel

- Header: objective, abort/return, phase list with checkmarks and auto-scroll, active `SequenceVisual`, phase name/detail, progress bar with 48 ticks, telemetry meters (REFERENCE LOCK / COHERENCE / BUFFER WINDOW, noise-driven), frame signature hex, journal (last 7 lines).
- Runs from: Sequences app cards, terminal commands, `operation` prop of a director step.

## Visual modes (SequenceVisual)

`lattice`, `fingerprint`, `trace`, `matrix`, `spectrum`, `rings` (`Visuals.tsx:251-403`), shared with TraceMap, Hypercube, and FingerprintGraphic.

## Actor playback

- 9-step command chain with fixed outputs (`ActorPlayback.tsx:8-113`); each submit runs 4 s with a new line every 0.8 s (`newline` sound).
- After `commandsUntilSuccess` (default 4) submits, input blocks and `shell.success` is emitted (`:114-188`).
- `TerminalVisual` shows a media slideshow (auto every 5 s, local upload max 8 × 4 MB) or the live sequence visual (`:189-338`).

## Target state (Soll)

- MUST expose all sequences to the director as operations with stable ids (already possible via `operation`; add to [16-show-editor.md](../components/16-show-editor.md) UI).
- SHOULD map sequences to training injects: `door` → `access`, `medical` → `medical`, `beacon` → beacon module, `theft`/`payload` → data objectives.
- SHOULD keep sequence runs deterministic across seek, pause, and export (already true; add a test).
- MAY add per-sequence sound override (currently `hack1`/`hack2` only).

## Edge cases

- Seek backwards mid-sequence: phase and visuals recompute from time (no stale state).
- Sequence started while another runs: new run replaces the panel, timeline extends to the longer end.
- `sequenceScale` changed mid-run: durations change; progress recalculates proportionally.
- `operation` prop referencing an unknown id: ignored with a log entry.

## Acceptance criteria

- [ ] Given `operation` on a director step, the matching sequence starts and `sequence.complete` fires at the end.
- [ ] Given a seek to any time, the active phase matches `sequenceState` at that time.
- [ ] Given `sequenceScale = 4`, `boot` lasts 432 s and all phase boundaries scale.
- [ ] Given actor mode completion, further terminal submits are rejected and `shell.success` is emitted once.
