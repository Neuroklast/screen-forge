# U7 — Accessibility & Devices

> ScreenForge concept set · Usability concept (target state) · Status: [../domain/12-gap-analysis.md](../domain/12-gap-analysis.md)
> Principles: [00-principles.md](00-principles.md).

## Target devices

| Device class | Examples | Primary use | Constraints |
| --- | --- | --- | --- |
| Field tablet | 10–13", touch | Player modules | Sunlight, gloves, motion, battery |
| Control laptop | 13–17" | EXCON, director | Keyboard-heavy, precise |
| HQ workstation | 24–32", multi-monitor | HQ, assessor | Glanceability, many tiles |
| Stage display | TV/projector 1080p+ | Film output | Distance readability, moiré |
| Kiosk | Tablet/laptop locked | Stage, demo | No exit, idle resilience |

## WCAG 2.1 AA baseline

- Contrast: body text ≥ 4.5:1; large/glanceable ≥ 3:1; field primary text target ≥ 7:1 on dark.
- Focus: visible focus ring (≥ 2 px, non-color-only) on every interactive element; logical tab order.
- Keyboard: all functions reachable; drag & drop has a non-pointer path ([04](04-builder-interaction.md)).
- Forms: labels always visible (no placeholder-only), errors programmatically associated.
- Dialogs: focus trap, `Esc` closes non-destructive dialogs, initial focus on first field.
- Motion: `prefers-reduced-motion` honored; no parallax in operational UI; no flashing > 3 Hz.
- Zoom: 200 % without loss of function on control surfaces; 125 % minimum for stage config UI.
- Language: `lang="de"` on the app; English only in code/dev surfaces.
- Screen reader: live regions for clock state changes, inject firing, abort banner (polite; abort assertive).

## Color and contrast policy

- Scene surfaces may be stylistic, but **control chrome** (buttons, labels, linter) follows AA always.
- Color is never the only signal: presence dots pair with text, team colors pair with labels/patterns.
- Dark UI baseline uses the existing tokens; `intranet` (light) theme must pass the same checks.
- EXERCISE watermark: ≥ 3:1 against scene, never overlapping critical controls.

## Touch ergonomics

| Rule | Value |
| --- | --- |
| Minimum target | 44 × 44 px (field/HQ), 32 px desktop-only |
| Spacing | ≥ 8 px between adjacent targets |
| Gestures | Long-press = context/pickup; no swipe-only destructive actions |
| Gloves | Primary actions ≥ 48 px and not in screen corners (case/glove reach) |
| One-hand | Player module primary action within bottom 60 % of portrait screen |
| Feedback | Pressed state + optional haptic; no double-tap requirements |

## Readability on stage

- Stage text: minimum 24 px at 1080p for legible distance content; critical numerals ≥ 48 px.
- Avoid 1 px hairlines and fine grids on stage (moiré); use ≥ 2 px strokes.
- Brightness/contrast configurable per stage profile; test pattern available (`"Testbild"`).
- Fonts: bundled families only (no network fonts); fallback chain documented.

## Kiosk and idle behavior

- Kiosk exit only via PIN; idle screens stay awake (wake lock where supported).
- Auto-reload on version change with a visible countdown ≥ 10 s in non-kiosk, immediate in kiosk.
- Demo kiosk auto-restarts the tour after 90 s idle ([../domain/10-demo.md](../domain/10-demo.md)).

## Performance perception

- Start page interactive < 1 s; builder interactions < 100 ms; map pan ≥ 50 fps.
- Media (images/GLB) load lazily with placeholders; no layout shift on stage.
- Field devices: battery indicator in device tools; GPS updates batched every 5 s (LIVE).

## Localization

- German only in this concept; all strings live in one copy module so future locales do not touch components.
- Dates/times locale-aware (`de-DE`), 24 h clock.
- No text baked into images/SVGs that carries meaning.

## Acceptance criteria

- [ ] Given keyboard only, every builder action (add, bind, reorder, delete, save) is possible.
- [ ] Given `prefers-reduced-motion`, no animation exceeds 0 ms and no content depends on it.
- [ ] Given a field tablet at 200 % zoom, player module tasks remain fully operable.
- [ ] Given the abort banner, it is announced assertively and visible for every role.
- [ ] Given stage output at 1080p, critical numerals remain legible from 3 m (manual check documented).
