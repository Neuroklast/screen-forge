import { scenarioSchema, type Scenario } from "./training";

const map = { lat: 51.23, lng: 6.78, zoom: 15, tiles: "", attribution: "" };

const relayRecovery = (): Scenario =>
  scenarioSchema.parse({
    version: 2,
    name: "Relay Recovery",
    mode: "LIVE",
    seed: 3117,
    map,
    stations: [
      { id: "hq", name: "HQ", role: "hq", module: "tracking" },
      {
        id: "op-a",
        name: "Operator A",
        role: "element",
        module: "tracking",
        player: true,
      },
      {
        id: "op-b",
        name: "Operator B",
        role: "element",
        module: "terminal",
        code: "4173",
      },
      {
        id: "relay",
        name: "Relay Terminal",
        role: "element",
        module: "data-sheet",
      },
    ],
    objectives: [{ id: "relay-online", name: "Relay freischalten" }],
    injects: [
      {
        id: "link-degrade",
        name: "Datenlink degradiert",
        trigger: "timer",
        at: 180,
        category: "inject",
        purpose: "Alternative Informationswege nutzen",
        expectedOutcome: ["comms.report"],
        evidence: ["Event: Datenlink degradiert"],
        failurePolicy: "degrade",
        actions: [{ type: "message", text: "Datenlink instabil" }],
      },
      {
        id: "extra-release",
        name: "Zusatzfreigabe",
        trigger: "timer",
        at: 300,
        category: "contingency",
        purpose: "Freigabeprozess prüfen",
        expectedOutcome: ["access.requested"],
        evidence: ["Event: Zusatzfreigabe"],
        failurePolicy: "continue",
        actions: [{ type: "message", text: "Zusatzfreigabe erforderlich" }],
      },
      {
        id: "time-window",
        name: "Zeitfenster",
        trigger: "manual",
        category: "other",
        purpose: "Entscheidung unter Zeitdruck",
        expectedOutcome: ["decision.request"],
        evidence: ["Event: Zeitfenster"],
        failurePolicy: "trainerDecision",
        actions: [{ type: "message", text: "Zeitfenster läuft" }],
      },
    ],
  });

const secureTransfer = (): Scenario =>
  scenarioSchema.parse({
    version: 2,
    name: "Secure Data Transfer",
    mode: "PLAYBACK",
    seed: 7,
    map,
    stations: [
      { id: "hero", name: "Hero Terminal", role: "element", module: "terminal" },
      { id: "hq", name: "Director", role: "hq", module: "tracking" },
    ],
    objectives: [{ id: "transfer", name: "Transfer abgeschlossen" }],
    injects: [
      {
        id: "beat-login",
        name: "Login",
        trigger: "manual",
        category: "expected_action",
        purpose: "Beat Login",
        expectedOutcome: ["identity.confirmed"],
        evidence: ["Event: Login"],
        failurePolicy: "hold",
        actions: [{ type: "message", text: "IDENTITY VERIFIED" }],
      },
      {
        id: "beat-warning",
        name: "Warning",
        trigger: "manual",
        category: "expected_action",
        purpose: "Beat Warning",
        expectedOutcome: ["warning.shown"],
        evidence: ["Event: Warning"],
        failurePolicy: "hold",
        actions: [{ type: "message", text: "INTEGRITY WARNING" }],
      },
      {
        id: "beat-transfer",
        name: "Transfer",
        trigger: "manual",
        category: "expected_action",
        purpose: "Beat Transfer",
        expectedOutcome: ["transfer.started"],
        evidence: ["Event: Transfer"],
        failurePolicy: "hold",
        actions: [{ type: "message", text: "TRANSFER RUNNING" }],
      },
    ],
  });

const distributedCommand = (): Scenario =>
  scenarioSchema.parse({
    version: 2,
    name: "Distributed Command Incident",
    mode: "LIVE",
    seed: 4096,
    map,
    stations: [
      { id: "hq", name: "Command", role: "hq", module: "tracking" },
      { id: "comms", name: "Comms", role: "element", module: "comms" },
      {
        id: "med-1",
        name: "Medic",
        role: "element",
        module: "medical",
        bindings: { patient: "patient-1" },
      },
      { id: "term-1", name: "Access", role: "element", module: "access" },
      {
        id: "op-1",
        name: "Team Alpha",
        role: "element",
        module: "tracking",
        player: true,
      },
    ],
    patients: [
      { id: "patient-1", name: "Casualty 01", kind: "stable", since: 0 },
    ],
    zones: [
      { id: "hazard", name: "Hazard Area", lat: 51.233, lng: 6.786, radius: 80 },
    ],
    objectives: [
      { id: "obj-intel", name: "Lagebild bestätigt" },
      { id: "obj-handover", name: "Übergabe abgeschlossen" },
    ],
    injects: [
      {
        id: "source-conflict",
        name: "Quellen widersprechen sich",
        trigger: "timer",
        at: 180,
        category: "inject",
        purpose: "Informationsbewertung trainieren",
        expectedOutcome: ["intel.flagged"],
        evidence: ["Event: Quellen widersprechen sich"],
        failurePolicy: "continue",
        actions: [{ type: "message", text: "Source B widerspricht Source A" }],
      },
      {
        id: "link-degrade",
        name: "Link Alpha degraded",
        trigger: "timer",
        at: 360,
        category: "inject",
        purpose: "Degraded Operations",
        expectedOutcome: ["comms.report"],
        evidence: ["Event: Link Alpha degraded"],
        failurePolicy: "degrade",
        actions: [{ type: "message", text: "Link Alpha degraded" }],
      },
      {
        id: "casualty",
        name: "Casualty aktiv",
        trigger: "manual",
        category: "inject",
        purpose: "Priorisierung und Reporting",
        expectedOutcome: ["patient.assessed"],
        evidence: ["Event: Casualty aktiv"],
        failurePolicy: "trainerDecision",
        actions: [{ type: "patient", target: "patient-1", kind: "trauma" }],
      },
      {
        id: "hazard",
        name: "Hazard gemeldet",
        trigger: "zone",
        zone: "hazard",
        station: "op-1",
        category: "inject",
        purpose: "Isolation und Specialist Request",
        expectedOutcome: ["hazard.reported"],
        evidence: ["Event: Hazard gemeldet"],
        fallback: "Controller message",
        failurePolicy: "branch",
        actions: [{ type: "message", text: "Verdächtiges Objekt gesichtet" }],
      },
      {
        id: "handover",
        name: "Übergabe freigegeben",
        trigger: "manual",
        category: "expected_action",
        purpose: "Strukturierter Abschluss",
        expectedOutcome: ["handover.accepted"],
        evidence: ["Event: Übergabe freigegeben"],
        failurePolicy: "hold",
        actions: [{ type: "objective", target: "obj-handover" }],
      },
    ],
  });

export type MissionTemplate = {
  id: string;
  name: string;
  category: "airsoft" | "film" | "professional";
  build: () => Scenario;
};

export const missionTemplates: MissionTemplate[] = [
  { id: "relay-recovery", name: "Relay Recovery", category: "airsoft", build: relayRecovery },
  { id: "secure-transfer", name: "Secure Data Transfer", category: "film", build: secureTransfer },
  {
    id: "distributed-command",
    name: "Distributed Command Incident",
    category: "professional",
    build: distributedCommand,
  },
];

export function buildMission(id: string): Scenario {
  const found = missionTemplates.find((t) => t.id === id);
  if (!found) throw new Error(`Unknown mission template: ${id}`);
  return found.build();
}
