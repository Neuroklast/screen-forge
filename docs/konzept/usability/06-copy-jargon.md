# U6 — Copy & Jargon

> ScreenForge concept set · Usability concept (target state) · Status: [../domain/12-gap-analysis.md](../domain/12-gap-analysis.md)
> Normative terms: [../domain/01-glossary.md](../domain/01-glossary.md). Errors: [05-states-feedback.md](05-states-feedback.md).

## Tone rules

- **Element content (scenes, blocks, field consoles) is English.** The studio/training control chrome stays German.
- Short, imperative, factual. No exclamation marks, no marketing in operational UI.
- One concept, one word — always the glossary label.
- Jargon is paired on first use per session: `"Bake (Signalgerät)"`, afterwards `"Bake"`.
- Numbers and times formatted `mm:ss` (clock) and `dd.MM. HH:mm` (timestamps).
- No English schema words in UI (`station`, `module`, `entity` are never visible).
- Fictional framing stays honest: `"Simulation"`, `"Übung"`, `EXERCISE`, never implying real capability.

## Core UI strings (normative German)

| Context | Label |
| --- | --- |
| Start page modes | `"Film & TV"`, `"Training"`, `"Demo"` |
| Depth | `"Geführt"`, `"Experte"` |
| Training home | `"Neuer Einsatz"`, `"Einsatz laden"`, `"Übung fortsetzen"`, `"Geräte verbinden"`, `"Debrief öffnen"` |
| Builder | `"Palette"`, `"Ablage"`, `"Prüfen"`, `"Speichern"`, `"Rückgängig"`, `"Wiederholen"`, `"Vorlage laden"`, `"Als Vorlage speichern"` |
| Builder actions | `"Gerät hinzufügen"`, `"Entität anlegen"`, `"Bindung lösen"`, `"Duplizieren"`, `"Löschen"` |
| Linter | `"Prüfen"`, `"Fehler"`, `"Warnung"`, `"Hinweis"`, `"Alle beheben"` |
| Runtime | `"Übung starten"`, `"Pause"`, `"Fortsetzen"`, `"Zurücksetzen"`, `"Abbruch"` |
| Device | `"Gerät verbinden"`, `"Einladungscode"`, `"Zugewiesen an"`, `"Offline"` |
| HQ | `"Lage"`, `"Ziele"`, `"Geräte"`, `"Akten"`, `"Protokoll"` |
| Field | `"Karte"`, `"Funk"`, `"Medizin"`, `"Terminal"`, `"Zeitgeber"`, `"Zugang"`, `"Verriegelung"`, `"Bake"`, `"Sprengkörper"` |
| Debrief | `"Debrief"`, `"Zeitstrahl"`, `"Notizen"`, `"Exportieren"` |
| Demo | `"Tour starten"`, `"Weiter"`, `"Zurück"`, `"Sandbox öffnen"`, `"Demo zurücksetzen"` |

## Button labels

- Verbs, no nouns: `"Speichern"`, not `"Speicherung"`.
- One primary action per surface; secondary as text button.
- Destructive verbs explicit: `"Einsatz löschen"`, `"Gerät trennen"`, `"Übung abbrechen"`.
- No `"OK"` / `"Ja"` as sole confirmation; use the action verb (`"Abbrechen"`, `"Ersetzen"`).

## Error patterns

| Case | Copy |
| --- | --- |
| Invite expired | `"Der Einladungscode ist abgelaufen. Fordere einen neuen Code bei der Übungsleitung an."` |
| Wrong code (terminal) | `"Code falsch. Noch 2 Versuche, dann 30 s Sperre."` |
| Save conflict | `"Der Einsatz wurde inzwischen geändert. Lade neu oder speichere als Kopie."` |
| Offline start | `"Kein Server erreichbar. Der Einsatz ist lokal gespeichert; Geräte können nicht verbunden werden."` |
| GPS denied | `"Standortfreigabe fehlt. Die Karte zeigt die geplante Route. Erneut fragen?"` |
| Linter error | `"Mindestens ein Gerät erforderlich. Ziehe ein Modul aus der Palette."` |
| Abort | `"Übung abgebrochen um 14:32 durch Sicherheit."` |

## Jargon pairing list

| Jargon | Plain-language pair (first use) |
| --- | --- |
| EXCON | `"EXCON (Übungsleitung)"` |
| Inject | `"Ereignis (Inject)"` |
| AAR / Debrief | `"Debrief (Nachbesprechung)"` |
| Player | `"Spieler (Feldgerät)"` |
| Role player | `"Darsteller (Rolle)"` |
| Beacon | `"Bake (Signalgerät)"` |
| Payload | `"Datenkern (Datenträger)"` |
| Ordnance | `"Sprengkörper (fiktiv)"` |
| Zone | `"Zone (Kartenbereich)"` |
| Live / Playback | `"Live"` / `"Aufzeichnung"` |

## Forbidden copy

- `"Game"`, `"Level"`, `"Score"` in training surfaces (score only inside debrief as `"Bewertung"`).
- Real weapon/explosive terms, real frequencies, real procedures.
- `"Bombe"` outside marketing; operational UI uses `"Sprengkörper"`.
- Blame language (`"Du hast falsch eingegeben"`) — use neutral system voice.
- Raw ids, `undefined`, `null`, stack traces in visible UI.

## Microcopy examples

- Empty builder: `"Noch keine Geräte. Ziehe ein Modul aus der Palette oder lade eine Vorlage."`
- Readiness all green: `"Alle Geräte bereit. Übung kann starten."`
- Successful provision: `"Gerät verbunden: Terminal 01 (Spieler)."`
- Debrief export: `"Debrief gespeichert: uebung-2026-09-29.json"`.
- Demo start: `"Demo — alle Systeme sind fiktiv. Keine echten Daten."`

## Acceptance criteria

- [ ] Given any screen, no English schema term (`station`, `module`, `entity`, `inject` as raw word) is visible.
- [ ] Given a first-use jargon term, the plain-language pair appears in the same view.
- [ ] Given any error, the message follows happened/why/next and names a next action.
- [ ] Given the glossary labels, all button and menu strings in this file exist verbatim in the UI.
