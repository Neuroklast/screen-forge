# Art Direction

## Jede Familie ist ein eigenes System

VESPER übernimmt die Designrichtung aus Neuroklast/umbrella-corp-band-t: gebrochenes Weiß, schwarze 2px-Rahmen, karminrote Akzente, technische Eckmarken, Space Grotesk, JetBrains Mono und Inter. Die Übertragung betrifft ausschließlich die Konzernfamilie. BLACKLINE verwendet konzentrierte Konsolentypografie, gelbe Akzente und eine nachvollziehbare Netzstruktur. Sequence Control reserviert die größte Schrift für die Zeit. Orbital Survey legt Instrumentierung um ein zentrales Sichtfeld. AEON kombiniert feine Konturen mit wenigen räumlichen Ebenen.

Keine realen Markenlogos, Franchise-Namen oder kopierten Screens einbauen. Die Beispiele sind eigenständige Art Direction.

## Regeln

1. Maximal eine dominante visuelle Handlung je Blickbereich.
2. Die Hauptinformation muss im Standbild erkennbar sein.
3. Akzentfarbe ist Gestaltung. Warnung besitzt eine eigene semantische Farbe.
4. Schriftfamilien zentral halten: Space Grotesk für Hierarchie, IBM Plex Mono für Daten.
5. Für neue Displays zuerst Ruhe, Eingabe, Warnung und Abschluss gestalten.
6. Details müssen denselben Zustand beschreiben. Kein stabiler Link neben einem Linkausfall.
7. Effekte müssen auch bei Stärke null eine vollständige, lesbare Oberfläche hinterlassen.
8. Linien und Schrift als SVG, CSS oder Text, nicht als skalierte Rasterbilder.
9. Touchinteraktion folgt unmittelbar. Keine Feder zwischen Finger und Objekt.
10. Szenenzeit nicht mit Date.now oder lokalen Intervallen vervielfachen. Zeitabhängige Daten aus der zentralen Uhr ableiten.
11. Helligkeit und Dichte in Nahaufnahme und Totale prüfen.
12. Presetänderungen müssen mit langen Texten, kleinen Displays und Importfehlern geprüft werden.

## Abnahme

- Referenzaufnahme jeder Szene bei 1280×760.
- Desktopstudio und schmale mobile Ansicht ohne horizontalen Dokumentüberlauf.
- Start, Pause, Reset, Seek, Eingabe und Touchabbruch.
- Keine Konsolenfehler.
- 60-Hz-Zielgerät: Framezeiten messen, nicht nur pauschal 60 fps behaupten.
- Probeaufnahme mit tatsächlicher Kamera und tatsächlichem Display.

## Erweiterung

Eine neue Szene erhält eine stabile ID, Voreinstellungen und eine Komponente mit Config, Zeit und Cue. Neue konfigurierbare Eigenschaften zuerst im versionierten Schema ergänzen. Für alte Presets eine explizite Migration hinzufügen, sobald das Schema geändert wird.

## Referenz der Konzernfamilie

https://github.com/Neuroklast/umbrella-corp-band-t

Geprüft wurden src/index.css, src/components/TechFrame.tsx, src/components/Hero.tsx und src/themes/music-band/index.ts. Gestaltung als eigene, familieneigene CSS-Datei umgesetzt. Keine Funktionen, Bandinhalte oder externe Dienste aus der Referenz übernommen.
