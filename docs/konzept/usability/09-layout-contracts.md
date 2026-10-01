# U9 — Layout & Rendering Contracts

> ScreenForge concept set · Usability concept · Binding for every scene, block and overlay · Language: EN, UI labels DE
> Related: [00-principles.md](00-principles.md) · [07-accessibility-devices.md](07-accessibility-devices.md)

FUI surfaces are not web pages. Content MUST NOT reflow, push or escape the stage. These five contracts are hard requirements for every module; a violation is a bug.

## 1. Viewport prison (strict overflow)

- Root containers have a fixed stage size, `overflow: hidden` and `box-sizing: border-box`.
- Children use `width/height: 100%` of their assigned cell; they NEVER force the parent to grow.
- No visible scrollbars on any scene or block surface. Scrollable data (logs, lists) hides the scrollbar (`scrollbar-width: none` + `::-webkit-scrollbar { display: none }`) and auto-scrolls to the newest entry.
- The studio stage scales a fixed format canvas (default 1280×720); scenes MUST render inside it and never overflow.
- `#root` is a non-scrolling viewport (`height: 100%; overflow: hidden`). Training/control chrome (`.training-app`) is a fixed app viewport: `display: grid; grid-template-rows: auto minmax(0, 1fr); height: 100dvh; overflow: hidden`. The chrome (header, tabs, notices) is auto-height; the body (`.training-body`) owns the **single** scroll context, so nothing below the fold is unreachable (the countdown isolation button was lost this way) while the page itself never scrolls. An editor workspace inside the body fills it (`height: 100%`); it MUST NOT use viewport arithmetic like `calc(100dvh - Npx)`.
- The operator/field surface (`.field-app`) is the exception to the chrome rule: it is a fixed viewport prison (`height: 100dvh; overflow: hidden`, grid `auto minmax(0, 1fr) auto`) whose active interface mutates with state — no document header and no scroll stack. Data-heavy panels inside it may scroll invisibly (hidden scrollbar) but the root never does.
- Primary actions (abort, hold-to-restore, confirm) MUST own a fixed row in their panel — grid `auto minmax(0, 1fr) auto` with the variable content in the scrollable middle. Growing content MUST never displace or clip the action. Reference: `.warhead-controls` in [warhead.css](../../../src/scenes/shared/warhead.css).

## 2. Bento grid (placement)

- Macro layout uses CSS grid with fixed fractions (`fr`) or pixels; NEVER `flex-wrap` in scene layouts.
- Every module has an assigned grid area or column span; items fill exactly their cell and never displace each other.
- Responsive behaviour is NOT reflow: the whole stage scales instead (contract 5).

## 3. Z-index registry (stacking)

- No local magic numbers. Use the registry tokens (defined in `src/layout.css`):
  - `--sf-z-base: 0` — background art, grids, scanlines
  - `--sf-z-panel: 10` — standard panels and widgets
  - `--sf-z-float: 20` — floating widgets (toasts, menus, HUD)
  - `--sf-z-overlay: 40` — overlays/popups (CodePad, dialogs, gates)
  - `--sf-z-critical: 50` — critical alerts that must cover everything (abort banner)
- Scene-internal layers below `--sf-z-panel` are allowed only for background art; interactive content MUST be at panel level or above.

## 4. Truncation (data capping)

- Containers MUST NOT grow with data. Cap arrays programmatically (`slice(-N)`), truncate long strings (`text-overflow: ellipsis`), and give lists a fixed height.
- Logs show the last N lines that fit; older entries are dropped, never scrolled into the layout.
- No `height: auto` on data-driven containers inside the fixed stage.

## 5. Aspect-ratio lock (scaling)

- Scenes are authored for a fixed format (default 16:9) and scaled as a whole via `transform: scale()`; letterboxing is expected, reflow is forbidden.
- The scale factor derives from the container: `min(width / format.width, height / format.height)`.
- Portrait formats are authored as their own format, never by reflowing a landscape layout.

## Enforcement

- Every new scene/block change states which grid areas it uses and which z tokens it sets.
- New code MUST comply from day one; existing code migrates incrementally.
- Planned gate: `scripts/check-layout.mjs` flags `flex-wrap`, visible scrollbars and raw `z-index: <number>` under `src/scenes/**` and `src/training/**`.

## Acceptance criteria

- [ ] No scene or block shows a scrollbar or lets content escape its stage.
- [ ] Every panel keeps its primary action visible when its variable content grows (reserved action row, scrollable middle).
- [ ] Overlays (CodePad, dialogs, abort banner) always render above panels.
- [ ] Log/list containers keep their size regardless of data volume.
- [ ] A different tablet aspect ratio letterboxes; nothing reflows.
- [ ] The operator surface shows no document scrollbar; the active interface fills the viewport and its primary action keeps a reserved row.
