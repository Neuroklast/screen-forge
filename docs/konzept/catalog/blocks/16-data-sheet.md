# Catalog — Block: Data Sheet (Datenblatt)

> ScreenForge concept set · Catalog · Target block (Soll, new) · Language: EN, UI labels DE
> Scene id `data-sheet` · Code: `src/scenes/blocks/Instruments.tsx` (`DataSheet`) · Film + training module
> Related: [11-comms.md](11-comms.md) · [../../scenarios/06-eod-disposal.md](../../scenarios/06-eod-disposal.md)

## Purpose

A **hurdle-bound** technical data sheet: the solution document for the active challenge (disarming the countdown device, bypassing a login, overriding an interlock). It is **not handed to the operator**: the sheet must first be **found in an archive** (search → results → open the correct revision, with decoys), then read and **relayed via comms**. Complex and authentic, never a simple label.

## Look & feel

| Rule | Detail |
| --- | --- |
| Squared, dense | 1 px frame, monospace, no rounded corners |
| Archive first | Locked state until the correct revision is opened |
| Authentic | Data lines carry tolerances and cross-references; decoy revisions exist |
| Fictional | Abstract labels only; no real wiring, chemistry or procedure detail |

## Behaviour

| Phase | Result |
| --- | --- |
| Locked | `ARCHIVE LOCKED`; a search field is shown |
| Search | Substring match over archive code, name and body |
| Open | Opening the **correct** revision reveals schematic, data lines and steps; a decoy shows its body only |
| Read | Each step is ticked; the header shows the read state |
| Relay | Enabled once all steps are read; emits `data.relay`, cue `complete` |
| Hint | After a failed search, one hint term is offered |
| Reset | Returns to the locked archive state |

- The operator reads the procedure and relays it to the second player through the comms block — the read-and-report loop.

## Config (`sceneOptions.dataSheet`)

| Option | Meaning |
| --- | --- |
| `subject` | Hurdle the sheet solves: `countdown` / `terminal` / `access` / `custom` |
| `search` | Hint terms offered after a failed search |
| `archive` | Archive entries `{ code, name, body, correct }` — one correct revision, decoys allowed |
| `lines` | Data lines (tolerances, cross-references) |
| `steps` | Ordered procedure steps |
| `relayText` | Prompt shown before relaying |
| `image` | Optional schematic image; empty = inline fictional schematic |

Defaults ship per-subject fictional datasheets (countdown `09-C`, terminal `AUTH-07`, access `ACS-02`).

## Film & training use

- Film: a search-and-read prop; the actor finds the sheet and reads the procedure on camera.
- Training: the reader relays to the operator via comms; completion emits `data.relay` for injects/objectives.

## Target state (Soll)

- MUST require finding the correct revision before the procedure is revealed.
- MUST pair the sheet with a hurdle (subject) and keep content fictional and abstract.
- SHOULD include at least one decoy revision and tolerance/cross-reference data for authenticity.
- MAY add a per-step "relayed" marker and a direct hand-off into the comms block.

## Edge cases

- No matching result: explicit empty state, hint after the first attempt.
- Decoy opened: shows its body and a note that it contains no solution.
- Empty archive/steps: inspector warning; relay stays disabled.
- Reset: locked archive state restored.

## Acceptance criteria

- [ ] Given the locked sheet, searching and opening the correct revision reveals the steps.
- [ ] Given a decoy revision, no steps are revealed.
- [ ] Given all steps read, relaying emits `data.relay` once and sets `complete`.
- [ ] Given the default subject, content is fictional and carries tolerances/cross-references.
