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

Capability-driven since the preparation refactor ([11-preparation-ia.md](11-preparation-ia.md)); the type decides which blocks appear ([../domain/15-scenario-capabilities.md](../domain/15-scenario-capabilities.md)).

| # | Step | Content | Defaults | Skip |
| --- | --- | --- | --- | --- |
| 1 | `"Zweck"` | Scenario type, template library, mission name | last used type | no |
| 2 | `"Teilnehmer"` | Capability-driven people blocks: `"Teilnehmer hinzufügen"`, `"Team hinzufügen"`, `"Darsteller hinzufügen"`, `"Patient hinzufügen"` | none | yes |
| 3 | `"Geräte"` | Human device presets; ordnance/beacon consoles provision their prop, medical devices provision a patient | none | no (≥1 at end) |
| 4 | `"Ablauf"` | Optional simple starter flow (`Start → Meldung → Ende`) | none | yes |
| 5 | `"Prüfen"` | Linter summary, mission name, `"Szenario anlegen"` | name from type/template | no |

- Steps are tabs; free navigation back/forward; progress shown as `3/5`.
- Validation is inline and non-blocking until step 5 (`"Weiter"` allowed with warnings, blocked by errors only where needed: step 3 empty).
- Every step shows a persistent `"Im Expertenmodus öffnen"` link; it opens the expert canvas with current input, no data loss.
- The wizard never asks for modules, station roles, bindings, ids or inject structures; `"Spieler hinzufügen"` is forbidden copy.

## Step UX details

- **Zweck:** type buttons (`"Sprengkörper entschärfen"`, `"Medizin"`, `"Film"`, `"Feldübung"`, `"Frei"`) plus the full template library; selecting a type resets the draft to that type's capabilities, selecting a template loads it into the draft.
- **Teilnehmer:** only the blocks the type enables; adding people creates default entities that stay editable later.
- **Geräte:** preset picker (`"Feldgerät (GPS)"`, `"Funkgerät"`, `"Medizingerät"`, `"Kamera"`, `"Terminal"`, `"Sprengkörper-Konsole"`, `"Bake"`, …) and a rename list; the capability matrix hides impossible presets (no medical device without patients, no ordnance console without props).
- **Ablauf:** one optional starter flow; events and deeper logic are authored later in the `"Ablauf"` section.
- **Prüfen:** shows errors (red), warnings (yellow), infos (gray) with links to the offending section; `"Szenario anlegen"` is blocked only by schema errors.

## After creation

- The preparation shell opens on `"Geräte"` with a readiness checklist in `"Prüfen"`.
- Success banner: `"Szenario gespeichert."`; provisioning continues in `"Geräte"`.
- The wizard closes; the shell is the editor.

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
