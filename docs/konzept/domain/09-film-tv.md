# 09 — Film & TV

> ScreenForge concept set · Target state (Soll) · Status: [12-gap-analysis.md](12-gap-analysis.md)
> Terms: [01-glossary.md](01-glossary.md). Demo reuses this mode: [10-demo.md](10-demo.md).

## Purpose

Film & TV mode produces believable screen surfaces on set: scenes, blocks, shows/takes, stage output, media, themes. No server, no accounts, deterministic playback.

## Building blocks

| Concept | German | Definition |
| --- | --- | --- |
| Scene | `"Szene"` | Full-screen fictional system (corporate system, operating system, terminal, countdown, orbital tracking, analysis table); in-world titles come from the applied company identity |
| Block | `"Baustein"` | Partial surface (medical, camera, comms, access, lock, slide, clock, rotary, code table, data sheet) |
| Show | `"Ablauf"` | Ordered take graph for a production sequence |
| Take | `"Take"` | One step in a show: config + cue + trigger + next/onFail |
| Cue | `"Regiezustand"` | Scene mood: Ruhe / Aktion / Warnung / Abschluss |
| Stage | `"Bühne"` | Output-only rendering, optionally locked (kiosk) |

## Director surfaces

- **Regie (monitor):** scene selection, live preview, cues, transport (play/pause/reset), timeline, output control.
- **Ablaufeditor:** show graph, drag & drop node ordering, per-step trigger `time|key|pin|signal`, duration, value, next/onFail/timeout.
- **Konfiguration:** content, systems/brands, design, themes, effects, playback, media, tokens.
- **Presets:** JSON export/import (validated, versioned); last state persists locally.

## Show & take semantics

- A show is a linear graph with branches on failure (`onFail`), optional `timeout` (rehearsal only).
- Triggers: `time` (scene clock), `key` (keyboard/actor input), `pin` (code pad), `signal` (module event in rehearsal).
- Take log records `ok|fail|timeout` events for rehearsal; export as JSON.
- In film mode, timeout fields are hidden; in rehearsal (training workspace) they are enabled.

## Stage targets (target)

Today every device plays independently; the target adds deliberate routing:

| Capability | Rule |
| --- | --- |
| Push scene to a device | Director selects scene + target device(s); device switches without reload |
| Push config/theme | Same as scene; look travels with the push |
| Multi-device sync | Optional `"Synchron"` toggle: cue/take changes apply to all target devices within 250 ms |
| Independent devices | Default off-sync: each device keeps its own scene until pushed |
| Output inventory | Stage page lists online outputs with name, resolution, last seen, kiosk state |
| Rehearsal mode | Take log + timeouts on; stage unaffected |

- Pushing MUST NOT require reload; fallback is a reload prompt if the device is on an older version.
- A device MAY be pinned to one scene (kiosk) so pushes to `"alle"` skip it unless forced.

## Kiosk and output-only

- `"Bühne starten"`: fullscreen output, editor hidden.
- Kiosk (`?kiosk=1`): stage locked; exit only via `instructorPin`.
- Return button appears on hover/focus; touch devices keep it faintly visible.
- EXERCISE watermark optional per workspace; in film it defaults off, in rehearsal on.

## Media, themes, brands

- Media: local IndexedDB store (images, GIFs, GLB/GLTF); referenced by id in config; imported files never leave the device.
- Themes: 11 built-in + custom; design tokens (80+) editable; brand marks per system profile.
- Media and themes are shared with training (briefing slides, in-world systems).

## Actor interaction

- Actor terminal: scripted typing, key triggers, PIN entries — lets a performer drive the scene believably.
- `"Vorbereitetes Tippen"` on/off; commands-until-success; scripted command text.
- Actors are optional; a show MUST be runnable by the director alone.

## Rehearsal vs. production

| Aspect | Production | Rehearsal |
| --- | --- | --- |
| Timeouts | hidden | enabled |
| Take log | optional | on |
| Failure branches | manual | manual + timeout |
| EXERCISE mark | off | recommended |
| Cue reset on take change | yes | yes |

- Rehearsal MUST be reachable from the film workspace without switching modes; it is a flag, not a mode.

## Edge cases

- Push to offline device: queued as pending; applied on reconnect within one state sync.
- Two directors (two browser tabs): last write wins per push; take counter is per tab (documented limitation).
- Scene switch during running take: take stops, cue resets, log notes interruption.
- Media missing (IndexedDB cleared): scene renders placeholder + notice, never crashes.
- Kiosk PIN lost: server-independent; reload clears kiosk lock only with the PIN, otherwise device restart is required (documented).

## Acceptance criteria

- [ ] Given two stage devices and `"Synchron"`, when the director changes take, then both devices switch within 250 ms.
- [ ] Given a pinned kiosk device, when pushing to `"alle"`, then the kiosk device is skipped unless forced.
- [ ] Given rehearsal off, then timeout fields are hidden and take log is optional.
- [ ] Given a show export, when imported on another machine, then media ids resolve or show placeholders with a notice.
