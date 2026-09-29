# Formats — Show, Preset, Theme, Profile

> ScreenForge concept set · Data formats · Target state (Soll) · Language: EN, UI labels DE
> Related: [00-format-family.md](00-format-family.md) · [../catalog/components/16-show-editor.md](../catalog/components/16-show-editor.md) · [../catalog/19-themes.md](../catalog/19-themes.md)

## Show (`<slug>.sfshow.json`)

| Field | Type | Notes |
| --- | --- | --- |
| `version` | `1` / `2` | existing schema; v2 target |
| `name` | string | show name |
| `steps` | Step[1..60] | take graph |

Step fields: `id, name, config (film Config), cue, operation?, trigger (time|key|pin|signal), duration, value, next?, onFail?, timeout?`.

- v2 adds: `targets[]` (stage device ids), `rehearsal` flag, optional `missionRef` for training rehearsals.
- Import cap 12 MB; invalid files never modify the current show.
- `operation` MUST be exposed in the editor UI (exists in schema, not in UI today).

## Config preset (`<slug>.sfpreset.json`)

- The existing film `Config` (`version: 1`): scene, title/subtitle/identifier, accent, mood, effects, density, format, workspace, theme, palette, tokens, overlays, mediaIds, pin fields, sound, brand, device, sequenceScale, actor fields.
- `sceneOptions` (target): typed per-scene/block option record (`os`, `terminal`, `corporate`, `countdown`, `tracking`, `analysis`, `lock`, `medical`, `slide`, `clock`, `rotary`, `codeTable`). Flat legacy fields (`device`, `osApp`, `actorMode`, `script`, `commandsUntilSuccess`) migrate into it; defaults keep old files working.
- `workspace` becomes `rehearsal` boolean in the target model ([../domain/09-film-tv.md](../domain/09-film-tv.md)); old files migrate by mapping `training` → `rehearsal: true`.
- Presets ship in `presets/*.json` (samples) and export from the studio.

## Theme (`<slug>.sftheme.json`)

| Field | Type | Notes |
| --- | --- | --- |
| `version` | `1` | new format |
| `name` | string | 1–40 chars |
| `palette` | `{background, surface, text, secondary}` | hex |
| `accent` | hex | `#rrggbb` |
| `mood` | `clinical` / `tense` / `damaged` | |
| `effects` | number 0–1 | |
| `overlays` | 7 fields 0–1 | scanlines, glow, grid, grain, vignette, glitch, chromatic |
| `font` | font id | 8 ids |
| `tokens` | `Record<string,string>` | `--sf-*` overrides |

- Matches the stored custom-theme schema exactly ([../catalog/components/17-design-controls.md](../catalog/components/17-design-controls.md)); import/export SHOULD reuse it.
- Themes MUST pass contrast validation before import (warn on AA failures).

## System profile (`<slug>.sfprofile.json`)

| Field | Type | Notes |
| --- | --- | --- |
| `version` | `1` | new format |
| `name` | string | ≤ 40 chars |
| `config` | film `Config` | full snapshot (existing profile model) |

- Matches the localStorage profile entries (`{name, config}`) so save/load is symmetric.
- Profiles MUST NOT contain runtime state or credentials.

## Shared rules

- All four formats are plain JSON, UTF-8, pretty-printed; no wrapper envelope.
- Import validates with the same schemas used in code; invalid input changes nothing.
- Round-trip MUST preserve unknown fields where the schema permits.
- Sizes: show ≤ 12 MB (current UI), preset/theme/profile ≤ 1 MB.
- No external URLs; media stays referenced by id or package path.

## Acceptance criteria

- [ ] Given a show export, it imports on another machine with identical step graph.
- [ ] Given a theme file with failing contrast, import warns and offers cancel.
- [ ] Given a profile file, save/load reproduces the exact config snapshot.
- [ ] Given a preset with `workspace: "training"`, it migrates to `rehearsal: true`.
