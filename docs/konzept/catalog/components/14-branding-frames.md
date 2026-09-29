# Catalog — Components: Branding & Frames (BrandMark, HudFrame, SceneHeader)

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Code: `src/components/BrandMark.tsx` (207), `HudFrame.tsx` (22) + `hud-frame.css` (69), `src/scenes/Scenes.tsx:29-110`

## BrandMark

- Purpose: renders the identity mark of a system/company on stage; used in SceneHeader, CyberOS topbar, Warhead.
- Precedence: custom logo (`config.brand.logo`, data URL) → selected mark → scene-specific fallback → monogram.
- Marks: `umbrella` (8-segment pinwheel), `hex` (double hexagon + cross), `orbital` (circle + orbit + satellite), `atom` (`AtomEmblem`: circles, blades, ellipses, electrons), `triad` (circle + triangle + dots), `plate` (square + chevrons), `ridge` (M-shape + bar), `default` (corporate checker or monogram).
- Fallback: first two alphanumeric title chars + fixed `SYS / 09` (`:198-206`).
- Exported `AtomEmblem` is reused by the Warhead scene (`Warhead.tsx:6`).
- Hardcoded colors: umbrella petal `#f2f2ed`, atom blades `#111` (by design).
- Soll: mark must render on light and dark palettes with ≥ 3:1 contrast; logo upload limit documented (≤ 180 000 chars WebP data URL, 256 px); no real-world trademarks (principle P1).

## HudFrame

- Purpose: framed panel wrapper for all blocks; provides corner brackets and an optional label.
- Props: `children`, `label?`, `className?`.
- Variants via ancestor `data-frame`: `hud` (border + corners + label), `plate` (2 px border, no corners), `none` (no chrome).
- Soll: optional `status` prop (ok/warn/fail) that tints the frame corners; keyboard-focus style for interactive frames.

## SceneHeader, Wave, Terrain

- `SceneHeader` (`Scenes.tsx:50-69`): brand mark + title/subtitle/identifier + status dot; used by every full scene.
- `Wave` (`:29-49`): deterministic SVG sine driven by scene time and seed; used by Corporate, Tracking, Hologram.
- `Terrain` (`:70-110`): inline SVG map art (no tiles, no network); used by Tracking and OS TraceMap backgrounds.
- Soll: header must degrade gracefully on portrait formats (wrap, no clipping); `Wave`/`Terrain` MUST stay deterministic and offline.

## Acceptance criteria

- [ ] Given a custom logo, it replaces the mark on every scene and survives reload.
- [ ] Given `data-frame="none"`, no border, corners, or label render.
- [ ] Given a portrait stage format, SceneHeader content wraps without overlap.
- [ ] Given any mark on the light corporate palette, contrast is ≥ 3:1.
