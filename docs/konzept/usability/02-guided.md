# U2 — Guided Mode

> ScreenForge concept set · Usability concept (target state) · Status: [../domain/12-gap-analysis.md](../domain/12-gap-analysis.md)
> Builder (expert): [03-advanced.md](03-advanced.md). Templates: [../domain/07-templates.md](../domain/07-templates.md).

## Purpose

Guided mode lets a first-time user run a complete exercise from a template without understanding the data model. It never hides the escape hatch to expert mode. It corresponds to the **Easy** experience profile ([10-experience-profiles.md](10-experience-profiles.md)).

## Template gallery

```text
Vorlagen                         [Suche…]   Filter: [Training ▾] [Dauer ▾] [Level ▾]
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│ Sprengkörper entschärfen│ │ Search & Rescue      │ │ Datenübernahme        │
│ EOD · 20–30 min · 4 Geräte│ │ SAR · 20–40 min · 5 │ │ 20–30 min · 5 Geräte │
│ [Vorschau] [Wählen]    │ │ [Vorschau] [Wählen]  │ │ [Vorschau] [Wählen]  │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
[Leerer Einsatz bauen]                         [JSON importieren]
```

- Card shows: name, category, duration, device count, difficulty dots, required roles.
- `"Vorschau"` shows briefing, device list, entities, objectives, preview image — read-only.
- Filters: mode, difficulty, duration, roles needed; search matches name + summary.
- `"Leerer Einsatz bauen"` jumps to the expert builder (explicit, not hidden).
- Baseline templates include the airsoft "Relay Recovery", film "Secure Data Transfer" and professional "Distributed Command Incident" ([../scenarios/11-role-sops.md](../scenarios/11-role-sops.md)).

## Wizard steps

| # | Step | Content | Defaults | Skip |
| --- | --- | --- | --- | --- |
| 1 | `"Zweck"` | Gallery + selection | last used filter | no |
| 2 | `"Gelände"` | Map center/zoom, `LIVE`/`PLAYBACK` | template value; offline grid if no tiles | yes (uses template) |
| 3 | `"Geräte"` | Template stations; rename, add, remove; `"Spieler hinzufügen"` | template stations | no (≥1 at end) |
| 4 | `"Entitäten"` | Optional patient/prop add buttons; dossier note | none pre-added beyond template story | yes |
| 5 | `"Ablauf"` | First injects: time + one action; objective names | template injects | yes |
| 6 | `"Prüfen & Start"` | Linter summary, mission name, `"Einsatz anlegen"` | name = template name + date | no |

- Steps are tabs; free navigation back/forward; progress shown as `3/6`.
- Validation is inline and non-blocking until step 6 (`"Weiter"` allowed with warnings, blocked by errors only where needed: step 3 empty).
- Every step shows a persistent `"Im Expertenmodus öffnen"` link; it opens the builder with current input, no data loss.

## Step UX details

- **Gelände:** drag map to center; `"Mein Standort"`; `PLAYBACK` hides GPS-only fields; tiles optional (`"Offline-Raster"` default).
- **Geräte:** station rows with module chip, name field, remove icon; `"Gerät hinzufügen"` opens module picker (grouped field/system); counts shown `"4 Geräte"`.
- **Entitäten:** cards `"Patient hinzufügen"`, `"Sprengkörper hinzufügen"`, `"Bake hinzufügen"`, `"Akte hinzufügen"`; each creates a default and opens a one-line editor; `"Keine Entitäten nötig"` is a valid explicit state.
- **Ablauf:** list of injects as rows (`"bei 03:00 → Patient verschlechtert sich"`); add via 3 presets (`"Zeit"`, `"Zone"`, `"Manuell"`); advanced editing deferred to builder.
- **Prüfen:** shows errors (red), warnings (yellow), infos (gray) with links to the offending step/item; `"Einsatz anlegen"` disabled while errors exist.

## After creation

- Mission opens in the **Devices tab** of Exercise Control with a readiness checklist.
- Success banner: `"Einsatz angelegt — jetzt Geräte verbinden."` with primary `"Gerät verbinden"`.
- Guided users stay in guided depth: builder hidden behind `"Bearbeiten (Experte)"`.

## Running a guided exercise

- Home shows three actions only: `"Übung starten"`, `"Geräte"`, `"Live"`.
- Live tab: inject list with `"Auslösen"` buttons, patient quick panel, abort.
- Debrief: single `"Debrief exportieren"` action + timeline preview.

## Edge cases

- User leaves mid-wizard: draft autosaved; re-entry resumes at the last step with a `"Fortsetzen"` banner.
- Template contains an entity the user deleted: step 4 shows `"Vorlage enthielt Patient — entfernt"` info.
- No server while creating: mission saved locally as draft; provisioning disabled with explanation.
- Very small screen (tablet): wizard becomes a vertical stepper; each step fits one scroll.
- User switches to expert in step 5: all previous input preserved; wizard closes.

## Acceptance criteria

- [ ] Given a first-time user and the SAR template, when all steps are confirmed, then a paused mission exists with a clean linter in ≤ 5 minutes.
- [ ] Given step 3 with 0 stations, then `"Weiter"` is blocked with `"Mindestens ein Gerät erforderlich."`.
- [ ] Given `"Im Expertenmodus öffnen"` in any step, then the builder opens with identical data.
- [ ] Given a closed wizard, when reopened, then the draft resumes at the last step.
