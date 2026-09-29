# 03 — Modes & Entry

> ScreenForge concept set · Target state (Soll) · Status: [12-gap-analysis.md](12-gap-analysis.md)
> Terms: [01-glossary.md](01-glossary.md). Start-page UX: [../usability/01-start-page.md](../usability/01-start-page.md).

## Modes

| Mode | UI label | Controller | Runs | Content unit | Runtime |
| --- | --- | --- | --- | --- | --- |
| `film` | `"Film & TV"` | `director` | locally (browser) | show/take over scenes | scene clock, cues |
| `training` | `"Training"` | `excon` | LAN server | mission + injects | exercise clock, server tick |
| `demo` | `"Demo"` | `presenter` | locally, offline | seeded mission + show | demo tour driver |

- A mode is a **product surface**, not a data source. `LIVE`/`PLAYBACK` is a mission property usable in any mode.
- Film and training share scenes, modules, theming, and stage rendering; training adds server, roles, and entities.
- Demo is a sandbox: same engine, no auth, no persistence, reset on demand.

## Depth levels (orthogonal)

| Level | Film | Training | Demo |
| --- | --- | --- | --- |
| `guided` (`"Geführt"`) | Show templates, preset scenes | Template wizard | Guided tour (default) |
| `advanced` (`"Experte"`) | Sequence editor, tokens, media | Mission builder, injects, bindings | Sandbox with full builder |

- Depth is a per-mode UI setting, persisted per user/device.
- Switching depth NEVER discards data; advanced edits are visible in guided as read-only summaries.
- Guided MUST expose an escape hatch: `"Im Expertenmodus bearbeiten"`.

## Entry routes

| Route | Shows | Notes |
| --- | --- | --- |
| `/` (no params) | Start page | New default; replaces today's direct-to-studio behavior |
| `/?mode=film\|training\|demo` | Mode home | Start page selection result |
| `/?role=director\|excon\|safety\|assessor\|hq\|player\|technician\|presenter` | Role view | Deep link; bypasses start page; shows connection banner |
| `/?role=trainer` | `excon` (alias) | Backward compatible alias for existing links |
| `/?role=element` | `player` (alias) | Backward compatible alias |
| `/?room=<id>&station=<id>#invite=<token>` | Assignment → field device | QR provisioning flow |
| `/?kiosk=1` | Kiosk stage | Film output locked by PIN |
| `/?demo=1` | Demo hub | Offline showcase; no server calls |

- `/` without params MUST render the start page, never auto-start the studio.
- Kiosk, invite, and role deep links MUST keep working without visiting the start page.

## Start page structure (summary)

1. **Header:** product mark, language (DE), version, connection status (`Offline` / `Server erreichbar`).
2. **Mode cards:** `Film & TV`, `Training`, `Demo` — one line each, primary action.
3. **Resume:** last session per mode (studio config, mission draft, demo stop) with timestamp.
4. **Role shortcuts:** `"Gerät verbinden"` (invite code/QR), `"Übungsleitung"`, `"HQ"`.
5. **Depth toggle:** `Geführt` / `Experte`, default `Geführt` for new users.
6. **Footer:** fictional-content notice, licenses, repo link.

## Mode selection flows (concept)

- **Training (guided):** start page → Training → template gallery → wizard → mission created (paused) → devices tab.
- **Training (advanced):** start page → Training → `"Einsatz bauen"` → empty builder → assemble → check → save.
- **Film:** start page → Film & TV → studio (guided: show templates; advanced: sequence editor).
- **Demo:** start page → Demo → tour starts immediately; `"Sandbox"` enters the builder with seeded content.

## Feature availability by mode

| Feature | film | training | demo |
| --- | --- | --- | --- |
| Scenes/blocks + themes + media | yes | yes (briefings, in-world systems) | yes |
| Show/take graph | yes | rehearsal only | yes (seeded) |
| Mission builder | no | yes | sandbox yes |
| Server, invites, roles | no | yes | no |
| Patients/props/entities | props as scene content | yes | yes (seeded) |
| GPS/live tracking | no (playback only) | yes (LIVE) | playback only |
| Kiosk lock | yes | yes (HQ/stage) | yes |
| EXERCISE watermark | optional | MUST | `"DEMO — FIKTIV"` |

## Edge cases

- Start page opened while a server session exists: show `"Übung läuft — zurückkehren"` as primary action.
- Role deep link without server: show offline screen with retry, not the start page.
- Demo opened with server available: demo MUST NOT connect to it (no accidental live data).
- Unknown mode param: fall back to start page with a notice, never guess.
- Deep links from old versions (`?role=film`): map to `director`.

## Acceptance criteria

- [ ] Given no params, when `/` is opened, then the start page renders in < 1 s with three mode cards.
- [ ] Given a trainer QR link, when opened on a tablet, then the assignment flow starts without passing the start page.
- [ ] Given depth switched from advanced to guided, then all advanced data is still present when switching back.
- [ ] Given `?mode=demo` on a machine with a running server, then no exercise WebSocket connection is opened.
