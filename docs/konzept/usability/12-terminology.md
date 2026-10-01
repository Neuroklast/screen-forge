# U12 — Tactical Terminology System

> ScreenForge concept set · Usability concept · Status: implemented (core + trainer/preparation)
> Related: [11-preparation-ia.md](11-preparation-ia.md) · [06-copy-jargon.md](06-copy-jargon.md) · [../domain/01-glossary.md](../domain/01-glossary.md) · [../domain/12-gap-analysis.md](../domain/12-gap-analysis.md)

ScreenForge speaks differently without becoming a different product. The control
UI resolves tactical/operational labels through a semantic terminology layer that
is independent of scenario logic, business rules and UI density.

## Principles

1. **English is the canonical and default language.** A term always has an
   English default; German is a profile over the same semantic id.
2. **German is not a word-for-word translation.** It uses established
   Bundeswehr-style operational terminology (for example `mission → AUFTRAG`,
   `exercise_control → ÜBUNGSLEITUNG`).
3. **`de-spezkr` is an optional profile** with shorter operational phrasing where
   a public term exists. Where no verified distinction exists it falls back to
   `de-bundeswehr`. Fictional KSK jargon is never invented.
4. **Visible labels are never identifiers or business logic.** The application
   reasons in stable semantic ids (`mission`, `exercise_control`, `nav.assets`).
   Business rules never branch on translated text.
5. **Terminology is independent of scenario/domain logic and of complexity.**
   Switching language, terminology or density never changes scenario or workflow
   state.
6. **Language, terminology profile and UI density are three separate settings.**
   They are deliberately not collapsed into one `tacticalMode` boolean.
7. **Control UI vs fictional in-world content.** The terminology layer applies to
   control chrome only. Fictional in-world stage content (terminal output,
   intranet pages, dossiers, OS surfaces) is art direction and scenario-authored
   text; it is never auto-translated.

## Settings model

| Setting | Values | Default | Persistence |
| --- | --- | --- | --- |
| `language` | `en`, `de` | `en` | `screenforge.locale` (existing i18n store, `?lang=`) |
| `terminology` | `general`, `professional`, `military`, `spezkr` | `professional` | `screenforge.terminology` |
| `density` | `simple`, `operational`, `full` | `operational` | `screenforge.ui-density` |

Profile mapping:

| Language + terminology | Profile |
| --- | --- |
| en + general | `en-general` (plain English) |
| en + professional | `en-professional` (operational English) |
| en + military | `en-military` (NATO / joint short forms) |
| en + spezkr | `en-military` (no distinct public English profile) |
| de + general | `de-general` (plain German) |
| de + professional | `de-professional` (operational German) |
| de + military | `de-bundeswehr` (Bundeswehr terminology) |
| de + spezkr | `de-spezkr` (concise, falls back to `de-bundeswehr`) |

`de-professional` keeps the established operational German chrome so the default
experience is stable; the full Bundeswehr terms appear in the `military`
profile. This matches the profile mapping above and is the intended separation.

## Data model

```ts
type TerminologyProfile =
  | "en-general" | "en-professional" | "en-military"
  | "de-general" | "de-professional" | "de-bundeswehr" | "de-spezkr";

type TacticalTerm = {
  id: string;                     // stable semantic id, never a visible string
  category: TermCategory;         // command | situation | planning | forces |
                                  // communications | reporting | training |
                                  // medical | logistics | status | time |
                                  // location | safety
  profiles: Partial<Record<TerminologyProfile, {
    short: string;
    full: string;
    acronym?: string;
    source?: string;              // required for de-spezkr provenance
  }>>;
  descriptionKey?: string;
};

type TacticalPhrase = { id: string; profiles: Partial<Record<TerminologyProfile, string>> };
```

- Term data lives in [../../../src/i18n/terminology/](../../../src/i18n/terminology/)
  (`terms/*` including `terms/nav.ts`, `phrases.ts`, `registry.ts`) so translated
  strings stay inside the i18n boundary.
- The engine lives in [../../../src/core/terminology/](../../../src/core/terminology/)
  (`types`, `profiles`, `resolve`, `settings`, `build`, `validate`, `nav`,
  `index`) and is framework-free.
- React bindings live in [../../../src/ui/terminology/](../../../src/ui/terminology/)
  (`Term`, `Phrase`, `TerminologyProvider`, `useTerminology`,
  `TerminologySettings`).
- Deviation from the ≤150-line file guideline: the declarative term dictionaries
  (`terms/command.ts`, `terms/training.ts`, `terms/situation.ts`) exceed it because
  they are data tables, not logic; they are grouped by semantic category so a
  reader can still navigate by concern.

## Resolution and fallback

Resolution order (per profile, deduplicated, first non-empty wins):

```text
requested profile
→ parent profile
→ same-language professional
→ same-language general
→ en-professional
→ en-general
→ humanized semantic id
```

- `de-spezkr → de-bundeswehr → de-professional → de-general → en-professional → en-general`.
- Forms: `short` (default), `full`, `acronym`; a missing acronym falls back to
  short, a missing full to short.
