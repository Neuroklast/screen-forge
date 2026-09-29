# Catalog — Block: Comms (Radio)

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Code: `src/scenes/blocks/Blocks.tsx:199-312`, `src/scenes/blocks/useMicWaveform.ts` (60)
> Used in: Film (block `comms`), Training (module `comms` via `StageFrame`, signals `comms.channel` / `comms.ptt`)

## Purpose

The Comms block is a fictional radio console: channel list, live microphone waveform, push-to-talk, and link telemetry. It is the audio-facing counterpart of the visual scenes and a training realism element (comms discipline).

## Component tree

| Panel | Contents | Code |
| --- | --- | --- |
| `CHANNELS` | 4 channels: `GATE 148.220`, `OPS 151.940`, `RELAY 164.075`, `MED 155.340` | `Blocks.tsx:210-247` |
| `WAVEFORM` | frequency, TX/RX/STBY state, live mic SVG, 16-segment VU, PTT button | `:249-283` |
| `LINK` | carrier/noise/mod readouts, rolling event log, mic status | `:285-310` |

## Behavior

| Action | Result | Code |
| --- | --- | --- |
| Channel click | selects channel, `click` sound, signal `comms.channel` | `:239-247` |
| PTT hold | opens `getUserMedia({audio})`, `prompt` sound, TX state, signal `comms.ptt` | `:278-283` |
| PTT release | stops TX; RX when ambient level > 0.08 | `:264-276` |
| Mic denied | waveform empty, status explains the requirement; block stays usable | `useMicWaveform.ts` |

- Audio analysis: `AnalyserNode`, `fftSize 256`, `smoothingTimeConstant 0.72`; RMS level + 64 bins drive the SVG waveform and VU (`useMicWaveform.ts`).
- Noise floor display: `-98 + level * 36 dBm` (fictional scale).

## Config, signals, sounds

- Config: `identifier` (footer/labels).
- Signals: `comms.channel`, `comms.ptt` (training forwards these; see `training.ts:30-35`).
- Sounds: `click`, `prompt`.
- No recording, no transmission: the block only visualizes local microphone input.

## Target state (Soll)

- MUST use clearly fictional channel identifiers; the current numeric frequencies SHOULD become fictional band labels or non-realistic values (principle P1, no real frequencies).
- SHOULD integrate EXCON messages: channel list becomes selectable for mission comms, received messages appear in the `LINK` log (see [../../control/03-comms-and-notifications.md](../../control/03-comms-and-notifications.md)).
- SHOULD emit structured message events (`comms.message`) for training injects.
- MAY add canned messages (e.g. `"SPOTREP"`, `"STATUS"`) as mission content.

## Edge cases

- Two PTT presses: only one TX session; second ignored.
- Channel switched during TX: TX continues, channel label updates, event logged.
- Frozen exercise clock: PTT still allowed locally but no server events forwarded (training blocks module events while frozen).
- No microphone: waveform flat, PTT shows `"MIKROFON FEHLT"`.

## Acceptance criteria

- [ ] Given PTT hold, TX state shows and `comms.ptt` is emitted once per press.
- [ ] Given a channel click, exactly one `comms.channel` signal with the channel id is emitted.
- [ ] Given microphone permission, the waveform reacts to input within 100 ms.
- [ ] Given microphone denial, the block remains usable with a clear status message.
