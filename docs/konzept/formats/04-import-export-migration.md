# Formats — Import, Export & Migration

> ScreenForge concept set · Data formats · Target state (Soll) · Language: EN, UI labels DE
> Related: [00-format-family.md](00-format-family.md) · [01-mission-format.md](01-mission-format.md) · [../domain/11-data-model.md](../domain/11-data-model.md)

## Import pipeline

| Step | Rule | Failure behavior |
| --- | --- | --- |
| 1 Size check | per format caps ([00-format-family.md](00-format-family.md)) | reject before reading |
| 2 Parse | JSON only, UTF-8 | error message with line if possible |
| 3 Schema | version-aware validation | all-or-nothing, nothing applied |
| 4 Migrate | v1 → v2 if needed ([migration](#migration-rules)) | migration errors are explicit, never silent |
| 5 Cross-validate | ids, bindings, inject targets | reference errors block import |
| 6 Assets | resolve package → store → bundled → placeholder | missing assets warn, import continues |
| 7 Lint | severity list | errors block start, not import |
| 8 Preview | summary: name, stations, entities, injects, assets, size | user confirms `Ersetzen` / `Als Kopie` / `Abbrechen` |

- Import never overwrites a running exercise: while `running`, import is disabled with `"Übung läuft"`.
- Revision conflict on save: `Neu laden` or `Als Kopie speichern`, never silent merge.

## Migration rules

| From → To | Mapping | Notes |
| --- | --- | --- |
| Mission v1 → v2 | `scene` → `module`; `entityId` → `bindings.patient`; `rules` → `injects`; add empty `props`, `teams`, `actors` | lossless for all v1 fields |
| Show v1 → v2 | keep `version: 1` readable; v2 adds `targets`, `rehearsal`, `missionRef` | no rewrite needed |
| Config v1 → rehearsal | `workspace: "training"` → `rehearsal: true`; drop `workspace` | apply on load |
| Theme/Profile v1 | first release; no migration | — |

- Unknown fields MUST be preserved on round-trip where the schema allows; otherwise they are ignored with a warning.
- Migration MUST be idempotent: migrating twice yields the same result.
- Deprecated formats stay readable for one major cycle, then move to `docs/konzept/archive/` with a banner ([../domain/12-gap-analysis.md](../domain/12-gap-analysis.md)).

## Export rules

| Format | Default name | Content |
| --- | --- | --- |
| Mission (single) | `<slug>.sfmission.json` | current draft, media embedded only if selected |
| Package | `<slug>.sfpack` | mission + assets + manifest ([02-package-format.md](02-package-format.md)) |
| Show | `<slug>.sfshow.json` | steps + embedded configs |
| Preset | `<slug>.sfpreset.json` | current film look |
| Theme | `<slug>.sftheme.json` | current theme values |
| Profile | `<slug>.sfprofile.json` | company identity + config snapshot |

- Export is deterministic: stable key order, sorted arrays by id, LF, 2-space indent.
- Runtime state, logs, credentials, and presence are NEVER exported.
- Export works offline; no telemetry.

## Error format

```text
Import fehlgeschlagen: <Datei>.
<Grund in einem Satz>. <Nächster Schritt>.
Details: <Pfad> — <Feld> erwartet <Typ>, gefunden <Wert>.
```

- Errors are shown inline in the import dialog, with a collapsible `Details` section.
- Partial imports are impossible by design; a failed import leaves the current state untouched.

## Security rules

- ZIP safety: reject absolute paths, `..`, symlinks, executables ([02-package-format.md](02-package-format.md)).
- Media whitelist: png, jpg, webp, gif, glb, gltf only.
- No code execution, no scripts, no external URLs, no network during import/export.
- Size caps enforced before allocation where possible.

## Target state (Soll)

- Implement the pipeline once and reuse it for builder, wizard, server template library, and demo seeding.
- Add a migration report (what was changed) shown after import.
- Add export presets (`Nur Mission`, `Mit Medien`, `Vollständiges Paket`) in the builder.
- Add a JSON schema export so external tools can validate files.

## Acceptance criteria

- [ ] Given a v1 mission, import migrates and reports the mapping.
- [ ] Given a failed validation, the current mission/show/config is unchanged.
- [ ] Given a package import with missing assets, the mission loads with placeholders and warnings.
- [ ] Given a running exercise, import/export of the active mission is blocked with a clear reason.
