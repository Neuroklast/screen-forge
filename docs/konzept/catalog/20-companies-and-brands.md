# Catalog — Companies & Brands

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Code: `src/components/SystemProfiles.tsx:3-136`, `src/components/BrandMark.tsx` (207), `src/core/config.ts:82-106`
> Related: [components/17-design-controls.md](components/17-design-controls.md) · [19-themes.md](19-themes.md)

## Concept: scene vs. company vs. title

| Concept | Definition | Example |
| --- | --- | --- |
| Scene | Functional surface with a fixed id | `corporate`, `terminal`, `countdown`, `tracking`, `hologram` |
| Company | Fictional identity: title, subtitle, identifier, brand mark | Vesper Research, Blackline Operations, AEON Spatial |
| Title | The in-world brand shown on stage (from the company) | `VESPER`, `BLACKLINE`, `AEON` |

- **VESPER, BLACKLINE, and AEON are companies, not scenes.** Scene ids are technical; catalog files are named functionally ([scenes/](scenes/)).
- Applying a company changes identity fields only; the scene, its layout, and its data stay unchanged.
- Themes are independent of companies: a company never forces colors ([19-themes.md](19-themes.md)).

## The 14 companies

| # | Company | Title | Subtitle | Identifier | Mark |
| --- | --- | --- | --- | --- | --- |
| 1 | Umbrella Corporation | `UMBRELLA` | BIOLOGICAL RESEARCH / FACILITY 07 | UC-07 / FACILITY | `umbrella` |
| 2 | Ashenrai Deck | `ASHENRAI` | NEURAL INTERFACE / ACCESS TIER 04 | AR-04 / DECK | `triad` |
| 3 | Vesper Research | `VESPER` | BIOLOGICAL RESEARCH DIVISION | VS-204 / UNIT 07 | `default` |
| 4 | Blackline Operations | `BLACKLINE` | NETWORK OPERATIONS / LOCAL SESSION | BL-09 / RELAY 07 | `default` |
| 5 | Helix Biotech | `HELIX` | CELLULAR SYSTEMS / RESEARCH DIVISION | HX-12 / LAB 03 | `hex` |
| 6 | Asterion Aerospace | `ASTERION` | ORBITAL SENSOR / FLIGHT OPERATIONS | AS-04 / SENSOR | `orbital` |
| 7 | Meridian Security | `MERIDIAN` | IDENTITY CONTROL / EVIDENCE SYSTEM | MD-18 / GATE | `hex` |
| 8 | AEON Spatial | `AEON` | SPATIAL RECONSTRUCTION LABORATORY | AE-09 / TABLE | `orbital` |
| 9 | Kestrel Cockpit | `KESTREL` | AUTONOMOUS FLIGHT / CONTACT TELEMETRY | KS-02 / HUD | `hex` |
| 10 | Obsidian Sequence | `OBSIDIAN` | SEQUENCE CONTROL / SERIES 09 | OB-09 / CELL | `atom` |
| 11 | Kagetsu Heavy | `KAGETSU` | HEAVY INDUSTRY / ZAIBATSU DIVISION | KG-11 / TOWER | `triad` |
| 12 | Foldsteel Arms | `FOLDSTEEL` | ORDNANCE / CONTRACT MANUFACTURING | FS-08 / YARD | `plate` |
| 13 | Cordon Enforcement | `CORDON` | MUNICIPAL CONTAINMENT / TACTICAL NET | CD-03 / GATE | `ridge` |
| 14 | Ghost Relay | `GHOST` | ISOLATED RELAY / MAINTENANCE CONSOLE | GH-07 / TTY | `default` |

## Brand marks (8)

| Mark | Depiction | Used by |
| --- | --- | --- |
| `umbrella` | 8-segment pinwheel/canopy | Umbrella |
| `hex` | Double hexagon + accent cross | Helix, Meridian, Kestrel |
| `orbital` | Circle + tilted orbit + satellite | Asterion, AEON |
| `atom` | Containment circles, blades, ellipses, electrons | Obsidian; Warhead scene |
| `triad` | Circle + triangle + 3 dots | Ashenrai, Kagetsu |
| `plate` | Square frame + two chevrons | Foldsteel |
| `ridge` | M-shaped ridge + accent bar | Cordon |
| `default` | Corporate checker or monogram (first 2 chars + `SYS / 09`) | Vesper, Blackline, Ghost |

- Custom logo (data URL) takes precedence over any mark; uploaded via SystemProfiles (256 px, WebP q0.9, ≤ 180 000 chars).

## System profiles

- Storage: localStorage `screenforge.systems.v1`, `{name, config}` entries, zod-validated, same-name replace, max 24, name ≤ 40 chars.
- Selection applies `applyIdentity` (title/subtitle/identifier/brand/company) only; skin (`standard` / `cyberdeck`) is a separate global option.

## Rules

- All companies, names, and marks are fictional; NEVER add real brands or logos (principle P1).
- Company data MUST NOT contain operational detail (no real locations, units, or programs).
- A mission or show MAY bind a default company; changing it MUST NOT alter scenes, modules, or mission data.
- Mark rendering MUST pass ≥ 3:1 contrast on both light and dark palettes ([components/14-branding-frames.md](components/14-branding-frames.md)).

## Target state (Soll)

- SHOULD decouple UI scene buttons from brand titles: scene picker uses functional names (`Konzernsystem`, `Netzwerkterminal`, …); titles are branding, not scene identity (current code mixes both — see [23-asset-and-catalog-gaps.md](23-asset-and-catalog-gaps.md)).
- SHOULD extend the company set for training scenarios (e.g. neutral agencies, logistics, media) with the same schema.
- SHOULD allow company assignment per mission/template and per station (multi-company scenarios).
- MAY add company metadata (sector, palette hint) while keeping themes independent.

## Acceptance criteria

- [ ] Given a company selection, only identity fields change; scene, theme, and media stay.
- [ ] Given a custom logo, it overrides the mark and survives reload.
- [ ] Given any mark on both palettes, contrast is ≥ 3:1.
- [ ] Given a mission with a bound company, starting the exercise applies its identity to participating stations.
