# Catalog — Block: Camera (Optics)

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Code: `src/scenes/blocks/Blocks.tsx:142-198`, `src/core/exampleMedia.ts:54-60`
> Used in: Film (block `camera`). Training uses the WebRTC publisher `src/training/CameraFeed.tsx` instead

## Purpose

The Camera block is a four-channel optical array: one live webcam channel plus three still/image feeds. It simulates a surveillance console on stage without any recording or streaming infrastructure.

## Component tree

- `HudFrame` labeled `OPTICS` → 4 tiles in a grid (`Blocks.tsx:145-196`).
- `CAM 01`: always a `<video>` from `getUserMedia({video:true})` with a `LIVE` label (`:148-157`).
- `CAM 02-04`: first `config.mediaIds` assets, then bundled `exampleCameraFeeds` (3 facility night images + 1 incident still), sliced to four tiles (`:162-168`).
- Each tile: channel label, fake timecode (unless live), selected state.

## Behavior

| Action | Result | Code |
| --- | --- | --- |
| Tile click | selects tile (`on` class), `click` sound, signal `camera.select` | `:178-184` |
| Webcam permission denied | tile shows no signal; no crash | `:148-157` |
| No media configured | bundled example feeds fill the tiles | `:162-168` |
| Training | not used; `CameraFeed` publishes WebRTC to HQ and supports EXCON cut | `src/training/CameraFeed.tsx` |

## Config and signals

- Config: `mediaIds` (image sources for channels 2–4).
- Signal: `camera.select` (tile id).
- Cues: none.
- Assets: bundled example feeds from `public/media/surveillance/*` (untracked today — see [../23-asset-and-catalog-gaps.md](../23-asset-and-catalog-gaps.md)).

## Target state (Soll)

- SHOULD offer an explicit offline/static state per tile (`"KEIN SIGNAL"`) for director use and for EXCON camera cuts.
- SHOULD accept package media (see [../../formats/02-package-format.md](../../formats/02-package-format.md)) and resolve missing files to a placeholder, never a broken image.
- MAY allow per-tile assignment in the show editor (currently implicit by order).
- MUST stay local: no recording, no external streams, no network calls.

## Edge cases

- Camera in use by another app: webcam tile shows no signal; other tiles unaffected.
- Media deleted while scene runs: tile falls back to the next available source or placeholder.
- HTTPS/secure context missing: `getUserMedia` unavailable; tile explains the requirement (training publisher already does).
- Reset: selection clears; live tile restarts.

## Acceptance criteria

- [ ] Given webcam permission, `CAM 01` shows a live feed with `LIVE` label.
- [ ] Given at least three media assets, channels 2–4 show them in order.
- [ ] Given no permission and no media, all tiles show defined empty states without errors.
- [ ] Given a tile click, exactly one `camera.select` signal is emitted.
