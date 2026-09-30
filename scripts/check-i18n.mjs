// Guards the i18n migration: German strings must live in src/i18n dictionaries,
// not hardcoded in components. Files that are not migrated yet are listed in
// PENDING; shrink that list as migration progresses.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const SRC = join(root, "src");

const GERMAN =
  /[äöüÄÖÜß]|\b(und|oder|nicht|werden|wird|Übung|Einsatz|Gerät|Geräte|Speichern|Zurück|Weiter|Abbrechen|Schließen|Löschen|Hinzufügen|Keine|Meldung|Notiz|Übungsleitung|Sicherheit|Beobachter|Vorlage|Vorlagen|Palette|Ereignis|Stufe|Fehler|Datenblatt|Zeitstrahl|Lage|Stationen|Verbinden|Anmelden|Zuweisen|Verwerfen|Befund)\b/;

// Not migrated yet. This list MUST only shrink.
const PENDING = new Set([
  "src/App.tsx",
  "src/builder/MissionBuilder.tsx",
  "src/components/MediaManager.tsx",
  "src/components/SequenceEditor.tsx",
  "src/components/StageKeys.tsx",
  "src/components/SystemProfiles.tsx",
  "src/components/ThemeEditor.tsx",
  "src/components/TokenEditor.tsx",
  "src/scenes/os/OperatingSystem.tsx",
  "src/training/Dossiers.tsx",
  "src/training/ScenarioEditor.tsx",
  "src/training/ScenarioWizard.tsx",
  "src/views/StartPage.tsx",
  "src/views/TrainerView.tsx",
]);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const offenders = [];
for (const file of walk(SRC)) {
  const rel = relative(root, file).replace(/\\/g, "/");
  if (rel.startsWith("src/i18n/")) continue;
  if (/\.test\./.test(rel)) continue;
  if (PENDING.has(rel)) continue;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    if (GERMAN.test(line)) offenders.push(`${rel}:${index + 1}`);
  });
}

if (offenders.length) {
  console.error(
    `German hardcoded strings found (${offenders.length}); move them to src/i18n or add the file to PENDING:\n` +
      offenders.join("\n"),
  );
  process.exit(1);
}
console.log("i18n check: no German hardcoded strings outside src/i18n.");
