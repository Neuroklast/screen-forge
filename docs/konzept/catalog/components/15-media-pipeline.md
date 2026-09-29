# Catalog — Components: Media Pipeline (MediaManager, IndexedDB, Example Media)

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Code: `src/core/media.ts` (120), `src/core/exampleMedia.ts` (61), `src/components/MediaManager.tsx` (213)

## Storage model

- IndexedDB database `screenforge-media-v1`, version 1, single object store `assets`, `keyPath: "id"` (`media.ts:11-20`).
- Record: `MediaAsset { id, name, folder, type, blob }`; UI adds a transient object URL (`MediaView`).
- API: `listMedia`, `saveMedia`, `deleteMedia`, `seedExampleMedia`, `useMedia` hook; every write dispatches `screenforge:media` and the hook re-reads (`media.ts:36, :87-120`).

## Kinds and limits

| Rule | Value | Code |
| --- | --- | --- |
| Accepted upload types | PNG, JPEG, WebP, GIF, GLB, GLTF | `MediaManager.tsx:92-108` |
| Max upload size | 12 MB per file | same |
| Seed skips | `.mp4` and files > 12 MB | `media.ts:69-86` |
| Page size | 6 assets per page | `MediaManager.tsx:18` |
| Folders | union of `/`, saved, asset folders, current | `:19-21` |
| Folder storage | localStorage `screenforge.folders.v1` | `:13-16` |
| Delete | removes asset and its id from `config.mediaIds` | `:178-188` |
| GLB/GLTF | rendered as `3D` slot, consumed by the analysis-table viewport | `:130-133` |

## Example media

- `exampleMedia.ts` maps 26 bundled files by filename regex (`mediaFolderFor`): employees, scientists, antimatter schematics, documents, surveillance facility/incidents; fallback `/unsorted`.
- `exampleCameraFeeds`: first 3 facility images + first incident image (`exampleMedia.ts:54-60`), consumed by the Camera block.
- Example IDs are `ex-` + sanitized name (≤ 70 chars); sources are `/media<folder>/<name>` (`:48-51`).

## Consumers

| Consumer | Uses | Code |
| --- | --- | --- |
| MediaManager | library UI, upload, folders, `mediaIds` selection | `App.tsx:1005` |
| Camera block | image feeds for channels 2–4 | `Blocks.tsx:143, :162-168` |
| Analysis table | first model asset for the 3D viewport | `LiveScenes.tsx:323-326` |
| Actor terminal visual | slideshow of selected media | `ActorPlayback.tsx:206` |
| Personnel (OS) | example portraits | `CyberOS.tsx` via `useMedia` |
| Dossiers | bundled portrait picker (8 portraits) | `Dossiers.tsx:166-181` |

## Known asset gaps

- `public/media/` (26 files, 80 MB) is untracked and not ignored; `secret data/` duplicates it untracked — fresh clones have no example media (see [../23-asset-and-catalog-gaps.md](../23-asset-and-catalog-gaps.md)).
- `public/media/index.json` exists but is read by no code.
- One incident image exists twice byte-identical.

## Target state (Soll)

- MUST resolve media deterministically: package assets → IndexedDB store → bundled examples → placeholder with a warning.
- SHOULD store media in the package format instead of loose folders ([../../formats/02-package-format.md](../../formats/02-package-format.md)) and keep IndexedDB as the local cache.
- SHOULD add a media linter (missing references, oversized files, duplicate hashes) surfaced in the manager.
- MAY add thumbnails and folder import/export.

## Acceptance criteria

- [ ] Given a mission referencing media by id, missing assets render placeholders and are listed in the linter.
- [ ] Given a 13 MB upload, it is rejected with a clear message.
- [ ] Given media deletion, all `mediaIds` references are removed in the same action.
- [ ] Given a fresh clone without `public/media/`, scenes render placeholders and never crash.
