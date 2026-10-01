# Contract — Terminology

## Purpose

One semantic dictionary resolves every visible control label. No hardcoded migrated terminology, no second label table.

## Owner

- Framework-free resolution: `src/core/terminology/` (`term()`, `termPhrase()`).
- React bindings: `src/ui/terminology/` (`Term`, `Phrase`, `TerminologyProvider`, `useTerminology`).
- Dictionaries: `src/i18n/de.ts`, `src/i18n/en.ts`, `src/i18n/terminology/`.
- id → label mapping for domain ids: `src/core/labels.ts` (`labelFor`).

Product concept: [../konzept/usability/12-terminology.md](../konzept/usability/12-terminology.md).

## Rules

- Visible control chrome resolves through the terminology layer or `t()`; never a raw literal in a component.
- English is the canonical language for code and schema; German is resolved through profiles. Element content (scenes, blocks, field consoles) is English; the studio/training control chrome is German.
- The boundary is enforced in the resolver, not per component: `t()` always resolves English for the in-world namespaces `scene.*`, `terminal.*`, `field.*`, `ordnance.*`, `beacon.*`, `camera.*` and non-preset `device.*`, so a locale switch can never translate a scene name or a device console. `device.preset.*` is trainer chrome and stays translated (`src/i18n/index.ts`).
- `t()` never falls back to another language; a missing key is a bug, not a silent English fallback.
- Literal `t("key")` keys must exist in both dictionaries (`src/i18n/keys.test.ts`), and dictionaries must have parity (`src/i18n/i18n.test.ts`).
- Scene/module ids are functional (`intranet`, `terminal`, `countdown`); brand names are identities, never scene names.

## Allowed dependencies

- Components import `t` and the terminology bindings.
- `src/core/labels.ts` maps domain ids to label keys.

## Forbidden dependencies

- Hardcoded German strings outside `src/i18n/**` (`scripts/check-i18n.mjs`).
- A second label map inside a feature component.
- Rendering a raw enum id or raw JSON to the user.

## Extension points

- Add a semantic id to `src/i18n/terminology/**`; add profile labels, not a hardcoded string.
- Add a domain label via `labelFor(domain, id)` with keys in both dictionaries.

## Known exceptions

- Scenario-authored content (ordnance designations, dossier text, stage/failure copy) stays as authored and is not auto-translated.
- The i18n gate is allowlist-driven; the allowlist only shrinks.

## Migration notes

- When migrating a surface, replace hardcoded labels with semantic ids in the same change and remove the file from the i18n allowlist.
