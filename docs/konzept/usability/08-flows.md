# U8 — End-to-End Flows

> ScreenForge concept set · Usability concept (target state) · Status: [../domain/12-gap-analysis.md](../domain/12-gap-analysis.md)
> Details per surface: [01](01-start-page.md)–[05](05-states-feedback.md).

## F1 — Training, guided (first-time EXCON)

```text
Startseite → Training → Vorlagen-Galerie → „Search & Rescue“ wählen
  → Gelände (Standard) → Geräte prüfen (5, umbenennen) → Entitäten (Patient vorhanden)
  → Ablauf (1 Ereignis) → Prüfen (0 Fehler) → „Einsatz anlegen“
  → Geräte-Tab: 5× „Gerät verbinden“ (QR) → Tablet scannt → Zuweisung
  → Bereitschaftsliste grün → „Übung starten“
  → Live: Ereignis auslösen, Patient ändern, Abbruch bei Bedarf
  → „Debrief exportieren“ → Ende
```

- Success: a non-technical user reaches `"Übung starten"` in ≤ 5 minutes.
- Escape hatches: `"Im Expertenmodus öffnen"` (any step), `"Vorlage wechseln"`.

## F2 — Training, advanced (free assembly)

```text
Startseite → Training → „Neuer Einsatz“ (Experte) → leerer Builder
  → Palette: 2× Terminal, 1× Karte, 1× Medizin auf die Ablage ziehen
  → Medizin-Karte auswählen → Linter: „Patient fehlt“ → „Patient anlegen“
  → Patient-Chip auf Medizin ziehen → Bindungen prüfen
  → Ereignisse: „bei 05:00 → Patient verschlechtert“ hinzufügen
  → Karte: Zone + Ziel setzen → Prüfen (0 Fehler) → Speichern (v1)
  → Geräte verbinden → starten → live fahren → Debrief
```

- Success: 1..n devices, 0..n entities, no forced content at any point.
- Guardrails: linter explains, never blocks construction; save gate only at start.

## F3 — Film & TV (production day)

```text
Startseite → Film & TV → Studio → Szene „Netzwerkterminal“ wählen
  → Ablauf laden (Show) → Takes prüfen → „Bühne starten“ (Ausgabe 1)
  → Weitere Ausgabe öffnen (?kiosk=1) → Szene pushen → „Synchron“ an
  → Take starten → Cue wechseln → Take-Log beobachten
  → Show exportieren → Wrap
```

- Success: push to 2 devices + synced take change in < 30 s from studio open.
- Fallback: device without push support shows `"Neu laden"` prompt.

## F4 — Demo (trade show)

```text
Startseite → Demo → Tour startet (Stop 1/7)
  → „Weiter“ … Stop 3: Gerät (Sprengkörper) → Code eingeben
  → Stop 5: Ereignis auslösen → Stop 6: Debrief
  → Stop 7: Sandbox → Vorlage wechseln → „Demo zurücksetzen“
  (Kiosk: 90 s Idle → Tour startet neu)
```

- Success: complete tour without network; visitor understands purpose within 60 s.

## F5 — Device provisioning & live loop

```text
EXCON: Geräte-Tab → „Gerät verbinden“ → QR/Code angezeigt
Tablet: Kamera/URL → Zuweisungsseite → „Als Spieler verbinden“ → Modul lädt
  → Berechtigungen: Standort erlauben (LIVE) → Bereitschaft meldet grün
EXCON: „Übung starten“ → Uhr läuft
Spieler: Aufgabe (Diagnose → Code) → Ereignis im Protokoll
HQ: Lage aktualisiert, Akte freigeben → Spieler sieht Akte
EXCON: Pause → Änderung → Fortsetzen (Version +1)
```

- Success: invite → live module in ≤ 60 s on a tablet with the app open.
- Failure paths: expired invite, GPS denied, camera denied, device offline — each with inline recovery ([05](05-states-feedback.md)).

## F6 — Safety intervention

```text
Sicherheit (eigene Ansicht) → „Abbruch“ (1 Tap, keine Bestätigung)
  → alle Geräte: Banner „ÜBUNG ABGEBROCHEN um 14:32 durch Sicherheit“
  → EXCON: „Zurücksetzen“ → Baseline → neue Übung möglich
```

- Success: abort effective within one server tick for all roles; logged with role + time.

## F7 — Debrief

```text
EXCON → „Debrief öffnen“ → Zeitstrahl (Ereignisse, Eingriffe, Ziele)
  → Beobachter: Notizen je Ereignis → Bewertung (optional)
  → „Exportieren“: JSON + CSV + Zusammenfassung
  → „Neue Übung aus diesem Einsatz“ (reset, gleiche Version)
```

- Success: export contains all events, notes, and outcomes; printable summary fits one page.

## Cross-flow rules

- Every flow has a keyboard path and a touch path.
- Every failure state offers retry/back/continue-offline.
- No flow requires reading documentation.
- All flows respect depth: guided shows fewer controls, same outcomes.

## Acceptance criteria

- [ ] Given F1 on a clean machine, the flow completes in ≤ 5 minutes by a first-time user.
- [ ] Given F4 offline, all stops run; given a network, still no server connection.
- [ ] Given F6, abort is ≤ 2 taps from the safety view and never blocked by dialogs.
- [ ] Given F7, exports include every logged event and assessor note.
