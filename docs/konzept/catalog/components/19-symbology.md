# Components — Symbology

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Related: [../usability/10-experience-profiles.md](../usability/10-experience-profiles.md) · [../scenarios/11-role-sops.md](../scenarios/11-role-sops.md)

## Purpose

One semantic symbol model, rendered per profile and standard version. No symbol SVGs are scattered
through components, and no controlled standard assets are redistributed.

## Pipeline

```text
Domain entity
   ↓
Symbol semantic descriptor (affiliation, status, dimension, type, modifiers)
   ↓
SymbologyProvider (profile + standardVersion)
   ↓
Screen symbol
```

## Provider shape

```text
SymbologyProvider
  profile: "simple" | "mil2525" | "authorized-app6"
  standardVersion
  symbolCode
  affiliation
  status
  dimension
  modifiers
```

- `simple` = plain text + pictograms (Easy).
- `mil2525` = simplified tactical shapes (Advanced).
- `authorized-app6` = standard-profile rendering, only where an organisation supplies its own
  authorised assets.
- The provider is version-pinned so a 2026 mission does not silently change appearance later.

## Rules

- Symbols are derived from semantic state, never from color alone.
- No affiliation/insignia of real units; all entities stay fictional.
- Controlled APP-6/MIL-STD-2525 asset sets are NOT bundled; professional customers MAY load their own
  authorised set.

## Acceptance criteria

- [ ] Given the same entity, switching profile changes the rendering, not the state.
- [ ] Given a pinned `standardVersion`, a library update does not change an old mission.
- [ ] Given a status, it is readable without color (text/icon modifier).
