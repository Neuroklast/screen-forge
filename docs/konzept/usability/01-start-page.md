# U1 — Start Page

> ScreenForge concept set · Usability concept (target state) · Status: [../domain/12-gap-analysis.md](../domain/12-gap-analysis.md)
> Routing rules: [../domain/03-modes-and-entry.md](../domain/03-modes-and-entry.md).

## Purpose

The start page answers three questions in five seconds: **Which mode? Which role? Guided or expert?** It is the default for `/` and never blocks deep links.

## Layout (desktop)

```text
┌──────────────────────────────────────────────────────────────┐
│ S/F  ScreenForge          [DE] [Server: erreichbar]   v0.x   │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│  │ FILM & TV  │  │  TRAINING  │  │    DEMO    │              │
│  │ Szenen,    │  │ Einsätze,  │  │ Offline-   │              │
│  │ Abläufe,   │  │ Geräte,    │  │ Vorführung │              │
│  │ Bühne      │  │ Übungsleiter│ │ in 5 Min.  │              │
│  │ [Öffnen]   │  │ [Öffnen]   │  │ [Starten]  │              │
│  └────────────┘  └────────────┘  └────────────┘              │
│                                                              │
│  Zuletzt:  ▶ Übung „Sprengkörper entschärfen“ (vor 2 h)      │
│  Direkt:    [Gerät verbinden]  [Übungsleitung]  [HQ]         │
│                                                              │
│  Tiefe:  (•) Geführt   ( ) Experte                           │
│  Hinweis: Alle Systeme sind fiktiv. Keine realen Daten.      │
└──────────────────────────────────────────────────────────────┘
```

## Elements

| Element | Behavior | Empty/edge case |
| --- | --- | --- |
| Mode cards | Click opens mode home; keyboard focus ring; card shows resume badge | No resume → hide row |
| Resume row | Last session per mode with relative time; click resumes | Hidden if none |
| Direct links | `"Gerät verbinden"` opens invite entry; `"Übungsleitung"` → EXCON login; `"HQ"` → HQ login | Without server: disabled + tooltip `"Server nicht erreichbar"` |
| Depth toggle | `Geführt` default for new users; persisted per browser | Changing depth on start page only affects default |
| Server status | Green `erreichbar` / gray `offline` with retry; updates every 5 s | Film/demo always available |
| Language | `DE` fixed for now; placeholder for future locales | — |
| Footer notice | Fictional content + license + repo link | — |

## Mode card content

| Card | Title | Subline | Primary |
| --- | --- | --- | --- |
| Film | `"Film & TV"` | `"Szenen, Abläufe und Bühnenausgabe"` | `"Öffnen"` |
| Training | `"Training"` | `"Einsätze bauen, Geräte verbinden, Übung fahren"` | `"Öffnen"` |
| Demo | `"Demo"` | `"Offline-Vorführung ohne Einrichtung"` | `"Starten"` |

## Training entry (second level)

```text
Training
 ├─ Neuer Einsatz      → Vorlagen-Galerie (Geführt) / Leerer Einsatz (Experte)
 ├─ Einsatz laden      → Liste + JSON-Import
 ├─ Übung fortsetzen   → aktueller Raum (wenn Server läuft)
 ├─ Geräte verbinden   → QR/Code-Eingabe
 └─ Debrief öffnen     → letzte Übung
```

- `"Neuer Einsatz"` respects the depth toggle: guided → gallery; expert → blank builder + gallery shortcut.
- `"Übung fortsetzen"` appears only with a reachable server and an existing room.

## Film entry (second level)

- `"Studio öffnen"`, `"Ablauf laden"`, `"Bühne starten"`, `"Letzte Konfiguration"`.
- Kiosk devices are not sent to this page; their deep link goes directly to the stage.

## Demo entry

- Starts the guided tour immediately ([../domain/10-demo.md](../domain/10-demo.md)); no login, no server check delay.

## Behavior rules

- MUST render in < 1 s on a mid-range laptop, no server required.
- Deep links (`role`, `room`, `station`, `kiosk`, `demo`) bypass this page entirely.
- A running exercise shows a top banner `"Übung läuft — zurückkehren"` as the primary action.
- Keyboard: `1`/`2`/`3` select modes, `Enter` opens, `E` toggles depth, `G` invite entry.
- On tablets (portrait), cards stack vertically; direct links become a two-column grid.

## States

| State | Display |
| --- | --- |
| No server | Mode cards active except training server actions; status gray |
| Server reachable, no session | Direct links enabled |
| Running exercise in another tab | Banner + `"Zur Übung"` |
| Offline + demo available | Demo card highlighted with `"Offline verfügbar"` badge |
| First run (no localStorage) | Guided depth, resume hidden, onboarding hint on Training card |

## Acceptance criteria

- [ ] Given a first-time user, when `/` opens, then the three cards are visible without scrolling on 1366×768.
- [ ] Given `?role=hq`, then the HQ login opens directly and the start page is never rendered.
- [ ] Given a running exercise, when the start page is opened in a second tab, then the resume banner appears within 5 s.
- [ ] Given no server, then Training deep links show a friendly offline state with retry, not a crash.
