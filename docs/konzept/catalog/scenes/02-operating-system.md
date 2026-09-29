# Catalog — Operating System (Betriebssystem)

> ScreenForge concept set · Catalog · Target state (Soll) · Language: EN, UI labels DE
> Scene id `os` · Default in-world title `BLACKLINE` (company: Blackline Operations) · Code: `src/scenes/os/CyberOS.tsx` (to be renamed `OperatingSystem`), `os/*.tsx`, `os/os.css`
> Used in: Film (scene `os`), Training (module `os`). The command line is a separate scene: [08-terminal.md](08-terminal.md)

## Naming (concept clarification)

- The scene is the **operating system**: a full desktop surface with windows, taskbar, start menu and apps.
- `BLACKLINE` is the default in-world title (company identity); any of the 14 companies may be applied.
- The previous combined "network terminal" is split: this file is the desktop, [08-terminal.md](08-terminal.md) is the command line.

## Look & feel (normative)

| Rule | Detail |
| --- | --- |
| Squared | No border radius anywhere; 1 px borders; own-system window chrome |
| Dense | Base type 11 px, labels 10 px, generous inner padding, aligned grids |
| Own language | Fictional system design (not a Windows clone), but with real OS affordances |
| Photos | Never cropped: `object-fit: contain` with a themed backdrop; see "Photos" |
| Motion | Subtle only: window open/close/minimize 150–220 ms, menu fade, no bounce |
| Sound | Synthetic OS sounds (startup, click, open, close, error, notify) |

## Window chrome

- Title bar: app name, window id, minimize / maximize / close buttons (square, 1 px).
- Menu bar per app (File / Edit / View style, fictional labels).
- Status line at the bottom of each window (context, counts, clock).
- Windows: focus ring (1 px accent), inactive dimming, drag by title bar, no resize in v2.
- Taskbar: start button, pinned apps, open windows, system tray (clock, phase, connection).

## Login mask

- Optional sign-in gate before the desktop: `sceneOptions.os.login { enabled, user, pass }` (default off).
- Fields `User` / `Password`, `Sign in`; wrong credentials play `osError` and show `Access denied`; success plays `osStartup`.
- Pairs with the terminal goal (bypass login): enable it for scenes where the challenge is to get past the gate.

## Apps

| App | Content | Notes |
| --- | --- | --- |
| Personnel | Dossiers with **uncropped portraits**, record tabs, events | Photos from media; theme overlay |
| Filesystem | Folder tree, file table, file preview modal | Dense table, small type |
| Messages | Inbox/outbox, message reader | Links to files/personnel |
| Data clusters | Collections, correlation runs | Existing trace visuals |
| 4D projection | Tesseract, sliders, freeze | Existing |
| Sequences | Sequence library, run panel | See [03-os-sequences.md](03-os-sequences.md) |
| Settings | Appearance, sound, density, wallpaper | New; writes `sceneOptions.os` |

## Photos

- Source: media store / `public/media/portraits/**` (8 bundled portraits) or mission dossiers.
- Display: full image, uncropped (`contain`), letterbox filled with the themed surface color.
- Theme overlay: a tint layer over the photo using the accent/secondary color
  (`mix-blend-mode: color` at low opacity), configurable per theme (`photoOverlay: 0–1`).
- Caption bar: name + role below the image, monogram fallback when no photo exists.

## Density & layout

- Desktop grid: 12 columns, 8 px gutters; windows snap to the grid.
- Content: 11 px base, 10 px labels, 1.4 line height; tables use zebra rows.
- Space: window padding 12 px, list row height 22 px, no cramped three-column stacks.

## Config (`sceneOptions.os`)

| Option | Meaning |
| --- | --- |
| `wallpaper` | background variant (grid, plain, scan) |
| `photoOverlay` | 0–1 tint strength over photos |
| `density` | `compact` / `roomy` |
| `startupApp` | app opened on scene start |
| `sounds` | on/off per sound group |

## Target state (Soll)

- MUST render all photos uncropped with a themed backdrop and optional overlay.
- MUST use squared, dense, own-system chrome — no modern rounded UI.
- MUST keep every app reachable from start menu, desktop and taskbar.
- MUST gate Personnel content by released dossiers in training.
- SHOULD animate window open/close/minimize subtly and respect `prefers-reduced-motion`.
- SHOULD play synthetic OS sounds on open/close/error/notify (config-driven).

## Edge cases

- Missing photo: monogram placeholder, no layout shift, overlay still applies.
- Window opened twice: focus the existing window instead of duplicating.
- Very long names: truncate with ellipsis in title bar and lists.
- Reduced motion: instant transitions, no window animation.

## Acceptance criteria

- [ ] Given a dossier with a portrait, the image is fully visible (no crop) with the theme tint.
- [ ] Given the desktop, start menu, taskbar and all apps are reachable and render squared chrome.
- [ ] Given `prefers-reduced-motion`, no window animation runs.
- [ ] Given training mode, unreleased dossiers never appear in Personnel.
