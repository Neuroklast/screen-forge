# 10 — Demo Mode

> ScreenForge concept set · Target state (Soll) · Status: [12-gap-analysis.md](12-gap-analysis.md)
> Film runtime: [09-film-tv.md](09-film-tv.md). Start page: [../usability/01-start-page.md](../usability/01-start-page.md).

## Purpose

Demo mode showcases ScreenForge in 5 minutes without setup: trade shows, onboarding, sales, internal reviews. It MUST work fully offline, without server, accounts, or provisioning.

## Entry

- Start page → `"Demo"` → tour begins immediately.
- Deep link `/?demo=1` (and `?mode=demo`) skips the start page.
- Demo NEVER connects to an exercise server, even if one is reachable.

## Content (seeded)

| Stop | Shows | Content |
| --- | --- | --- |
| 1 | Film surfaces | One show with 3 takes (e.g. `"Activate Locator Beacon"`) |
| 2 | Exercise build | `eod-disposal` mission opened in the builder (sandbox) |
| 3 | Field device | Ordnance console + terminal task, simulated locally |
| 4 | HQ view | Map, patient, camera placeholder, objectives |
| 5 | Injects | Manual inject demonstration (timer, message, tamper) |
| 6 | Debrief | Log + timeline of the demo run |
| 7 | Sandbox | Free play: switch template, edit, reset |

- All content is bundled with the app; no downloads, no network.
- A seeded mini-mission runs with a local, in-browser simulation (same rules engine, no WebSocket).

## Guided tour

- Overlay with step text (DE), `"Weiter"` / `"Zurück"` / `"Tour beenden"`, progress dots.
- Each stop MAY auto-advance after an action (e.g. entering the code) with a short delay.
- `presenter` can jump to any stop; `visitor` follows.
- Tour stops are defined in a bundled JSON, not hardcoded in components.

## Sandbox rules

- Visitors MAY edit the demo mission; edits live in memory + localStorage only.
- `"Demo zurücksetzen"` restores the seeded state in one action; no confirmation needed.
- Sandbox exposes the full builder (advanced depth) but hides server/provisioning actions with an explanation: `"Im Demo-Modus nicht verfügbar."`
- Demo MUST NOT write to `.exercise-data/` or open WebSockets.

## Watermark and framing

- Persistent watermark `"DEMO — FIKTIV"` on all demo surfaces.
- Fictional-content notice on the start page and in the footer.
- No real logos, persons, or classified-looking identifiers; all names are invented.

## Kiosk behavior

- `?demo=1&kiosk=1` locks the tour: no exit, no editing, auto-restart tour after 90 s idle.
- Kiosk exit requires the presenter PIN (local default, configurable in demo settings).
- Idle restart keeps the screen alive for trade shows.

## Presenter controls

| Control | Action |
| --- | --- |
| `"Tour starten/beenden"` | Enter/leave guided overlay |
| Stop list | Jump to stop |
| `"Nächster Inject"` | Fire the prepared manual inject |
| `"Demo zurücksetzen"` | Restore seed |
| `"Sandbox öffnen"` | Free-play builder |

## Edge cases

- WebGL/media failure on demo hardware: tour skips affected stop with a notice instead of breaking.
- Reduced-motion OS setting: tour transitions become instant; all stops remain reachable.
- Demo on touch-only device: all controls ≥ 44 px; no hover-only affordances.
- Long-running kiosk: memory stable over 24 h; tour restart clears in-memory edits.
- Visitor edits a seeded mission and leaves: nothing persists beyond the device.

## Acceptance criteria

- [ ] Given a machine with no network, when Demo starts, then all 7 stops work end-to-end.
- [ ] Given `?demo=1` with a running server, then no `/exercise` WebSocket is opened.
- [ ] Given kiosk demo idle for 90 s, then the tour restarts at stop 1.
- [ ] Given sandbox edits, when reset is pressed, then seeded content is restored exactly.
