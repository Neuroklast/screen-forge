# U0 — Usability Principles

> ScreenForge concept set · Usability concept (target state) · Status: [../domain/12-gap-analysis.md](../domain/12-gap-analysis.md)
> Copy rules: [06-copy-jargon.md](06-copy-jargon.md). Accessibility: [07-accessibility-devices.md](07-accessibility-devices.md).

## Context of use

| Context | Device | Environment | Consequence |
| --- | --- | --- | --- |
| EXCON build/run | Laptop/desktop | Command post, calm | Density allowed; keyboard-first |
| HQ | Desktop/multi-monitor | Command post | Many panels, glanceable, low interaction |
| Player | Tablet | Field, gloves, sun, motion | Large targets, high contrast, few steps |
| Assessor | Laptop/tablet | Side observer | Read-only, note-taking fast |
| Director | Desktop | Set, studio | Precise controls, shortcuts |
| Demo visitor | Any | Trade show, noisy | Self-explanatory in seconds |

## Principles

1. **Touch-first field, keyboard-first control.** Field devices MUST be fully operable by touch; EXCON/HQ MUST be fully operable by keyboard.
2. **Safety above everything.** Abort/pause is reachable in ≤ 2 taps from any training surface; destructive actions confirm.
3. **Optional means visually optional.** Missing patients/props never appear as errors while building — only in the check panel at start.
4. **Guided shows less, advanced shows all.** The same data; depth only changes affordances, never capability to destroy data.
5. **One concept, one word.** UI uses the glossary labels; jargon appears with its plain-language pair on first use.
6. **Deterministic feedback.** Every action gets a visible reaction ≤ 100 ms (optimistic where safe), confirmed within one server tick.
7. **Reversible by default.** Undo covers builder edits; confirmations only for irreversible actions (delete mission, abort, reset).
8. **Offline is a state, not an error.** Disconnected shows what still works and what is queued; no dead screens.
9. **Fiction is always visible.** `EXERCISE` in training, `DEMO — FIKTIV` in demo; never mistakable for real systems.
10. **No dead ends.** Every error state offers a next action (retry, reload, back, contact, continue offline).

## Interaction rules

| Rule | Detail |
| --- | --- |
| Tap targets | ≥ 44 × 44 px on field/HQ; ≥ 32 px desktop-only controls |
| Feedback | Pressed/active states on all buttons; skeleton under 400 ms; spinner only beyond |
| Toasts | Bottom, auto-dismiss 4 s, max 1 at a time, dismissible, never for errors needing action |
| Errors | Inline at the field + summary in the check panel; never only a toast |
| Confirmation | Typed confirm only for mission delete; simple confirm for abort/reset/revoke |
| Empty states | Explain + primary action + example (e.g. `"Noch keine Geräte — Modul aus der Palette ziehen"`) |
| Motion | 150–250 ms, ease-out; respects `prefers-reduced-motion`; no motion on critical alerts |
| Sound | Optional, off by default on field devices; never sole feedback channel |

## Language and jargon

- German UI labels, consistent with [../domain/01-glossary.md](../domain/01-glossary.md).
- First use of domain jargon pairs it: `"Bake (Signalgerät)"`, `"EXCON (Übungsleitung)"` — then short form only.
- Error messages: what happened + why + next step, in that order; no codes without a human sentence.
- Military/tactical terms only where they are the correct jargon (EXCON, Inject, AAR); no decoration.

## Density by role

| Role | Default density | Max panels | Typography |
| --- | --- | --- | --- |
| EXCON | comfortable | 3 columns | 14–16 px body |
| HQ | dense | 4–6 tiles | 13–14 px, glanceable numerals |
| Player | spacious | 1 focus + 1 drawer | 16–20 px, one task per screen |
| Assessor | comfortable | 2 columns | 14 px |
| Director | dense | 3 columns | 13–14 px |
| Demo | spacious | 1 focus | 16–24 px |

## Quality bar

- A new EXCON user completes guided setup without reading docs.
- A player performs any module task in ≤ 3 steps from wake.
- A demo visitor understands the product's purpose within 60 seconds.
- No screen in the product shows raw JSON, internal ids, or English schema terms.
- Every destructive action has an undo or a confirmation, never both missing.

## Acceptance criteria

- [ ] Given any training surface, abort/pause is ≤ 2 taps away and labeled `"Abbruch"` / `"Pause"`.
- [ ] Given `prefers-reduced-motion`, all animations are instant and no content is motion-gated.
- [ ] Given a field tablet in sunlight, primary text contrast ≥ 7:1 on dark surfaces.
- [ ] Given any error toast, the same information exists inline and survives toast dismissal.
