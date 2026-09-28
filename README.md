# ScreenForge

Interaktive Filmoberflächen mit React, TypeScript, Motion und Vite. Alle angezeigten Systeme sind Fiktion. Keine Shell-Ausführung, kein Netzwerkzugriff aus Szenen, keine Waffentechnik. Lokale SVG-Grafiken und eigenständige Szenen. Das Konzernsystem verwendet die vom Nutzer vorgegebene helle, schwarz-rote Designreferenz aus Neuroklast/umbrella-corp-band-t.

## Windows: starten

1. ZIP vollständig entpacken.
2. Node.js 24 LTS inklusive npm installieren, falls noch nicht vorhanden.
3. `start-vite.bat` doppelklicken.
4. Beim ersten Start werden Pakete installiert. Danach ist für den normalen Start kein Internet nötig.
5. Das Konsolenfenster offen lassen. Beenden mit Strg+C.

Adresse: http://127.0.0.1:5173. Bei belegtem Port stoppt der Start mit Fehlermeldung, statt unbemerkt einen anderen Port zu verwenden.

Für ein Tablet oder einen Touchscreen im selben Netzwerk: `start-lan.bat` starten und die angezeigte Network-Adresse auf dem Gerät öffnen. Gegebenenfalls Windows-Firewall für das private Netzwerk freigeben. Dieser Entwicklungsserver hat keine Anmeldung und gehört nur in ein vertrauenswürdiges Netzwerk. Geräte spielen unabhängig, ohne gemeinsame Regiesynchronisation.

## Enthaltene Szenen

- **VESPER:** Helles Konzernsystem mit schwarzen Technikrahmen und roten Akzenten nach der Umbrella-Designreferenz. Navigation, Verzeichnissuche, Zugriffszustände und Diagnose.
- **BLACKLINE:** lokales Netzwerkterminal mit vorbereiteter oder freier Eingabe, Topologie und synthetischen Messwerten. Befehle erzeugen ausschließlich vorbereitete Texte.
- **Sequence Control:** Countdown mit Pause, Zeitsprung, automatischem Stopp bei null und fiktiven Gerätediagnosen.
- **Orbital Survey:** originale schematische Karte mit Touchgesten und Zielerfassung. Keine realen Satellitenbilder.
- **AEON:** interaktive SVG-Darstellung einer räumlichen Baugruppe, Analyseansichten und Touchtransformationen. Kein echtes 3D-Modell und kein Handtracking.

## Vorschau

![Studio mit Konzernsystem](docs/previews/studio.png)

Weitere Screenshots: [Countdown](docs/previews/countdown.png), [Terminal](docs/previews/terminal.png), [Tracking](docs/previews/tracking.png), [Analysetisch](docs/previews/hologram.png).

## Bedienung

Szenen links auswählen. Inhalte, Stimmung, Akzentfarbe, Effekte, Dichte und Helligkeit rechts einstellen. Ein Szenenwechsel lädt deren Originaldesign. Individuelle Varianten vor dem Wechsel als JSON exportieren. Das zuletzt eingestellte Preset wird automatisch im Browser gespeichert.

- **Abspielen / Pause:** gemeinsame Szenenuhr.
- **Reset:** Zeit, Szene, Texteingaben, Gestentransformation und Zustände zurücksetzen.
- **Zeitleiste:** Zeitabhängige Anzeigen direkt ansteuern. Sie spielt keine vergangenen manuellen Eingaben nach.
- **Ruhe / Aktion / Warnung / Abschluss:** manueller Szenenzustand. Seine Darstellung ist szenenspezifisch.
- **Bühne starten:** Ausgabe ohne Editor im Vollbild, sofern vom Browser erlaubt.
- **Nur Ausgabe:** Ausgabe ohne Browser-Vollbild.
- **Escape:** Studio wieder einblenden. Browser-Vollbild bei Bedarf nochmals per Escape verlassen.
- **H:** Ausgabe umschalten, **Leertaste:** Play/Pause, **R:** Reset. Shortcuts greifen nicht in Eingaben oder auf fokussierten Buttons.
- Im Ausgabemodus erscheint der Rückkehrknopf oben rechts beim Überfahren oder Tastaturfokus. Auf Touchgeräten bleibt er schwach sichtbar.

