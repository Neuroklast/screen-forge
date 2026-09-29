# Formats — Format Family

> ScreenForge concept set · Data formats · Target state (Soll) · Language: EN, UI labels DE
> Related: [../domain/11-data-model.md](../domain/11-data-model.md) · [01-mission-format.md](01-mission-format.md)

## Formats at a glance

| Format | File | Content | Version | Status |
| --- | --- | --- | --- | --- |
| Mission | `<slug>.sfmission.json` | Training scenario (stations, entities, injects, map) | 2 (1 migrated) | target |
| Package | `<slug>.sfpack` | Mission + media + dossiers + preview + manifest | 1 | target |
| Show | `<slug>.sfshow.json` | Film take graph + embedded configs | 2 (1 read) | target |
| Config preset | `<slug>.sfpreset.json` | Film look (scene, theme, media, overlays) | 1 | exists (`presets/*.json`) |
| Theme | `<slug>.sftheme.json` | Palette, accent, mood, effects, overlays, tokens, font | 1 | target |
| System profile | `<slug>.sfprofile.json` | Company identity + full config snapshot | 1 | target |
| Dossier | embedded | Personnel file inside a mission or package | 2 | exists in mission v1 |

## Envelope policy

- Keep each format **schema-native**: the root object carries `version` (as today) — no extra wrapper for plain JSON files.
- Packages use a `manifest.json` as the single source of truth for versions, hashes, and contents ([02-package-format.md](02-package-format.md)).
- Every format MUST be validatable without the app (documented fields + JSON schema export).

## Naming and content types

| Rule | Value |
| --- | --- |
| File names | lowercase slug, `[a-z0-9-]+`, no spaces |
| Extensions | `.sfmission.json`, `.sfshow.json`, `.sfpreset.json`, `.sftheme.json`, `.sfprofile.json`, `.sfpack` |
| Media inside packages | original extension (`.png`, `.jpg`, `.webp`, `.gif`, `.glb`, `.gltf`) |
| Encoding | UTF-8, LF; JSON pretty-printed with 2 spaces on export |
| Hash | SHA-256 per file and per package in the manifest |

## Versioning policy

- Each format versions independently; a package may combine different versions.
- Readers MUST accept all versions listed as "read" and reject higher majors with a clear message.
- Breaking changes bump the major; additive fields bump the minor (stored as `version` + optional `minor`).
- Deprecated formats stay readable for one major cycle, then move to `docs/konzept/archive/` with a banner.

## Validation pipeline

1. Parse JSON (size cap per format).
2. Validate against schema (zod in code, JSON schema in docs).
3. Cross-validate references (stations ↔ entities ↔ injects).
4. Resolve assets (package → IndexedDB → bundled → placeholder).
5. Lint (severity list from [../domain/04-mission-builder.md](../domain/04-mission-builder.md)).

- Validation is **all-or-nothing** for imports: no partially applied files.
- Unknown fields are ignored with a warning, never silently dropped on re-export (round-trip keeps them where the schema allows).

## Size caps

| Format | Cap | Reason |
| --- | --- | --- |
| Plain mission/show JSON | 10 MB (server), 12 MB (import UI) | matches current limits |
| Single-file mission with embedded media | 25 MB | base64 overhead |
| Package `.sfpack` | 500 MB | media-heavy scenarios |
| Single media file | 12 MB | current upload limit |
| Dossier photo | ≤ 300 000 chars inline | schema cap |

## Acceptance criteria

- [ ] Given any exported file, it validates against its documented schema.
- [ ] Given an unknown field, import succeeds and a warning is shown.
- [ ] Given a higher major version, import fails with a clear message.
- [ ] Given a package, its manifest hashes match all contained files.
