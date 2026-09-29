# Catalog — Block: Data Sheet (Datenblatt)

> ScreenForge concept set · Catalog · Target block (Soll, new) · Language: EN, UI labels DE
> Scene id `data-sheet` · Code: `src/scenes/blocks/Instruments.tsx` (`DataSheet`) · Film block first, training module later
> Related: [11-comms.md](11-comms.md) · [../../scenarios/06-eod-disposal.md](../../scenarios/06-eod-disposal.md)

## Purpose

A technical data sheet for a fictional ordnance device: schematic plus key data and an ordered disposal procedure. The operator reads the sheet, ticks each step, and **relays the procedure to the other person via comms**. This creates a read-and-report loop between two players.

## Look & feel

| Rule | Detail |
| --- | --- |
| Squared | 1 px frame, no rounded corners |
| Dense | Monospace data lines, compact step list |
| Schematic | Media image if configured, otherwise an inline fictional schematic (never a broken image) |
| Fictional | Labels are abstract; no real wiring, chemistry or procedure detail |

## Component tree

- `HudFrame` `DATA SHEET` → header (title + read state), two columns:
  - left: schematic figure (`sceneOptions.dataSheet.image` or inline SVG),
  - right: data lines (`lines`) and ordered steps (`steps`) with checkboxes.
- Footer: relay text (`relayText`) + `RELAY VIA COMMS` button.

## Behaviour

| Step | Result |
| --- | --- |
| Read | Data lines and steps are visible; checkboxes start unchecked |
| Tick | Each step can be marked read; the header shows the read state |
| Relay | Enabled once all steps are read; emits `data.relay`, cue `complete`, `load` sound |
| Reset | Scene reset clears the read marks |

- The schematic never grows the frame: fixed aspect, `object-fit: contain` for images.
- The step list is capped and scroll-free (layout contracts, [../../usability/09-layout-contracts.md](../../usability/09-layout-contracts.md)).

## Config (`sceneOptions.dataSheet`)

| Option | Meaning |
| --- | --- |
| `title` | Header title |
| `image` | Optional media URL (packaged asset); empty = inline schematic |
| `lines` | Key data lines |
| `steps` | Ordered disposal steps |
| `relayText` | Prompt shown before relaying |

Defaults ship a fictional `Containment-Baugruppe / Series 09` sheet with five data lines and four steps.

## Film & training use

- Film: a readable prop in EOD scenes; the actor ticks steps and reads the procedure aloud.
- Training: pairs with the comms block so the reader relays to the operator; completion emits `data.relay` for injects/objectives (module support in a later increment).

## Target state (Soll)

- MUST show a schematic (image or inline) and the ordered steps without any real ordnance detail.
- MUST require all steps read before relaying.
- SHOULD pair with the comms block (the relay text becomes a canned message).
- MAY add a per-step "relayed" marker for two-player exercises.

## Edge cases

- Missing image: inline schematic renders; no broken image, no layout shift.
- Empty steps: inspector warning; the relay button stays disabled.
- Very long lines: truncated with ellipsis, never wrapping the frame.
- Reset: all read marks clear.

## Acceptance criteria

- [ ] Given the default sheet, the schematic and steps render squared and dense.
- [ ] Given not all steps are read, the relay button is disabled.
- [ ] Given all steps read, relaying emits `data.relay` once and sets `complete`.
- [ ] Given a missing image, the inline schematic renders without layout shift.
