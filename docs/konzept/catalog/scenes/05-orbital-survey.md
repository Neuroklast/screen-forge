# Catalog — Orbital Tracking (Orbital Survey)

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Scene id `tracking` · Default in-world title `ORBITAL SURVEY` (company: Asterion Aerospace)
> Code: `src/scenes/shared/LiveScenes.tsx:462-648`, `shared/spatial.ts:21-37`
> Used in: Film (scene `tracking`). Training uses a Leaflet map (`src/training/TacticalMap.tsx`) instead — see [../components/18-training-controls.md](../components/18-training-controls.md)

## Purpose

The orbital tracking scene is the fictional sensor station (default title `ORBITAL SURVEY`): a stylized map with autonomous contact tracking, confidence readouts, and gesture control. It is the film counterpart of the training tactical map and the reference for "sensor feed" content on stage.

## Tracking state machine

| Phase | Condition | Reticle lag | Notes |
| --- | --- | --- | --- |
| `SEARCH` | t < 0.6 s | 0.8 s | scan sweep visible |
| `ACQUIRING` | t < 1.6 s | 0.3 s | confidence ramps |
| `CORRELATING` | t < 2.4 s | 0.3 s | trail stabilizes |
| `TRACK LOCK` | t ≥ 2.4 s | 0.045 s | confidence → 99.8 % with jitter |

- `Next contact` cycles targets 0–2 and restarts the epoch (`LiveScenes.tsx:602-612`).
- `Hold sensor` freezes the track at time `t`, emits `track.lock`, and restarts the epoch (`:613-629`).
- `Reacquire` resets the epoch and resumes (`:630-639`).

## Component tree

| Area | Elements | Code |
| --- | --- | --- |
| Header | `SceneHeader` tag `AUTONOMOUS SENSOR / <phase>` | `:492` |
| Map | `GestureSurface` → SVG: `Terrain`, scan line, 45-sample history trail, 3 contact diamonds, auto-reticle with corner brackets + confidence | `:494-550` |
| Corner readouts | map coordinates, scale | `:553-566, :597-600` |
| HUD panel | `TRACK 0n`, phase, speed, heading, confidence, easting, northing, residual, `Wave` | `:567-596` |
| Actions | `Next contact`, `Hold sensor` / `Resume tracking`, `Reacquire` | `:601-640` |
| Footer | scene label | `:642-645` |

## Data, config, gestures

- Data: deterministic `trackPoint` / `trackTelemetry` trigonometry from scene time and seed (`spatial.ts:21-37`); no external data, no sounds.
- Config: `title`, `subtitle`, `identifier`, `brand`; `cue` unused today.
- Gestures: pan, pinch zoom (0.5–3×), rotate, wheel zoom via `GestureSurface` (clamps ±450/±300 px).

## Target state (Soll)

- MUST stay fully deterministic and offline (no tiles, no network) — the training map handles real geography separately.
- SHOULD support mission data in training stage mode: contacts and zones from mission entities, redacted per role.
- SHOULD emit `track.lock` with the contact id as value for director/training triggers.
- MAY offer a "sensor degraded" state driven by `cue === "warning"` (confidence floor, glitch overlay).

## Edge cases

- Contact switch mid-lock: epoch restarts, trail clears, no stale confidence.
- Hold while searching: lock applies at the current phase; resume continues the phase clock.
- Gesture transform after hold: map transform persists; hold state does not reset it.
- Reset: epoch, contact index, and transform reset.

## Acceptance criteria

- [ ] Given scene start, the phase sequence reaches `TRACK LOCK` within 2.4 s and confidence ≥ 99 %.
- [ ] Given `Hold sensor`, tracking freezes and `track.lock` is emitted exactly once.
- [ ] Given `Next contact`, the HUD switches to the next contact and the trail restarts.
- [ ] Given pinch/rotate gestures, the transform stays within the defined clamps.