- Resolution never returns `undefined` or a raw id. In development a missing
  same-language entry logs one deduplicated warning; production renders the
  fallback safely.
- Acronyms are explicit data (`acronym`), never concatenated in components.
  International abbreviations (`C2`, `COP`, `CCIR`, `SITREP`, `RFI`, `CONOPS`,
  `COA`, `WARNORD`, `OPORD`, `FRAGORD`, `EXCON`, `MEL`, `MSEL`, `STARTEX`,
  `ENDEX`, `AAR`, `SOF`, `AO`, `AOR`, `LKP`, `ETA`, `ETD`, `CASEVAC`, `MEDEVAC`,
  `CCP`, `CBRN`) are kept where appropriate; German acronyms are not invented for
  symmetry.

## UI API

```ts
term("mission");                                       // "MISSION" (en-professional, default)
term("mission", { profile: "de-bundeswehr" });         // "AUFTRAG"
term("mission", { form: "full", profile: "de-bundeswehr" }); // "Auftrag"
term("common_operational_picture", { form: "acronym" }); // "COP"
termPhrase("comms.lastReport", { time: "10:42" });     // "Letzte Meldung 10:42"
```

```tsx
<Term id="mission" />
<Term id="common_operational_picture" form="short" />
<Phrase id="comms.lastReport" params={{ time }} />
```

React components in migrated surfaces MUST NOT hardcode tactical labels. They
resolve labels through the layer.

## Navigation

The fixed six-section preparation information architecture is unchanged:

```text
Overview · Scenario · Participants · Devices · Flow · Review
```

`sectionTermId` maps the stable section ids to navigation term ids
(`nav.overview`, `nav.mission`, `nav.forces`, `nav.assets`, `nav.flow`,
`nav.review`, plus `nav.live`). Terminology changes labels only; no new top-level
preparation item is introduced for a domain entity, implementation concept or
output format.

## Density

Density is independent of terminology and means **more information**, not smaller
fonts. The trainer header renders a summary line when density is not `simple`
(connected devices; inject count and next action at `full`). The per-item
semantics below are the target for the later migration phases (T2–T4):

- `simple`: name + state.
- `operational`: short label + last report.
- `full`: labelled state, task, last report with seconds and comms state.

The existing scene-presentation `config.density` (`focused`/`detailed`) is a
different concern and is not reused.

## Validation and tests

`validateTerminology()` checks duplicate ids, invalid categories/profiles, empty
labels/acronyms, a missing English default, `de-spezkr` entries without a public
`source`, unbalanced phrase braces, missing critical German terms and navigation
mappings to unknown ids.

Tests (all under `src/core/terminology/` and `src/i18n/terminology/`):

- `profiles.test.ts` — chain order, inheritance, settings → profile.
- `resolve.test.ts` — forms, acronyms, fallback, humanization, missing listener.
- `phrases.test.ts` — parameterized phrases, missing params, safe fallback.
- `settings.test.ts` — defaults, independent persistence, invalid stored values.
- `validate.test.ts` — dictionary integrity and required anchors.
- `isolation.test.ts` — settings changes never mutate scenario data.
- `data.test.ts` — profile anchors (`mission`, `common_operational_picture`,
  `exercise_control`) and `de-spezkr` provenance.
- `terminology-keys.test.ts` — every literal semantic id exists.
- `surfaces.test.ts` — migrated surfaces contain no hardcoded tactical labels and
  are wired to the terminology layer.

## Migration status

- **T0 core** — engine, resolver, profiles, settings, dictionary, phrases, UI
  bindings, tests: implemented.
- **T1 surfaces** — trainer header (eyebrow, connection status, clock), the six
  preparation tabs and section headings, the online device status and the review
  block reason, and the terminology settings control: implemented. Remaining
  status copy in those sections still uses the i18n dictionaries.
- **T2–T4** — Flow, live control, events, reports, COP/map, guided mode, AAR and
  the remaining operational UI still use the i18n dictionaries; they migrate in
  later phases through the same API. The six-section IA does not change.

## Acceptance criteria

- [x] English is the default product language.
- [x] German uses Bundeswehr-style terminology in the `military`/`de-bundeswehr`
      profile.
- [x] `de-spezkr` exists and falls back safely to `de-bundeswehr`.
- [x] All terminology is addressed through semantic ids.
- [x] Migrated tactical/professional UI uses the resolver.
- [x] Scenario/workflow behavior does not change with language/profile/density.
- [x] Terminology and UI density are independent.
- [x] Phrase templates work in addition to single-term labels.
- [x] An English default exists for all core terms.
- [x] Missing specialized terminology falls back safely.
- [x] Fictional in-world screens are not auto-translated.
- [x] Tests cover resolution, fallback, persistence and behavior isolation.
- [x] This document explains ids, inheritance, English canonical policy,
      Bundeswehr German policy, `de-spezkr` fallback and the control/in-world
      boundary.
