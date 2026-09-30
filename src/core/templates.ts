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
    name: "Blank Mission",
    summary: "Free canvas without devices or entities.",
    difficulty: 1,
    durationMin: 0,
    scenario: build("Blank Mission", {}),
  },
  {
    id: "eod-disposal",
    name: "Ordnance Disposal",
    summary: "Fictional console, cordon and maintenance stages.",
    difficulty: 3,
    durationMin: 25,
    scenario: build("Ordnance Disposal", {
      stations: [
        { id: "hq", name: "Command", role: "hq", module: "tracking" },
        {
          id: "ord-1",
          name: "Console 01",
          role: "element",
          module: "ordnance",
          bindings: { patient: "", prop: "ordnance-1", objective: "" },
        },
        { id: "term-1", name: "Maintenance Terminal", role: "element", module: "terminal" },
        { id: "data-1", name: "Data Sheet", role: "element", module: "data-sheet" },
        { id: "cam-1", name: "Camera 01", role: "element", module: "camera" },
      ],
      props: [
        {
          id: "ordnance-1",
          kind: "ordnance",
          name: "Assembly 09",
          states: ["armed", "bypassed", "disarmed", "tampered"],
          initial: "armed",
          visible: true,
        },
      ],
      zones: [{ id: "zone-1", name: "Cordon", lat: 51.233, lng: 6.786, radius: 150 }],
      objectives: [
        { id: "obj-1", name: "Report cordon" },
        { id: "obj-2", name: "Complete diagnostics" },
        { id: "obj-3", name: "Disarm assembly" },
      ],
      injects: [
        {
          id: "inj-1",
          name: "Time window running",
          trigger: "timer",
          at: 600,
          actions: [{ type: "message", text: "Time window running" }],
          enabled: true,
        },
      ],
    }),
  },
  {
    id: "data-exfiltration",
    name: "Data Exfiltration",
    summary: "Target system, archive and exfiltration from the target area.",
    difficulty: 3,
    durationMin: 25,
    scenario: build("Data Exfiltration", {
      stations: [
        { id: "hq", name: "Command", role: "hq", module: "tracking" },
        { id: "term-1", name: "Target System", role: "element", module: "terminal" },
        { id: "vault-1", name: "Archive", role: "element", module: "terminal" },
        { id: "track-1", name: "Alpha 01", role: "element", module: "tracking", player: true, route },
        { id: "cam-1", name: "Camera 01", role: "element", module: "camera" },
      ],
      props: [
        {
          id: "payload-1",
          kind: "payload",
          name: "Data Core",
          states: ["empty", "copied", "destroyed"],
          initial: "empty",
          visible: true,
        },
      ],
      zones: [{ id: "zone-1", name: "Target Area", lat: 51.233, lng: 6.786, radius: 100 }],
      objectives: [
        { id: "obj-1", name: "Gain access" },
        { id: "obj-2", name: "Copy data" },
        { id: "obj-3", name: "Leave area" },
      ],
      injects: [
        {
          id: "inj-1",
          name: "Alarm",
          trigger: "timer",
          at: 300,
          actions: [{ type: "message", text: "Alarm in target area" }],
          enabled: true,
        },
      ],
    }),
  },
  {
    id: "beacon-activation",
    name: "Beacon Activation",
    summary: "Reach the target area, activate and hold the beacon.",
    difficulty: 2,
    durationMin: 20,
    scenario: build("Beacon Activation", {
      stations: [
        { id: "hq", name: "Command", role: "hq", module: "tracking" },
        {
          id: "beacon-1",
          name: "Beacon",
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
          name: "Beacon 01",
          states: ["off", "active", "interference"],
          initial: "off",
          visible: true,
        },
      ],
      zones: [{ id: "zone-1", name: "Target Area", lat: 51.233, lng: 6.786, radius: 80 }],
      objectives: [
        { id: "obj-1", name: "Reach target area" },
        { id: "obj-2", name: "Activate beacon" },
        { id: "obj-3", name: "Hold signal" },
      ],
    }),
  },
  {
    id: "search-rescue",
    name: "Search & Rescue",
    summary: "Find, stabilise and evacuate a patient.",
    difficulty: 2,
    durationMin: 30,
    scenario: template("sar"),
  },
  {
    id: "medical-emergency",
    name: "Medical Emergency",
    summary: "Patient care without props.",
    difficulty: 1,
    durationMin: 15,
    scenario: build("Medical Emergency", {
      stations: [
        { id: "hq", name: "Command", role: "hq", module: "tracking" },
        {
          id: "med-1",
          name: "Medical 01",
          role: "element",
          module: "medical",
          bindings: { patient: "patient-1", prop: "", objective: "" },
        },
        { id: "term-1", name: "Records", role: "element", module: "terminal" },
      ],
      patients: [{ id: "patient-1", name: "Patient 01", kind: "trauma", since: 0 }],
      objectives: [{ id: "obj-1", name: "Treat patient" }],
    }),
  },
  {
    id: "access-lockdown",
    name: "Access & Lockdown",
    summary: "Gain access and lock down the area.",
    difficulty: 2,
    durationMin: 15,
    scenario: build("Access & Lockdown", {
      stations: [
        { id: "hq", name: "Command", role: "hq", module: "tracking" },
        { id: "acc-1", name: "Access", role: "element", module: "access" },
        { id: "lock-1", name: "Lockdown", role: "element", module: "lock" },
        { id: "term-1", name: "Terminal", role: "element", module: "terminal" },
      ],
      zones: [{ id: "zone-1", name: "Interior", lat: 51.233, lng: 6.786, radius: 60 }],
      objectives: [
        { id: "obj-1", name: "Gain access" },
        { id: "obj-2", name: "Secure area" },
      ],
    }),
  },
  {
    id: "milsim-skirmish",
    name: "MILSIM Skirmish",
    summary: "Two teams, one objective, no props.",
    difficulty: 2,
    durationMin: 20,
    scenario: build("MILSIM Skirmish", {
      stations: [
        { id: "hq", name: "Command", role: "hq", module: "tracking" },
        { id: "alpha-1", name: "Alpha 01", role: "element", module: "tracking", player: true, team: "ALPHA", route },
        { id: "bravo-1", name: "Bravo 01", role: "element", module: "tracking", player: true, team: "BRAVO", route },
        { id: "comms-1", name: "Radio", role: "element", module: "comms" },
      ],
      teams: [
        { id: "ALPHA", name: "Alpha", color: "#80dce5" },
        { id: "BRAVO", name: "Bravo", color: "#f36c75" },
      ],
      zones: [{ id: "zone-1", name: "Objective", lat: 51.233, lng: 6.786, radius: 90 }],
      objectives: [{ id: "obj-1", name: "Hold objective" }],
    }),
  },
  {
    id: "film-playback",
    name: "Film Playback",
    summary: "Two stage outputs without an exercise server.",
    difficulty: 1,
    durationMin: 10,
    scenario: build("Film Playback", {
      mode: "PLAYBACK",
      stations: [
        { id: "stage-1", name: "Stage 01", role: "element", module: "corporate" },
        { id: "stage-2", name: "Stage 02", role: "element", module: "hologram" },
      ],
      objectives: [{ id: "obj-1", name: "Prepare sequence" }],
    }),
  },
];
