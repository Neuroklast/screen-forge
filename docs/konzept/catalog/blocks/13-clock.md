# Catalog — Block: Clock (Uhr)

> ScreenForge concept set · Catalog · Target block (Soll, new) · Language: EN, UI labels DE
> Scene id `clock` (new) · Code: new `src/scenes/blocks/Clock.tsx` · Film block first, training module later
> Related: [07-lock.md](07-lock.md) · [../scenes/04-sequence-control.md](../scenes/04-sequence-control.md)

## Purpose

A time display element for stage and training surfaces: mission clock, wall clock, multiple zones, countdown/count-up, and a schedule strip. It gives scenes a believable "time is passing" surface and supports scenario timelines.

## Display modes

| Mode | Content |
| --- | --- |
| `mission` | Mission/exercise time (`T+`), ticking, freeze with the scene clock |
| `wall` | Time of day, date, weekday (fictional locale) |
| `zones` | Up to 4 time zones with labels |
| `countdown` | Target time, remaining time, progress rail |
| `schedule` | Timeline strip with events at `T+` offsets |

## Component tree (target)

- `HudFrame` `CLOCK` → mode header, main display (large digits), secondary row (date/zone), optional schedule strip, footer status.
- Analog option: minimal square face with hour/minute/second hands (SVG, no rounded chrome).

## Behaviour

- Driven by the scene clock; freeze on pause; seek-safe.
- Countdown mode emits a cue at 50 %, 25 % and 10 % remaining; at zero it sets `complete`.
- Schedule mode highlights the current and next event; past events dim.
- All digits use the existing digit fonts; monospace alignment is mandatory.

## Config (`sceneOptions.clock`)

| Option | Meaning |
| --- | --- |
| `mode` | `mission` / `wall` / `zones` / `countdown` / `schedule` |
| `zones` | labels for zone mode |
| `target` | countdown target in seconds |
| `schedule` | list of `{ at, label }` entries |
| `analog` | show the square analog face |
| `label` | header label override |

## Film & training use

- Film: stage clock, briefing timelines, countdown to a cue.
- Training: later as a module for time checks (e.g. report times); emits `clock.reached` at schedule entries.

## Target state (Soll)

- MUST be deterministic and freeze with the scene clock.
- MUST stay squared and dense (no rounded faces, no soft shadows).
- SHOULD support at least one analog face and one zone row.
- MAY emit signals at schedule entries for director/training triggers.

## Edge cases

- Target in the past: countdown clamps to zero and shows `"ABGELAUFEN"`.
- Empty schedule: strip hidden, no empty frame.
- Very long zone labels: truncate with ellipsis.
- Reduced motion: no sweeping second hand.

## Acceptance criteria

- [ ] Given mission mode, the display ticks with the scene clock and freezes on pause.
- [ ] Given countdown mode, cue thresholds fire at 50/25/10 % and completion at zero.
- [ ] Given schedule mode, the current event is highlighted and the next event is readable.
- [ ] Given any mode, the block renders squared and monospace-aligned.