Karte und Hologramm: ein Finger oder linke Maustaste verschiebt, zwei Finger zoomen und drehen. Mausrad zoomt. Im Studio gibt es zusätzlich Zoom-, Dreh- und Resetknöpfe. Bewegungen sind begrenzt. Die Darstellung ist eine fest proportionierte 1280×760-Bühne, die in den verfügbaren Bildschirm eingepasst wird.

## Presets

JSON-Export und validierter Import. Version 1, höchstens 100 KB. Importierte Texte werden als Text gerendert, nicht als HTML. Eine fehlerhafte Datei verändert die laufende Konfiguration nicht. Beispielpresets liegen in `presets/`.

## Entwicklung

```sh
npm ci
npm run dev
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run preview` stellt den Build auf http://127.0.0.1:4173 bereit. `dist/` enthält auch alle benötigten Schriften. Der Build benötigt einen HTTP-Server, er ist nicht für einen Doppelklick auf index.html vorgesehen.

## Repository

Repository: https://github.com/Neuroklast/screen-forge

```sh
git clone https://github.com/Neuroklast/screen-forge.git
cd screen-forge
npm ci
npm run dev
```

Unter Windows startet `start-vite.bat` die Installation und den Vite-Server. `publish-github.bat` ist nur für eigenständige Kopien ohne vorhandenen origin-Remote vorgesehen.

## Architektur

- `src/core/config.ts`: Szenenkatalog, Voreinstellungen, Zod-Schema und Export.
- `src/core/runtime.ts`: gemeinsame monotone Szenenuhr und deterministische Daten.
- `src/components/GestureSurface.tsx`: Pointer Events, Pan, Pinch, Rotation und Abbruchbehandlung.
- `src/scenes/Scenes.tsx`: fünf originale Szenen mit lokalen Zuständen.
- `src/styles.css`: Studiooberfläche, Familiengestaltung und gemeinsame Designtokens.
- `docs/ART_DIRECTION.md`: Regeln für zusätzliche Szenen.

## Stand und Grenzen

Version 0.1 ist ein funktionsfähiger Grundstock. Noch nicht enthalten: Ereignisaufnahme und -wiedergabe, ferngesteuerte zweite Ausgabe, Videoexport, frei platzierbare Panels, externe Medienverwaltung, frei konfigurierbare Ablaufsequenzen, Electron und Handtracking. Die Regieknöpfe setzen den aktuellen Zustand, sie schreiben noch kein Ereignisprotokoll.

Zeitabhängige Daten sind deterministisch. Die kurze Motion-Konturanimation beim Start einer Hologrammanalyse ist eine unmittelbare Interaktionsanimation und läuft unabhängig von der Szenenuhr. Für einen späteren framegenauen Videoexport muss sie an die Szenenzeit gebunden werden.

Der Windows-Launcher ist erstellt und auf Fehlerpfade geprüft, wurde in dieser Linux-Umgebung aber nicht unter Windows ausgeführt. Multitouch wird automatisiert über Pointer Events geprüft. Reale Touchhardware und Kameraabnahme stehen noch aus.

Für Kameraaufnahmen immer Bildrate, Belichtung, Moiré, Bildschirmhelligkeit und Lesbarkeit am Zielgerät prüfen. Ein Browser-Screenshot ersetzt diese Abnahme nicht.

## Designupdate Konzernsystem

Bei bereits gespeicherten lokalen Einstellungen kann die bisherige Akzentfarbe erhalten bleiben. Mit „Originaldesign wiederherstellen“ oder Import von `presets/corporate.json` wird die neue rot-weiße Voreinstellung geladen.
