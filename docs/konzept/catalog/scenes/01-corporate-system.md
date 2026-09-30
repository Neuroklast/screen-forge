# Catalog — Intranet (Firmenportal)

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Scene id `intranet` (formerly `corporate`) · Default in-world title `VESPER` (company: Vesper Research) · Code: `src/scenes/shared/LiveScenes.tsx:12-318`, `src/scenes/corporate.css`
> Used in: Film (scene `intranet`), Training (via `StageFrame`, module `intranet`, signal `identity.confirmed`)

## Naming (concept clarification)

- A **scene** is a surface with a function: here the light corporate system for institutional/facility stories.
- A **company** is an identity (title, subtitle, identifier, brand mark) applied via SystemProfiles — 14 exist, including Vesper Research, Blackline Operations, and AEON Spatial.
- `VESPER` is the scene's default in-world title and simultaneously the brand of Vesper Research; it is NOT the scene's name. Scenes are named functionally in this catalog (`intranet`, `terminal`, `countdown`, `tracking`, `hologram`); companies are cataloged in [../20-companies-and-brands.md](../20-companies-and-brands.md).

## Purpose

The intranet scene is the light "company intranet" surface: a believable institutional workspace for research-facility stories. It carries the light reference design (black type frames, red accents) and is the primary face of a fictional megacorp on set.

## Component tree

| Area | Elements | Code |
| --- | --- | --- |
| Header | `SceneHeader`: brand mark, title, subtitle, identifier, status dot | `LiveScenes.tsx:56-65` |
| Left nav | 4 tabs: `Overview`, `Personnel`, `Archive`, `Diagnostics`; hold-to-scan fingerprint gate (`HOLD TO SCAN` → `IDENTITY VERIFIED`) | `LiveScenes.tsx` |
| Main | facility heading (`Changed` animation), `ShieldCheck` | `:95-112` |
| Overview | 3 metrics (status/sessions/integrity), environmental `Wave`, live temperature, access-control panel, `ProcessReadout`, activity log | `:120-240` |
| Personnel/Archive | search input, directory list, `ProcessReadout`, verified record `<dl>`, `Close record` | `:242-306` |
| Footer | internal label, session time | `:312-315` |

## Interactions

| Element | Behavior | Code |
| --- | --- | --- |
| Nav tabs | switch view; clears record/query/process | `:70-83` |
| Fingerprint seal | hold 1.5 s to verify identity; Personnel/Archive records stay locked (`LOCKED ↗`) until verified | `LiveScenes.tsx` |
| `Review access` | runs `"ACCESS POLICY AUDIT"`, 9 s / 3 phases; outcome depends on `cue === "warning"` | `:41-53, :180-203` |
| `Run diagnostics` | runs `"SYSTEM SELF-TEST"`, 12 s / 4 phases; report `D-204` | `:184-199` |
| `Acknowledge exception` | visible only when process done and cue `warning`; resets cue to idle | `:204-214` |
| Search input | filters local personnel/archive arrays; hidden while a record is open (prevents the record being clipped) | `LiveScenes.tsx` |
| Record buttons | `openRecord` → `"RECORD RETRIEVAL"`, 6 s / 3 phases; disabled until the fingerprint is verified | `LiveScenes.tsx` |
| `Close record` | clears record + process | `:295-303` |

## Data, config, signals

- Config: `title`, `subtitle`, `identifier`, `brand`, `seed` (Wave), `cue`, mood/theme via canvas.
- Data: deterministic in-file `personnel`/`archive` arrays (`:18-27`); no media, no sounds.
- Signals: none emitted in film; in training the module-event button reports `identity.confirmed` (`ElementView.tsx:103-122`).
- Cues: `warning` recolors tags/metrics/audit result; `acknowledge` returns to `idle`.
- Process engine: `useProcess` extends the timeline (`Process.tsx:25-43`); `Changed` blurs/pops values (`Process.tsx:44-66`).

## Target state (Soll)

- MUST keep the light corporate identity independent of the active theme's dark defaults (theme `Vesper laboratory` is the reference).
- MUST expose the three audit/diagnostic/retrieval processes as director-triggerable operations (`operation` prop) in film mode.
- SHOULD surface the same three processes as module tasks in training with signals (`identity.confirmed` plus `analysis.complete` for the self-test).
- SHOULD decouple scene title from company: the default title `VESPER` comes from the company identity; a mission/show MAY apply any of the 14 companies to this scene.
- Personnel/archive content SHOULD come from mission dossiers in training (released only), replacing the hardcoded arrays.

## Rework V2 (Soll)

- MUST present a windowed, OS-like surface: Personnel, Archive and Diagnostics open as windows with squared chrome, subtle open/close animations and synthetic sounds.
- MUST stay dense and squared — no rounded corners, no modern UI look.
- SHOULD reuse the shared OS chrome and photo rules from [02-operating-system.md](02-operating-system.md) (uncropped photos with theme overlay).
- SHOULD be configurable via `sceneOptions.intranet` (start app, density, sounds).

## Edge cases

- Record opened while a process runs: current process is replaced; timeline extension recalculated.
- `cue` changes mid-audit: result flips between clean and exception; no crash (tested pattern).
- Search with no matches: empty list, no error state defined yet — Soll adds an explicit empty state.
- Very long facility names: heading wraps, `Changed` animation must not clip.

## Acceptance criteria

- [ ] Given film mode, `Review access` completes in 9 s and shows the warning-dependent result.
- [ ] Given training mode with released dossiers, the personnel tab shows only released persons.
- [ ] Given the EXERCISE watermark is enabled, it is visible on every intranet view.
- [ ] Given the fingerprint has not been scanned, records show `LOCKED` and cannot be opened.
- [ ] Given a company identity applied, title/subtitle/identifier/mark change without changing the scene.
