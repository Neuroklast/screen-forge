# Catalog — Block: Code Table (Codetabelle)

> ScreenForge concept set · Catalog · Target block (Soll, new) · Language: EN, UI labels DE
> Scene id `code-table` (new) · Code: new `src/scenes/blocks/CodeTable.tsx` · Film block first, training module later
> Related: [11-comms.md](11-comms.md) · [08-terminal.md](../scenes/08-terminal.md)

## Purpose

A translation surface: a table maps symbols to letters/numbers (cipher, Morse, grid). The operator decodes a received message and relays the result — e.g. via the comms block. It turns decoding into a visible, checkable task with a clear end.

## Component tree (target)

- `HudFrame` `CODE TABLE` → table grid (configurable rows/columns), received cipher strip, input field for the decoded text, submit, status line, hint row.

## Behaviour

| Step | Result |
| --- | --- |
| Read | Cipher message shown as symbols/digits, one group at a time |
| Decode | Operator maps symbols via the table into letters |
| Submit | Correct text → `code.solved`, cue `complete`; wrong text → error, retry |
| Hint | After two failed attempts, highlight the next mapping |
| Reset | Clears input and attempts |

- The table is fictional and configurable; no real crypto claims.
- Input is case-insensitive and ignores spaces by default.

## Config (`sceneOptions.codeTable`)

| Option | Meaning |
| --- | --- |
| `alphabet` | mapping pairs (symbol ↔ character) |
| `message` | the plaintext to decode (rendered as symbols) |
| `groupSize` | characters per group |
| `hints` | allow hints after N attempts |
| `relayLabel` | text shown when solved (e.g. `"Bereit für Funkmeldung"`) |

## Film & training use

- Film: decoding sequences, briefing tasks, combined with the comms block.
- Training: later as a module for message handling; emits `code.solved` for injects/objectives.

## Target state (Soll)

- MUST be solved by matching the table — no free-text guessing shortcuts.
- MUST validate input deterministically and stay fictional.
- MUST stay squared and dense; the table uses monospace cells.
- SHOULD integrate with comms: solved text can be sent as a canned message.

## Edge cases

- Empty message: block shows an inspector warning, not a broken table.
- Duplicate symbols in the alphabet: inspector error.
- Solved then edited: input locks after success until reset.
- Very long message: groups scroll, table stays fixed.

## Acceptance criteria

- [ ] Given the correct decoded text, the block emits `code.solved` once and shows the relay label.
- [ ] Given a wrong text, an error appears and the input stays editable.
- [ ] Given two failures and hints enabled, the next mapping is highlighted.
- [ ] Given reset, input and attempts clear and the cipher message is re-shown.
