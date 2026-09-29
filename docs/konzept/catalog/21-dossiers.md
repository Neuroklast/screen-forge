# Catalog — Personnel Files (Dossiers)

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Code: `src/training/Dossiers.tsx` (229), `src/core/training.ts:55-77`, `src/core/dossiers.ts` (legacy), `src/core/exampleMedia.ts`
> Related: [components/15-media-pipeline.md](components/15-media-pipeline.md)

## Purpose

Personnel files ("Akten") are the in-world identity documents of an exercise: briefings for role players, intelligence for HQ, and release-gated information for players. They are also film props (personnel registries in the network terminal).

## Schema (training)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Stable, unique per mission |
| `name` | string | Display name |
| `role` | string | Job/function (e.g. `"Research Director"`) |
| `photo` | string | Data URL (JPEG/PNG/WebP) or `/media/...` path; ≤ 300 000 chars |
| `notes` | string | Free text (briefing, background) |
| `events` | string[] | Timeline entries, one per line in the editor |
| `released` | boolean | Visibility gate: unreleased dossiers never leave the server to players/HQ |
| `blood`, `allergies`, `clearance`, `status`, `facility` | string | Editor fields rendered as record details |

- Limit: 40 dossiers per mission (`training.ts:143`).
- Projection: only `released` dossiers are included in non-EXCON payloads (`training.ts:471`).

## Photo pipeline

| Step | Rule | Code |
| --- | --- | --- |
| Input | PNG/JPEG/WebP, ≤ 10 MB | `Dossiers.tsx:56-70` |
| Processing | canvas downscale to max 480 px, JPEG q0.78, data URL | same |
| Storage | inline in the mission (schema cap 300 000 chars) | `training.ts:55-77` |
| Bundled portraits | picker with 8 example portraits (`/media/portraits/...`) | `Dossiers.tsx:166-181` |
| Missing file | portrait falls back to initials/monogram placeholder | Soll |

## Template archetypes (target)

| Archetype | Purpose | Suggested fields | Portrait |
| --- | --- | --- | --- |
| Operator | Player-side identity (own team) | name, role, clearance, notes | employee portrait |
| Scientist/Technician | Facility staff, witness of events | role, facility, status, events | scientist portrait |
| Executive/Management | Decision maker, HQ counterpart | clearance, notes, events | employee portrait |
| Witness/Civilian | Role-player character | name, notes, events | neutral placeholder |
| Adversary | Opposing team (fictional) | role, status, events | silhouette placeholder |
| Unknown person | Casualty/unidentified | minimal fields, photo optional | placeholder |

- Templates SHOULD be selectable in the dossier editor and in mission packages ([../formats/02-package-format.md](../formats/02-package-format.md)).
- Each template MUST be editable; no field is forced beyond `name`.

## Legacy film dossiers

- `src/core/dossiers.ts`: film-era schema (`id, name, role, blood, allergies, clearance, status, facility, notes, events, photo`) with `defaultDossiers()` (Mara Vale, Elias Ward, N. Mercer) and localStorage helpers.
- `loadDossiers`/`saveDossiers` are unused; only `defaultDossiers` is consumed by the wizard. Soll: remove or repurpose as the template source ([23-asset-and-catalog-gaps.md](23-asset-and-catalog-gaps.md)).

## Rules

- Dossiers MUST stay fictional; no real persons, employers, or addresses.
- Unreleased dossiers MUST NOT appear in any player/HQ payload, log, or UI hint.
- Photos MUST be embedded or resolved from the package; external URLs are forbidden (offline principle).

## Acceptance criteria

- [ ] Given an unreleased dossier, no player or HQ payload contains it.
- [ ] Given a 10 MB photo, it is compressed to ≤ 300 000 chars and rendered correctly.
- [ ] Given a dossier template, all fields are editable and the name is the only required field.
- [ ] Given a missing portrait file, the UI shows a placeholder without layout shift.
