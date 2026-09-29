import { scenarioSchema, template, type Scenario } from "./training";

const map = { lat: 51.23, lng: 6.78, zoom: 15, tiles: "", attribution: "" };
const route = [
  { lat: 51.23, lng: 6.78 },
  { lat: 51.233, lng: 6.786 },
];
const base = {
  version: 2 as const,
  mode: "LIVE" as const,
  seed: 2048,
  map,
  stations: [] as Scenario["stations"],
  patients: [] as Scenario["patients"],
  props: [] as Scenario["props"],
  dossiers: [] as Scenario["dossiers"],
  teams: [] as Scenario["teams"],
  actors: [] as Scenario["actors"],
  zones: [] as Scenario["zones"],
  injects: [] as Scenario["injects"],
  objectives: [] as Scenario["objectives"],
};
const build = (name: string, patch: Record<string, unknown>): Scenario =>
  scenarioSchema.parse({ ...base, name, ...patch });

export type MissionTemplate = {
  id: string;
  name: string;
  summary: string;
  difficulty: 1 | 2 | 3;
  durationMin: number;
  scenario: Scenario;
};

export const missionTemplates: MissionTemplate[] = [
  {
    id: "blank",
    name: "Leerer Einsatz",
    summary: "Freier Baukasten ohne Geräte und Entitäten.",
    difficulty: 1,
    durationMin: 0,
    scenario: build("Leerer Einsatz", {}),
  },
  {
    id: "eod-disposal",
    name: "Sprengkörper entschärfen",
    summary: "Fiktive Konsole, Absperrung und Wartungsstufen.",
    difficulty: 3,
    durationMin: 25,
    scenario: build("Sprengkörper entschärfen", {
      stations: [
        { id: "hq", name: "Einsatzleitung", role: "hq", module: "tracking" },
        {
          id: "ord-1",
          name: "Konsole 01",
          role: "element",
          module: "ordnance",
          bindings: { patient: "", prop: "ordnance-1", objective: "" },
        },
        { id: "term-1", name: "Wartungsterminal", role: "element", module: "terminal" },
        { id: "data-1", name: "Datenblatt", role: "element", module: "data-sheet" },
        { id: "cam-1", name: "Kamera 01", role: "element", module: "camera" },
      ],
      props: [
        {
          id: "ordnance-1",
          kind: "ordnance",
          name: "Baugruppe 09",
          states: ["armed", "bypassed", "disarmed", "tampered"],
          initial: "armed",
          visible: true,
        },
      ],
      zones: [{ id: "zone-1", name: "Absperrung", lat: 51.233, lng: 6.786, radius: 150 }],
      objectives: [
        { id: "obj-1", name: "Absperrung melden" },
        { id: "obj-2", name: "Diagnose abschließen" },
        { id: "obj-3", name: "Baugruppe entschärfen" },
      ],
      injects: [
        {
          id: "inj-1",
          name: "Zeitfenster läuft",
          trigger: "timer",
          at: 600,
          actions: [{ type: "message", text: "Zeitfenster läuft" }],
          enabled: true,
        },
      ],
    }),
  },
  {
    id: "data-exfiltration",
    name: "Datenübernahme",
    summary: "Zielsystem, Archiv und Exfiltration aus dem Zielbereich.",
    difficulty: 3,
    durationMin: 25,
    scenario: build("Datenübernahme", {
      stations: [
        { id: "hq", name: "Einsatzleitung", role: "hq", module: "tracking" },
        { id: "term-1", name: "Zielsystem", role: "element", module: "terminal" },
        { id: "vault-1", name: "Archiv", role: "element", module: "terminal" },
        { id: "track-1", name: "Alpha 01", role: "element", module: "tracking", player: true, route },
        { id: "cam-1", name: "Kamera 01", role: "element", module: "camera" },
      ],
      props: [
        {
          id: "payload-1",
          kind: "payload",
          name: "Datenkern",
          states: ["empty", "copied", "destroyed"],
          initial: "empty",
          visible: true,
        },
      ],
      zones: [{ id: "zone-1", name: "Zielbereich", lat: 51.233, lng: 6.786, radius: 100 }],
      objectives: [
        { id: "obj-1", name: "Zugang herstellen" },
        { id: "obj-2", name: "Daten kopieren" },
        { id: "obj-3", name: "Bereich verlassen" },
      ],
      injects: [
        {
          id: "inj-1",
          name: "Alarm",
          trigger: "timer",
          at: 300,
          actions: [{ type: "message", text: "Alarm im Zielbereich" }],
          enabled: true,
        },
      ],
    }),
  },
  {
    id: "beacon-activation",
    name: "Bake aktivieren",
    summary: "Zielbereich erreichen, Signalgerät aktivieren und halten.",
    difficulty: 2,
    durationMin: 20,
    scenario: build("Bake aktivieren", {
      stations: [
        { id: "hq", name: "Einsatzleitung", role: "hq", module: "tracking" },
        {
          id: "beacon-1",
          name: "Bake",
          role: "element",
          module: "beacon",
          bindings: { patient: "", prop: "beacon-1", objective: "" },
        },
        { id: "track-1", name: "Alpha 01", role: "element", module: "tracking", player: true, route },
        { id: "term-1", name: "Terminal", role: "element", module: "terminal" },
      ],
      props: [
        {
          id: "beacon-1",
          kind: "beacon",
          name: "Bake 01",
          states: ["off", "active", "interference"],
          initial: "off",
          visible: true,
        },
      ],
      zones: [{ id: "zone-1", name: "Zielbereich", lat: 51.233, lng: 6.786, radius: 80 }],
      objectives: [
        { id: "obj-1", name: "Zielbereich erreichen" },
        { id: "obj-2", name: "Bake aktivieren" },
        { id: "obj-3", name: "Signal halten" },
      ],
    }),
  },
  {
    id: "search-rescue",
    name: "Search & Rescue",
    summary: "Patient suchen, stabilisieren und evakuieren.",
    difficulty: 2,
    durationMin: 30,
    scenario: template("sar"),
  },
  {
    id: "medical-emergency",
    name: "Medizinischer Notfall",
    summary: "Patientenversorgung ohne Requisiten.",
    difficulty: 1,
    durationMin: 15,
    scenario: build("Medizinischer Notfall", {
      stations: [
        { id: "hq", name: "Einsatzleitung", role: "hq", module: "tracking" },
        {
          id: "med-1",
          name: "Medizin 01",
          role: "element",
          module: "medical",
          bindings: { patient: "patient-1", prop: "", objective: "" },
        },
        { id: "term-1", name: "Akten", role: "element", module: "terminal" },
      ],
      patients: [{ id: "patient-1", name: "Patient 01", kind: "trauma", since: 0 }],
      objectives: [{ id: "obj-1", name: "Patient versorgen" }],
    }),
  },
  {
    id: "access-lockdown",
    name: "Zugang & Verriegelung",
    summary: "Zugang herstellen und Bereich verriegeln.",
    difficulty: 2,
    durationMin: 15,
    scenario: build("Zugang & Verriegelung", {
      stations: [
        { id: "hq", name: "Einsatzleitung", role: "hq", module: "tracking" },
        { id: "acc-1", name: "Zugang", role: "element", module: "access" },
        { id: "lock-1", name: "Verriegelung", role: "element", module: "lock" },
        { id: "term-1", name: "Terminal", role: "element", module: "terminal" },
      ],
      zones: [{ id: "zone-1", name: "Innenbereich", lat: 51.233, lng: 6.786, radius: 60 }],
      objectives: [
        { id: "obj-1", name: "Zugang herstellen" },
        { id: "obj-2", name: "Bereich sichern" },
      ],
    }),
  },
  {
    id: "milsim-skirmish",
    name: "MILSIM-Gefecht",
    summary: "Zwei Teams, ein Objekt, keine Requisiten.",
    difficulty: 2,
    durationMin: 20,
    scenario: build("MILSIM-Gefecht", {
      stations: [
        { id: "hq", name: "Einsatzleitung", role: "hq", module: "tracking" },
        { id: "alpha-1", name: "Alpha 01", role: "element", module: "tracking", player: true, team: "ALPHA", route },
        { id: "bravo-1", name: "Bravo 01", role: "element", module: "tracking", player: true, team: "BRAVO", route },
        { id: "comms-1", name: "Funk", role: "element", module: "comms" },
      ],
      teams: [
        { id: "ALPHA", name: "Alpha", color: "#80dce5" },
        { id: "BRAVO", name: "Bravo", color: "#f36c75" },
      ],
      zones: [{ id: "zone-1", name: "Objekt", lat: 51.233, lng: 6.786, radius: 90 }],
      objectives: [{ id: "obj-1", name: "Objekt halten" }],
    }),
  },
  {
    id: "film-playback",
    name: "Film-Aufzeichnung",
    summary: "Zwei Bühnenausgaben ohne Übungsserver.",
    difficulty: 1,
    durationMin: 10,
    scenario: build("Film-Aufzeichnung", {
      mode: "PLAYBACK",
      stations: [
        { id: "stage-1", name: "Bühne 01", role: "element", module: "corporate" },
        { id: "stage-2", name: "Bühne 02", role: "element", module: "hologram" },
      ],
      objectives: [{ id: "obj-1", name: "Ablauf vorbereiten" }],
    }),
  },
];
