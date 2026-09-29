# Formats — Package (.sfpack)

> ScreenForge concept set · Data formats · Target state (Soll) · Language: EN, UI labels DE
> Related: [00-format-family.md](00-format-family.md) · [01-mission-format.md](01-mission-format.md) · [../catalog/components/15-media-pipeline.md](../catalog/components/15-media-pipeline.md)

## Purpose

A `.sfpack` is a ZIP archive that carries everything a scenario needs to run on another machine: mission, media, dossier portraits, preview, and licenses. It is the transport format for complete training scenarios and demo content.

## Layout

```text
<slug>.sfpack (ZIP)
├── manifest.json
├── mission.sfmission.json
├── preview.png                  (optional, ≤ 1 MB)
├── media/
│   ├── images/…                 (png, jpg, webp, gif ≤ 12 MB each)
│   └── models/…                 (glb, gltf ≤ 12 MB each)
├── dossiers/
│   └── portraits/…              (jpg/webp ≤ 480 px)
└── licenses/
    └── …                        (text files for bundled assets)
```

## Manifest

| Field | Type | Notes |
| --- | --- | --- |
| `format` | `"screenforge.pack"` | literal |
| `version` | `1` | pack version |
| `app` | string | app version that wrote the pack |
| `created` | ISO 8601 | timestamp |
| `mission` | `{ path, version, id, name }` | mission reference |
| `files` | `{ path, bytes, sha256, kind }[]` | every contained file |
| `packageSha256` | string | hash over sorted file hashes |
| `licenses` | `{ path, scope }[]` | asset license mapping |
| `preview` | string? | path to preview image |

- Hashes MUST be verified on import; mismatches abort the import.
- Unknown manifest fields are preserved on re-export.

## Single-file variant

- `.sfmission.json` MAY embed media as `media[]` entries: `{ id, kind, name, dataUrl }`.
- Cap: 25 MB total file size; each embedded item ≤ 4 MB.
- Use for small exchanges (one model, a few portraits); use `.sfpack` for anything larger.

## Asset resolution order

1. Package contents (by path, then by id).
2. Local IndexedDB media store (`screenforge-media-v1`).
3. Bundled example media (`public/media`, if present).
4. Placeholder + linter warning (never a broken reference).

## Import rules

| Rule | Detail |
| --- | --- |
| Size cap | 500 MB per pack |
| ZIP safety | reject absolute paths and `..` (zip-slip); no symlinks; no executables |
| Type validation | media types whitelisted (images, GIF, GLB/GLTF); anything else is rejected |
| Atomicity | extract to a temp dir, validate, then move into the media store; no partial imports |
| Duplicates | identical hash → reuse existing asset; name conflicts → suffix |
| Offline | no network access during import or export |

## Export rules

- Export writes a fresh ZIP with deterministic ordering (paths sorted) so hashes are reproducible.
- The mission in the pack is the current draft state; unreleased dossiers are included (they are mission data, not runtime state).
- Runtime state, logs, and credentials are NEVER included.

## Target state (Soll)

- Implement pack read/write in the app (builder import/export) and in the server template library.
- Add a pack preview step in the import UI (mission summary, asset list, size, licenses).
- Add a `pack` linter (missing licenses, oversized files, unreferenced assets).

## Acceptance criteria

- [ ] Given a pack with a tampered file, import fails with a hash error and changes nothing.
- [ ] Given a pack with a `../` path entry, import is rejected before extraction.
- [ ] Given a pack, its mission renders with all referenced media from the pack, even offline.
- [ ] Given a re-export of an imported pack, hashes are reproducible.
