# U4 — Builder Interaction (Drag & Drop)

> ScreenForge concept set · Usability concept (target state) · Status: [../domain/12-gap-analysis.md](../domain/12-gap-analysis.md)
> Model: [../domain/04-mission-builder.md](../domain/04-mission-builder.md). Layout: [03-advanced.md](03-advanced.md).

## Drag sources

| Source | Drags | Drop target | Result |
| --- | --- | --- | --- |
| Palette module | Module | Board | New station (neutral defaults) |
| Palette entity | Patient/prop/dossier/zone/objective/team/actor | Board or station card | New entity (bound if on a station and compatible) |
| Palette inject | Time/zone/manual inject | Board | New inject row (disabled until configured) |
| Entity chip on board | Existing entity | Compatible station | Binding created (or replaced with confirm if occupied) |
| Station card | Station | Board empty area | Reorder/move (no structural change) |
| Entity chip | Entity | Trash / outside board | Unbind/delete with confirm if bound |

## Drop rules and feedback

| Situation | Feedback |
| --- | --- |
| Valid drop | Ghost snaps, card lands with 150 ms settle, linter badge updates |
| Invalid target (e.g. patient onto camera) | Ghost turns muted, cursor `no-drop`, drop does nothing, inline hint `"Patient passt zu Modul Medizin"` |
| Occupied binding (medical already has a patient) | Drop opens small chooser: `"Ersetzen"` / `"Abbrechen"` |
| Drop on empty board | Creates item at drop position (Plan view: append at end) |
| Drop outside board | Cancels; nothing created |
| Esc / back gesture mid-drag | Cancel; no partial state |

- A drag MUST NOT create entities implicitly: dropping `Medizin` creates only the station; the linter then offers `"Patient anlegen"`.
- Ghost shows the item name + target hint (`"→ Terminal 01"`) while hovering a valid target.

## Touch behavior (field tablets)

- Long-press 300 ms picks up an item; haptic tick (where supported) + lift shadow confirms pickup.
- Drag with one finger; board auto-scrolls near edges; palette becomes a bottom drawer.
- Alternative always visible: `"＋"` button on each palette item and each station card (`"Entität zuweisen"`).
- No hover-only affordances; context menus open via long-press on the item itself.

## Keyboard and accessible alternative

- Palette items are focusable buttons: `Enter` adds to board center (or selected station).
- Station cards are focusable; `"Entität zuweisen"` opens a searchable list dialog.
- Reordering via keyboard: select card, `Alt+↑/↓` moves it in order.
- Bindings can be created entirely without pointer: station inspector → `"Bindung"` field → type-ahead list.
- Drag & drop is an accelerator, never the only path (WCAG 2.1 AA).

## Binding interaction (graph)

- Bindings render as thin lines between entity chips and station cards; team color when set.
- Hovering a line highlights both ends and shows a label (`"Patient 01 → Medizin 01"`).
- Lines are removable by clicking a small `×` at midpoint (confirm if stateful, e.g. ordnance mid-run — blocked while running anyway).
- A `"Bindungen"` toggle hides lines for a clean view; default on in expert, off in guided.

## Map view (`Karte`)

| Action | Mouse | Touch |
| --- | --- | --- |
| Pan/zoom | drag / wheel | one finger / pinch |
| Place zone | tool `"Zone"` + click-drag radius | tap-hold then drag |
| Place objective | tool `"Ziel"` + click | tap |
| Edit route | click points on player station route | tap points |
| Move marker | drag marker | drag marker |

- Numeric fallback in inspector for lat/lng/radius; `"Mein Standort"` centers map.
- Offline grid when no tile URL; label `"Offline-Raster"` explains missing imagery.

## Multi-select and bulk

- Shift-click (desktop) / `"Auswählen"` mode (touch) selects multiple stations.
- Bulk actions: change module (compat warning), assign team, delete, duplicate.
- Marquee selection on empty board area; selected count shown in a floating bar.

## Undo integration

- Every drop, bind, unbind, reorder, and delete is one undoable step with a descriptive label.
- Undo toast for destructive drops: `"Patient 01 entfernt — Rückgängig"` (5 s).

## Edge cases

- Drag while board is read-only (running exercise): items show a lock cursor and a `"Übung läuft"` hint on press.
- Dropping two entities quickly: second drop queues; bindings resolve sequentially.
- Entity deleted while dragged: drop cancels with `"Entität existiert nicht mehr"`.
- Touch drag interrupted by system gesture: cancels cleanly; no ghost remains.
- 40 stations: board scroll performance stays ≥ 50 fps on a mid-range laptop.

## Acceptance criteria

- [ ] Given the palette, when a module is dropped on the board, then exactly one station is created with no entities.
- [ ] Given a patient chip dropped on a camera station, then no binding is created and a hint explains why.
- [ ] Given keyboard-only use, when a station is focused and `Enter` is pressed on a palette item, then the item is added.
- [ ] Given a completed drop, when `Strg+Z` is pressed, then the item is removed with its bindings restored on redo.
