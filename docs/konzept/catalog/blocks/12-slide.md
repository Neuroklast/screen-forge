# Catalog — Block: Slide (Latch)

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Code: `src/scenes/blocks/Blocks.tsx:313-402`, `src/scenes/blocks/latchPhysics.ts` (78)
> Used in: Film (block `slide`), Training (module `slide` via `StageFrame`, signal `slide.open`)

## Purpose

The Slide block is a physical latch/rail: the operator drags or keys a handle to full travel and the mechanism seals. It adds a tactile, physics-driven interaction to the block set.

## Component tree

- `HudFrame` labeled `SLIDE` → `TORQUE / VECTOR / LATCH` definition list, two servo bars, latch track with ticks, fill and handle (`role="slider"`), meter, status text (`Blocks.tsx:315-400`).

## Physics

| Parameter | Value | Meaning |
| --- | --- | --- |
| Brake | 0.72 | velocity damping when not driven |
| Spring | 0.18 | spring-back toward 0 when released |
| Snap threshold | 0.98 | progress at which the latch seals |
| Max progress rate | 0.001 / ms | drive speed while held |

- Input: pointer drag on the handle/track, or keyboard `ArrowRight` / `Space` / `Enter` / `End` held (`latchPhysics.ts`).
- On release: coast with brake + spring-back; below the snap threshold the handle returns.
- Sealed: progress ≥ 0.98 → locked, `onCue("complete")`, signal `slide.open`, `onPlay` (`Blocks.tsx:319-321`).

## Config, signals, sounds

- Config: none today.
- Signal: `slide.open`.
- Cue: `complete`.
- Sounds: none (candidate for a mechanical click on seal).

## Target state (Soll)

- SHOULD make snap threshold, drive speed, and spring configurable per step/station.
- SHOULD add a seal sound (`load` or a new mechanical sample) and a distinct sealed state color.
- SHOULD map to training objectives: `slide.open` completes a mechanism objective.
- MUST keep release-to-reset semantics so a partial slide never seals accidentally.

## Rework V2 (Soll)

- MUST support releases: staged unlocking (e.g. two-step release), lever/slider travel with detents, and a visible release state.
- SHOULD animate the mechanism (bolt travel, seal break) and play a seal sound.
- MUST be configurable via `sceneOptions.slide` (stages, labels, snap threshold, sounds).

## Edge cases

- Keyboard hold interrupted by focus loss: drive stops, physics continue (coast/spring-back).
- Drag beyond the track: progress clamps to 0–1.
- Paused scene: physics freeze (time-based).
- Sealed then reset: state clears to 0 with no animation glitch.

## Acceptance criteria

- [ ] Given a full drag to the end, the latch seals once and emits `slide.open`.
- [ ] Given a release at 0.5 progress, the handle returns toward 0 without sealing.
- [ ] Given keyboard-only input, the same completion is reachable.
- [ ] Given a paused scene, no progress advances while keys are held.
