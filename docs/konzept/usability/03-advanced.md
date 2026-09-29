# U3 — Advanced (Expert) Mode

> ScreenForge concept set · Usability concept (target state) · Status: [../domain/12-gap-analysis.md](../domain/12-gap-analysis.md)
> Builder interaction: [04-builder-interaction.md](04-builder-interaction.md). Data: [../domain/11-data-model.md](../domain/11-data-model.md).

## Purpose

Expert mode exposes the full model: all modules, entities, bindings, injects, map, and precise values. It is fast for repeat users and never breaks guided data.

## Layout (EXCON builder)

```text
┌───────────────────────────────────────────────────────────────────────┐
│ Einsatz „Sprengkörper entschärfen“   [Geführt] [Experte•]   ⚠ 2  💾 │
├───────────────┬───────────────────────────────────────┬───────────────┤
│ PALETTE       │ BOARD — Plan | Karte                  │ INSPECTOR     │
│ ▸ Module      │ ┌──────────┐  ┌──────────┐            │ Terminal 01   │
│   Terminal    │ │ Terminal │  │ Medizin  │            │ Modul [Terminal▾]
│   Medizin     │ │ 01       │──│ 01       │            │ Code [4F7K]   │
│   Karte       │ └──────────┘  └──────────┘            │ Dauer [120 s] │
│   …           │      │ patient-1                     │ Team [Alpha▾] │
│ ▸ Entitäten   │ ┌──────────┐                          │ ───────────── │
│   Patient     │ │ Patient  │                          │ Ziele, Zonen  │
│   Sprengkörper│ └──────────┘                          │ [Löschen]     │
│ ▸ Ereignisse  │                                       │               │
└───────────────┴───────────────────────────────────────┴───────────────┘
```

- Three panes fixed on ≥ 1280 px; on tablets palette/inspector become drawers.
- `[Prüfen]` opens the linter drawer with counts; clicking a finding selects the item.
- Header shows mission name (inline edit), depth toggle, linter badge, save state, revision chip (`"v12"`).

## Density and controls

| Control | Rule |
| --- | --- |
| Palette | Groups collapsible, searchable; drag handle on each item; click adds to board center (fallback) |
| Board | Cards with module icon, name, bindings, team color; zoom 50–150 %; pan by space-drag |
| Inspector | Immediate edits; number fields with steppers; code fields with regenerate button |
| Multi-select | Shift-click / marquee; inspector shows batch actions (module change, team, delete) |
| Context menu | Right-click/long-press on card: duplicate, delete, unbind, open module preview |
| Footer status | `"Gespeichert 12:04"` / `"Ungespeichert"` / `"Konflikt"` |

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `N` | Focus palette search |
| `P` | Open `"Prüfen"` |
| `K` | Toggle `Plan` / `Karte` |
| `Strg+Z` / `Strg+Y` | Undo / redo |
| `Strg+D` | Duplicate selection |
| `Entf` | Delete selection (confirm if bound) |
| `Strg+S` | Save (server or local draft) |
| `Esc` | Cancel drag / close drawer |
| `1..9` | Quick-add module by pinned order |

- All shortcuts MUST have a visible equivalent; no shortcut-only function.
- Shortcuts are listed under `"?"` (help overlay), grouped by area.

## Undo / redo

- Undo history ≥ 50 steps for builder mutations (add, remove, move, bind, edit, module change).
- Undo NEVER crosses a save boundary silently; after save the history resets with a marker.
- Deleting an entity with bindings is one undoable step (`"Rückgängig: Patient entfernt"`).

## Save, revision, conflict

- `"Speichern"` disabled while running; shows `"Übung läuft — Bearbeitung gesperrt"` with pause shortcut.
- Save state chip: `Gespeichert` / `Ungespeichert` / `Speichere…` / `Konflikt`.
- On conflict: dialog with `"Neu laden"` (discard local) and `"Als Kopie speichern"`; never silent merge.

## Power features

- **Mission check:** grouped findings, filters by severity, `"Alle beheben"` where safe (e.g. generate missing codes).
- **Bulk module change:** select stations → `"Modul ändern"` with compatibility warning.
- **Import/export:** JSON mission, copy as template, copy station config between missions.
- **Seed control:** show seed, `"Neu würfeln"` for jitter; deterministic label `"Seed 2048"`.
- **Map editing:** place zones/objectives by click-drag; numeric entry in inspector; route editor per player station (click path, drag points, `"Route löschen"`).
- **Inject table:** sortable list view (`"Ereignisse"` tab) with inline enable toggles and duplicate.

## Guided↔expert switching

- Toggle in header; switching to guided collapses drawers and shows summaries; data untouched.
- Guided hides: raw inject table, bindings graph, seed, route editor, batch actions.
- Expert-only destructive actions (delete mission, remove team) stay expert-only.

## Edge cases

- Window narrower than 1280 px: panes collapse in order inspector → palette; board keeps usable width.
- Undo after server save conflict: history resets, toast `"Verlauf nach Speichern zurückgesetzt"`.
- Very large mission (40 stations): board virtualizes cards; linter groups by severity; search filters.
- Shortcut pressed inside a text field: ignored (no global capture while editing).
- Two experts in one room: second save gets conflict dialog, never overwrite.

## Acceptance criteria

- [ ] Given expert mode, when `Strg+Z` is pressed after a delete, then the item and its bindings return.
- [ ] Given a running exercise, then save is disabled with a tooltip and `"Pause"` shortcut is offered.
- [ ] Given a stale revision, when saving, then the conflict dialog appears with both options.
- [ ] Given `?` help, then every shortcut has a clickable equivalent shown next to it.
