# Catalog — Components: Design Controls (ThemeEditor, TokenEditor, SystemProfiles)

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Code: `src/components/ThemeEditor.tsx` (227), `TokenEditor.tsx` (90), `SystemProfiles.tsx` (329)
> Themes catalog: [../19-themes.md](../19-themes.md) · Companies: [../20-companies-and-brands.md](../20-companies-and-brands.md)

## ThemeEditor

- Purpose: pick one of 11 built-in themes or manage custom themes; edits palette, accent, mood, effects, overlays, font, tokens in one action.
- State: `custom` (localStorage `screenforge.themes.v1`, zod-validated, max 40), `name` (default `"My theme"`), `status`.
- Theme schema: `{ tokens, font (8 ids), name (1–40), palette {background, surface, text, secondary}, accent (#rrggbb), mood, effects, overlays }` (`ThemeEditor.tsx:9-37`).
- Selection applies via `applyTheme` (`config.ts:357-376`); saving snapshots the current config values under the theme name; delete removes a custom theme only.
- Known issues: custom names may duplicate presets (first match wins); palette edits do not update `config.theme` (theme name becomes stale); background is only trimmed, not validated.

## TokenEditor

- Purpose: search and override any of the 433 `--sf-*` design tokens; overrides live in `config.tokens` and are spread as inline CSS variables on the scene canvas.
- Behavior: filter by key + `uses`; 8 tokens per page; value input shows override or default; on blur validates `/^[#a-zA-Z0-9.,% ()+\/-]+$/` plus `CSS.supports` mapped by `kind` (`color→color`, `opacity→opacity`, `font-weight→font-weight`, else `width`); reset clears all overrides.
- Known issue: `type`, `space`, `layout`, `stroke` kinds validate against `width`, so angle tokens (`--sf-layout-90deg`) and negative letter-spacing (`--sf-type-3px`) cannot be re-entered.

## SystemProfiles

- Purpose: apply one of 14 fictional company identities (title/subtitle/identifier/brand) and manage saved system profiles; switch skin (`standard` / `cyberdeck`); upload a custom logo.
- Company selection applies identity only — colors come from the active theme (`SystemProfiles.tsx:189-197`).
- Logo upload: PNG/JPEG/WebP ≤ 8 MB, canvas-downscaled to 256 px, WebP q0.9, data URL ≤ 180 000 chars (`:239-279`).
- Profiles: localStorage `screenforge.systems.v1`, `{name, config}` entries, zod-validated on load, same-name replace, max 24, name ≤ 40 chars (`:146-177, :305-321`).
- Quota failure shows `"Speicher voll. Preset als JSON exportieren."`.

## Target state (Soll)

- MUST fix TokenEditor validation per token kind (angles, negative spacing) and expose a search that also matches values.
- SHOULD make themes and profiles exportable/importable files in the format family ([../../formats/03-show-theme-profile-formats.md](../../formats/03-show-theme-profile-formats.md)).
- SHOULD validate theme contrast (text vs background, accent on surface) before save and warn on AA failures.
- SHOULD allow deleting/renaming custom themes safely (no stale `config.theme` references).

## Edge cases

- localStorage full: custom themes/profiles are not saved; status message explains export as fallback.
- Corrupt stored JSON: entry is dropped silently; editor still works with defaults.
- Logo too large after compression: rejected with the limit message.
- Theme applied on the light corporate scene: palette switches to the theme; scene keeps its layout.

## Acceptance criteria

- [ ] Given a saved custom theme, it appears under `Eigene Themes` after reload.
- [ ] Given an invalid token value, the previous value is restored and an inline error shows.
- [ ] Given a company selection, title/subtitle/identifier/brand change and the scene stays.
- [ ] Given a quota error, the UI states the export fallback.
