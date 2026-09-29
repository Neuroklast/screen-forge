# Catalog — Themes

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Code: `src/components/ThemeEditor.tsx:39-52`, `src/core/config.ts:26-46, :357-376`
> UI component: [components/17-design-controls.md](components/17-design-controls.md)

## Built-in themes (11)

| # | Name | Background | Surface | Text | Secondary | Accent | Mood | Effects | Overlays |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Carbon red | `#000000` | `#0a0a0a` | `#f5f5f5` | `#c8c8c8` | `#e10600` | clinical | 0.35 | flat |
| 2 | Carbon white | `#000000` | `#111111` | `#f2f2f2` | `#bdbdbd` | `#ffffff` | clinical | 0.35 | flat |
| 3 | Phosphor | `#000000` | `#031105` | `#b4ffb4` | `#5a9a5a` | `#7cff7c` | clinical | 0.35 | flat |
| 4 | Blackline | `#080d12` | `#0e171f` | `#d6e2e5` | `#80dce5` | `#f36c75` | clinical | 0.8 | full |
| 5 | Amber phosphor | `#100d05` | `#211a09` | `#f7df9c` | `#c9ab58` | `#ffba42` | clinical | 0.8 | full |
| 6 | Arctic research | `#07141c` | `#102a38` | `#d9f5ff` | `#78cce5` | `#d3efff` | clinical | 0.8 | full |
| 7 | Crimson lockdown | `#130609` | `#290d15` | `#f5cdd6` | `#cf829b` | `#ff3b5d` | tense | 0.8 | full |
| 8 | Ghost terminal | `#050f09` | `#102518` | `#c1f2cf` | `#78b68a` | `#76fa96` | clinical | 0.8 | full |
| 9 | Ultraviolet | `#0d0919` | `#21142e` | `#e9ddff` | `#b39aeb` | `#ee70c1` | clinical | 0.8 | full |
| 10 | Vesper laboratory | `#f4f3f0` | `#e4e3df` | `#151515` | `#62636b` | `#cf233c` | clinical | 0.8 | full |
| 11 | Desert telemetry | `#15120b` | `#282216` | `#e4d7b6` | `#b6a77e` | `#e8b563` | clinical | 0.8 | full |

- Overlay sets: **flat** = scanlines 0.4 / glow 0 / grid 0.22 / grain 0.08 / vignette 0.15 / glitch 0 / chromatic 0; **full** = 0.5 / 0.55 / 0.16 / 0.35 / 0.45 / 0.24 / 0.3 (`ThemeEditor.tsx:83-101`).
- Flat set membership: `Carbon red`, `Carbon white`, `Phosphor` (`:52`).
- All presets use `font: "space"` and no token overrides.

## Fallback palette

`scenePalette(scene)`: corporate (light) = `#f4f3f0 / #e4e3df / #151515 / #62636b`; all other scenes = `#080d12 / #0e171f / #d6e2e5 / #80dce5` (`config.ts:32-46`).

## Custom themes

- Schema: tokens, font (8 ids), name 1–40, palette, accent, mood (`clinical|tense|damaged`), effects 0–1, overlays 0–1 each.
- Storage: localStorage `screenforge.themes.v1`, max 40, dedupe by name; applying writes `config.theme` + all theme fields via `applyTheme`.

## Rules

- Themes MUST pass contrast checks for control chrome on both light and dark surfaces (see [../usability/07-accessibility-devices.md](../usability/07-accessibility-devices.md)).
- Theme choice MUST NOT change scene layout or content — only palette, font, mood, effects, overlays, tokens.
- The corporate scene SHOULD default to `Vesper laboratory`; the network terminal to `Blackline`; theme choice is independent of the company identity applied to the scene.

## Target state (Soll)

- SHOULD ship additional mission-oriented themes (e.g. `Field tablet` high-contrast, `HQ dark`, `Briefing light`) with documented use cases.
- SHOULD validate themes (contrast + token kinds) before saving and flag AA failures.
- SHOULD support theme files in the format family (import/export) and theme references in mission/show packages.
- MAY allow per-station theme overrides in training (e.g. bright field theme on tablets).

## Acceptance criteria

- [ ] Given a theme selection, palette/accent/mood/effects/overlays/font apply in one action.
- [ ] Given a custom theme saved, it survives reload and is selectable.
- [ ] Given the light corporate scene with any theme, text contrast stays ≥ 4.5:1.
- [ ] Given a theme with missing fields in storage, it is dropped without breaking the editor.
