# U2 — Guided Mode

> ScreenForge concept set · Usability concept (target state) · Status: [../domain/12-gap-analysis.md](../domain/12-gap-analysis.md)
> Builder (expert): [03-advanced.md](03-advanced.md). Engine: [../../plan/18-adaptive-guided.md](../../plan/18-adaptive-guided.md). Templates: [../domain/07-templates.md](../domain/07-templates.md).

## Purpose

Guided mode lets a first-time user run a complete exercise from a template without understanding the data model. It never hides the escape hatch to expert mode. It corresponds to the **Easy** experience profile ([10-experience-profiles.md](10-experience-profiles.md)).

Guided mode is **not a wizard**: it is a constraint-driven scenario interview that incrementally constructs the scenario graph. It asks only questions whose answers change the structure, capabilities, entities, workflow or validation requirements.

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

## Adaptive interview

The interview asks one decision card at a time; a card may bundle closely related choices. Question categories:

| Category | Example | Effect |
| --- | --- | --- |
| Intent | "Was möchtest du simulieren?" (SAR, Medical, Technical, Disposal, Film, Free) | selects the primary domain and the coarse scenario type |
| Initial knowledge | "Ist der Standort bekannt?" | unknown/approximate adds a search phase; exact removes it |
| Discovery | "Welche Informationsquellen stehen zur Verfügung?" | adds beacon/radio/area devices and zones |
| Outcome logic | "Kann das fehlschlagen?" / "Was passiert bei Fehlschlag?" | builds failure, retry, consequence or alternative branches |
| Participants / devices / events | derived from the generated tasks | entities are suggested, never demanded up front |

- Questions appear only while they apply (`appliesWhen`) and are not answered yet; priority budget `blocking > structural > useful > optional` prevents question spam.
- Optional questions stay collapsed behind a toggle.
- Answered questions remain editable; changing an earlier answer triggers reconciliation, never a silent rebuild.
- Domains compose: `primaryDomain` plus `enabledDomains` (e.g. Search & Rescue + Medical) contribute questions and suggestions to the same scenario.
- The interview never exposes internal schema terms (`station`, `inject`, `binding`, `module`); suggestions speak human concepts.

## Live graph and suggestions

- Interview, the **real** workflow graph (`WorkflowCanvas`) and the suggestion list are visible together; no modal-only navigation.
- Every answer that changes workflow logic immediately updates or proposes graph changes; the user can accept, modify or skip each suggestion.
- Each suggestion shows its reason ("Suchphase vorgeschlagen, weil der Standort nicht bekannt ist") and is applied atomically.
- Generated content carries provenance; the user can switch to direct graph editing at any time (`"Im Expertenmodus öffnen"` opens the flow workspace with the same draft).
- Reconciliation distinguishes `generated-unmodified` (may be removed/regenerated), `generated-modified` and `user-created` (never touched). Conflicts ask `[Behalten] [Entfernen] [Details]` instead of deleting silently.

## After creation

- The preparation shell opens on the first incomplete section, or `"Prüfen"` when the draft is complete.
- Success banner: `"Szenario gespeichert."`; provisioning continues in `"Geräte"`.
- The guided surface closes; the shell is the editor.

## Running a guided exercise

- Home shows three actions only: `"Übung starten"`, `"Geräte"`, `"Live"`.
- Live tab: inject list with `"Auslösen"` buttons, patient quick panel, abort.
- Debrief: single `"Debrief exportieren"` action + timeline preview.

## Edge cases

- User leaves mid-interview: draft and session are autosaved in the scenario; re-entry resumes with the next applicable question.
- Template contains an entity the user deleted: the next evaluation reports it as a conflict, never re-creates it silently.
- No server while creating: mission saved locally as draft; provisioning disabled with explanation.
- Very small screen (tablet): interview and graph stack; each panel keeps its primary action visible.
- User switches to expert in any moment: all previous input preserved; guided surface closes.

## Acceptance criteria

- [ ] Given a first-time user and a SAR interview, when the search and patient questions are answered, then a runnable draft with a clean linter exists in ≤ 5 minutes.
- [ ] Given "Standort unbekannt", then a search phase is suggested; given "Standort bekannt", then no search phase is suggested.
- [ ] Given a changed earlier answer, then generated content is reconciled and edited or user-created content is never deleted.
- [ ] Given `"Im Expertenmodus öffnen"`, then the flow workspace opens with identical data.
- [ ] Given a closed interview, when reopened, then the session resumes from the persisted answers.
