import { z } from "zod";
import { ordnanceTypeSchema } from "./ordnance.ts";
import {
  inferScenarioType,
  isScenarioType,
  scenarioTypes,
  type CapabilityOverrides,
  type ScenarioType,
} from "./capabilities.ts";
import {
  activeTaskOf,
  advanceWorkflow,
  evaluateWorkflow,
  redactInstanceSecrets,
  redactWorkflowSecrets,
  startWorkflow,
  workflowSchema,
  type Workflow,
  type WorkflowEvent,
  type WorkflowInstance,
} from "./workflow.ts";
import {
  sceneIds,
  scenePresetSchema,
  type SceneId,
  type ScenePreset,
} from "./config.ts";
import { generatedMetaSchema, guidedSessionSchema } from "./guided/types.ts";
import { deviceSurfaceIds } from "./devices.ts";

// Shared by the browser and Node 24. No browser-only imports in this module.
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/);
const label = z.string().trim().min(1).max(120);
const text = z.string().max(4000);
const finite = z.number().finite();
export const kinds = [
  "stable",
  "tachy",
  "brady",
  "desat",
  "trauma",
  "arrest",
  "recovered",
] as const;
export const modules = [
  "medical",
  "camera",
  "tracking",
  "os",
  "terminal",
  "countdown",
  "access",
  "comms",
  "intranet",
  "hologram",
  "lock",
  "slide",
  "ordnance",
  "beacon",
  "clock",
  "rotary",
  "code-table",
  "data-sheet",
] as const;
export const propKinds = [
  "ordnance",
  "beacon",
  "payload",
  "keycard",
  "custom",
] as const;
export const phases = [
  "draft",
  "ready",
  "running",
  "paused",
  "aborted",
  "ended",
] as const;
export type Phase = (typeof phases)[number];
export const moduleEvents: Record<string, string[]> = {
  comms: ["comms.channel", "comms.ptt"],
  slide: ["slide.open"],
  hologram: ["analysis.complete"],
  intranet: ["identity.confirmed"],
  ordnance: ["ordnance.stage", "ordnance.disarmed", "ordnance.tampered"],
  beacon: ["beacon.active", "beacon.lost"],
  terminal: ["shell.success", "terminal.bypass"],
  "data-sheet": ["data.relay"],
  "code-table": ["code.solved"],
  rotary: ["rotary.aligned"],
};
export const vitalSchema = z.object({
  hr: finite.min(0).max(250),
  spo2: finite.min(0).max(100),
  rr: finite.min(0).max(60),
  sys: finite.min(0).max(250),
  dia: finite.min(0).max(160),
  temp: finite.min(25).max(43),
  gcs: finite.int().min(3).max(15),
  etco2: finite.min(0).max(100),
});
export const patientSchema = z.object({
  id,
  name: label,
  kind: z.enum(kinds),
  since: finite.min(0),
  overrides: vitalSchema.partial().default({}),
  triage: z.enum(["green", "yellow", "red", "black"]).default("green"),
  injuries: text.default(""),
  origin: generatedMetaSchema.optional(),
});
export const dossierSchema = z.object({
  id,
  name: label,
  role: text,
  blood: z.string().max(20),
  allergies: text,
  clearance: z.string().max(80),
  status: z.string().max(80),
  facility: text,
  notes: text,
  events: z.array(z.string().max(500)).max(50),
  photo: z
    .string()
    .max(300000)
    .refine(
      (v) =>
        !v ||
        /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v) ||
        /^\/media\/[^?#]+$/.test(v),
      "Use an uploaded image or bundled media",
    ),
  released: z.boolean().default(false),
  origin: generatedMetaSchema.optional(),
});
export const pointSchema = z.object({
  lat: finite.min(-85).max(85),
  lng: finite.min(-180).max(180),
});
export const bindingSchema = z.object({
  patient: z.string().max(40).default(""),
  prop: z.string().max(40).default(""),
  objective: z.string().max(40).default(""),
});
// Per-station presentation bound to the scenario and pushed to the field
// device. `scene` overrides the module-derived scene; `config` carries the
// look/identity preset; `revision` lets the device remount on a change.
export const presentationSchema = z.object({
  scene: z.enum(sceneIds).optional(),
  config: scenePresetSchema.optional(),
  revision: z.number().int().min(0).default(0),
});
export type Presentation = z.infer<typeof presentationSchema>;

// Edits a station's presentation and bumps `revision` so field devices remount.
// `scene: null` / `config: null` clears the override; `config` patches merge.
export function editPresentation(
  current: Presentation | undefined,
  patch: { scene?: SceneId | null; config?: Partial<ScenePreset> | null },
): Presentation {
  const next: Presentation = current
    ? { ...current, config: current.config ? { ...current.config } : undefined }
    : { revision: 0 };
  if ("scene" in patch) {
    if (patch.scene) next.scene = patch.scene;
    else delete next.scene;
  }
  if ("config" in patch) {
    if (patch.config) next.config = { ...next.config, ...patch.config };
    else delete next.config;
  }
  next.revision = (current?.revision ?? 0) + 1;
  return next;
}
export const stationSchema = z.object({
  id,
  name: label,
  role: z.enum(["hq", "element"]),
  module: z.enum(modules),
  bindings: bindingSchema.default({ patient: "", prop: "", objective: "" }),
  team: z.string().max(40).default("ALPHA"),
  player: z.boolean().default(false),
  duration: finite.min(1).max(86400).default(900),
  code: z
    .string()
    .regex(/^\d{4,12}$/)
    .default("7392"),
  route: z.array(pointSchema).max(20).default([]),
  // Primary team role + extra qualifications. A role is not a person and not a
  // qualification (docs/konzept/domain/16-team-templates.md).
  roleId: z.string().max(40).optional(),
  qualifications: z.array(z.string().max(40)).max(20).optional(),
  // Explicit visible surface; when unset it is derived from the module
  // (docs/architecture/devices.md).
  surface: z.enum(deviceSurfaceIds).optional(),
  presentation: presentationSchema.optional(),
  origin: generatedMetaSchema.optional(),
});
export const propSchema = z.object({
  id,
  kind: z.enum(propKinds),
  name: label,
  states: z.array(z.string().max(40)).min(1).max(20).default(["off", "on"]),
  initial: z.string().max(40).default("off"),
  visible: z.boolean().default(true),
  ordnanceId: z.string().max(40).default(""),
  origin: generatedMetaSchema.optional(),
});
export const teamSchema = z.object({
  id,
  name: label,
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .default("#80dce5"),
  // Team template + fictional callsign (docs/konzept/domain/16-team-templates.md).
  templateId: z.string().max(40).optional(),
  callsign: z.string().max(40).optional(),
  parentTeamId: z.string().max(40).optional(),
  origin: generatedMetaSchema.optional(),
});
export const actorSchema = z.object({
  id,
  name: label,
  character: z.string().max(120).default(""),
  briefing: text.default(""),
  dossierId: z.string().max(40).default(""),
  origin: generatedMetaSchema.optional(),
});
export const zoneSchema = pointSchema.extend({
  id,
  name: label,
  radius: finite.min(5).max(10000),
  origin: generatedMetaSchema.optional(),
});
export const objectiveSchema = z.object({
  id,
  name: label,
  origin: generatedMetaSchema.optional(),
});
export const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("patient"), target: id, kind: z.enum(kinds) }),
  z.object({ type: z.literal("release"), target: id }),
  z.object({ type: z.literal("camera"), target: id, offline: z.boolean() }),
  z.object({ type: z.literal("objective"), target: id }),
  z.object({ type: z.literal("message"), text: label }),
  z.object({ type: z.literal("prop"), target: id, state: z.string().max(40) }),
]);
export const injectCategories = [
  "inject",
  "contingency",
  "expected_action",
  "other",
] as const;
export const injectStatuses = [
  "planned",
  "held",
  "armed",
  "fired",
  "skipped",
  "expired",
  "replaced",
] as const;
export const failurePolicies = [
  "continue",
  "degrade",
  "hold",
  "branch",
  "trainerDecision",
] as const;
export const injectSchema = z.object({
  id,
  name: label,
  trigger: z.enum(["timer", "zone", "intervention", "prop", "signal", "manual"]),
  at: finite.min(0).max(86400).default(60),
  jitter: finite.min(0).max(3600).default(0),
  station: z.string().max(40).default(""),
  zone: z.string().max(40).default(""),
  intervention: z.string().max(80).default("treated"),
  unless: z.string().max(80).default(""),
  actions: z.array(actionSchema).min(1).max(10),
  enabled: z.boolean().default(true),
  category: z.enum(injectCategories).default("inject"),
  status: z.enum(injectStatuses).default("planned"),
  purpose: z.string().max(300).default(""),
  expectedOutcome: z.array(z.string().max(120)).max(10).default([]),
  evidence: z.array(z.string().max(80)).max(10).default([]),
  failurePolicy: z.enum(failurePolicies).default("continue"),
  safetyGate: z.string().max(120).default(""),
  owner: z.string().max(40).default(""),
  audience: z.array(z.string().max(40)).max(20).default([]),
  conditions: z.array(z.string().max(120)).max(10).default([]),
  escalation: z.string().max(40).default(""),
  plannedAtOriginal: finite.min(0).max(86400).nullable().default(null),
  scheduledAt: finite.min(0).max(86400).nullable().default(null),
  timeBasis: z.enum(["exercise", "wall"]).default("exercise"),
  revision: z.number().int().min(0).default(0),
  fallback: z.string().max(300).default(""),
  repeatable: z.boolean().default(false),
  maxIterations: z.number().int().min(1).max(50).default(1),
  exitCondition: z.string().max(120).default(""),
  origin: generatedMetaSchema.optional(),
});
export const capabilityOverridesSchema = z
  .object({
    participants: z.boolean().optional(),
    teams: z.boolean().optional(),
    actors: z.boolean().optional(),
    patients: z.boolean().optional(),
    props: z.boolean().optional(),
    zones: z.boolean().optional(),
    dossiers: z.boolean().optional(),
    devices: z.boolean().optional(),
    workflows: z.boolean().optional(),
    objectives: z.boolean().optional(),
  })
  .default({});
const scenarioV2Schema = z
  .object({
    version: z.literal(2),
    type: z.enum(scenarioTypes).default("custom"),
    capabilities: capabilityOverridesSchema,
    guided: guidedSessionSchema.optional(),
    name: label,
    mode: z.enum(["LIVE", "PLAYBACK"]),
    seed: finite.int().min(1).max(2147483647),
    map: pointSchema.extend({
      zoom: finite.int().min(2).max(19),
      tiles: z
        .string()
        .max(500)
        .refine(
          (v) =>
            v === "" || /^https:\/\/[^\s]+\{z\}[^\s]*\{x\}[^\s]*\{y\}/.test(v),
          "Use an HTTPS XYZ tile URL",
        )
        .transform((v) => (v.includes("tile.openstreetmap.org") ? "" : v)),
      attribution: z.string().max(200),
    }),
    stations: z.array(stationSchema).min(0).max(40),
    patients: z.array(patientSchema).max(40).default([]),
    props: z.array(propSchema).max(40).default([]),
    dossiers: z.array(dossierSchema).max(40).default([]),
    teams: z.array(teamSchema).max(20).default([]),
    actors: z.array(actorSchema).max(20).default([]),
    zones: z.array(zoneSchema).max(40).default([]),
    injects: z.array(injectSchema).max(100).default([]),
    objectives: z.array(objectiveSchema).max(40).default([]),
    ordnanceTypes: z.array(ordnanceTypeSchema).max(40).default([]),
    workflows: z.array(workflowSchema).max(40).default([]),
  })
  .superRefine((s, ctx) => {
    const issue = (message: string) =>
      ctx.addIssue({ code: "custom", message });
    for (const rows of [
      s.stations,
      s.patients,
      s.props,
      s.dossiers,
      s.teams,
      s.actors,
      s.zones,
      s.injects,
      s.objectives,
      s.ordnanceTypes,
      s.workflows,
    ])
      if (new Set(rows.map((x) => x.id)).size !== rows.length)
        issue("IDs must be unique within each collection");
    for (const st of s.stations) {
      // Missing patients/props are linter findings (review/start gate), not
      // schema errors: a draft may be incomplete while it is built.
      if (
        st.bindings.patient &&
        !s.patients.some((p) => p.id === st.bindings.patient)
      )
        issue(`Unknown patient for ${st.name}`);
      if (st.bindings.prop && !s.props.some((p) => p.id === st.bindings.prop))
        issue(`Unknown prop for ${st.name}`);
      if (
        st.module === "ordnance" &&
        !s.props.some((p) => p.id === st.bindings.prop && p.kind === "ordnance")
      )
        issue(`Ordnance module needs an ordnance prop for ${st.name}`);
      if (
        st.module === "beacon" &&
        !s.props.some((p) => p.id === st.bindings.prop && p.kind === "beacon")
      )
        issue(`Beacon module needs a beacon prop for ${st.name}`);
    }
    for (const st of s.stations)
      if (st.role === "hq" && st.module !== "tracking")
        issue(`HQ ${st.name} must use the tracking module`);
    for (const p of s.patients) {
      if (
        p.overrides.sys !== undefined &&
        p.overrides.dia !== undefined &&
        p.overrides.dia > p.overrides.sys
      )
        issue(`Invalid blood pressure for ${p.name}`);
      if (
        p.kind === "arrest" &&
        (p.overrides.hr || p.overrides.rr || p.overrides.sys || p.overrides.dia)
      )
        issue(`Arrest cannot have a pulse or blood pressure for ${p.name}`);
    }
    for (const rule of s.injects) {
      const station = s.stations.find((st) => st.id === rule.station);
      if (
        rule.trigger === "signal" &&
        !(moduleEvents[station?.module || ""] || []).includes(rule.intervention)
      )
        issue(`Unsupported module event for ${rule.name}`);
      if (rule.trigger === "zone" && !station?.player)
        issue(`GPS trigger requires a player station for ${rule.name}`);
      if (rule.trigger === "intervention" && station?.module !== "medical")
        issue(`Intervention requires a medical station for ${rule.name}`);
      if (
        rule.trigger === "prop" &&
        !["countdown", "access", "lock"].includes(station?.module || "")
      )
        issue(`Prop trigger requires a terminal station for ${rule.name}`);
      if (rule.unless && station?.module !== "medical")
        issue(
          `Treatment exception requires a medical station for ${rule.name}`,
        );
      if (
        !["timer", "manual"].includes(rule.trigger) &&
        !s.stations.some((st) => st.id === rule.station)
      )
        issue(`Station missing for ${rule.name}`);
      if (rule.trigger === "zone" && !s.zones.some((z) => z.id === rule.zone))
        issue(`Zone missing for ${rule.name}`);
      for (const a of rule.actions) {
        const rows =
          a.type === "patient"
            ? s.patients
            : a.type === "release"
              ? s.dossiers
              : a.type === "objective"
                ? s.objectives
                : a.type === "camera"
                  ? s.stations.filter((st) => st.module === "camera")
                  : a.type === "prop"
                    ? s.props
                    : null;
        if (
          rows &&
          a.type !== "message" &&
          !rows.some((r) => r.id === a.target)
        )
          issue(`Target missing for ${rule.name}`);
      }
    }
    for (const w of s.workflows) {
      const trigger = w.trigger;
      if (trigger.type === "prop") {
        const prop = s.props.find((p) => p.id === trigger.prop);
        if (!prop) issue(`Unknown prop for ${w.name}`);
        else if (!prop.states.includes(trigger.to))
          issue(`Unknown prop state for ${w.name}`);
      }
      for (const n of w.nodes) {
        if (
          n.type === "show-surface" &&
          !s.stations.some((st) => st.id === n.station)
        )
          issue(`Station missing for ${w.name}`);
        if (n.type === "set-prop-state") {
          const prop = s.props.find((p) => p.id === n.prop);
          if (!prop) issue(`Unknown prop for ${w.name}`);
          else if (!prop.states.includes(n.state))
            issue(`Unknown prop state for ${w.name}`);
        }
        if (
          n.type === "complete-objective" &&
          !s.objectives.some((o) => o.id === n.objective)
        )
          issue(`Objective missing for ${w.name}`);
        if (
          n.type === "task" &&
          (n.task === "wait-for-event" || n.task === "connect")
        ) {
          const prop = String(n.config.prop ?? "");
          if (prop) {
            const row = s.props.find((p) => p.id === prop);
            if (!row) issue(`Unknown prop for ${w.name}`);
            else if (
              String(n.config.to ?? "") &&
              !row.states.includes(String(n.config.to))
            )
              issue(`Unknown prop state for ${w.name}`);
          }
        }
      }
    }
  });
// Migration: read v1 (`scene`/`entityId`/`rules`) and any alias form, always emit v2.
function normalizeScenario(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  const raw = input as Record<string, unknown>;
  const rawStations = Array.isArray(raw.stations) ? raw.stations : [];
  const stations = rawStations.map((value) => {
    if (!value || typeof value !== "object") return value;
    const st = { ...(value as Record<string, unknown>) };
    const module = st.module ?? st.scene;
    delete st.scene;
    const bindings =
      st.bindings && typeof st.bindings === "object"
        ? { ...(st.bindings as Record<string, unknown>) }
        : {};
    if (typeof st.entityId === "string" && st.entityId)
      bindings.patient = st.entityId;
    delete st.entityId;
    return {
      ...st,
      module: module === "corporate" ? "intranet" : module,
      bindings,
    };
  });
  const injects = Array.isArray(raw.injects)
    ? raw.injects
    : Array.isArray(raw.rules)
      ? raw.rules
      : [];
  const next: Record<string, unknown> = {
    ...raw,
    version: 2,
    stations,
    injects,
  };
  delete next.rules;
  // Scenarios saved before `type` existed get a best-effort type; it is
  // persisted on the next save so the type stays stable afterwards.
  if (!isScenarioType(next.type)) next.type = inferScenarioType(next);
  return next;
}
export const scenarioSchema = z.preprocess(normalizeScenario, scenarioV2Schema);
export type Scenario = z.infer<typeof scenarioSchema>;
export type TrainingStation = Scenario["stations"][number];
export type TrainingPatient = Scenario["patients"][number];
export type TrainingDossier = Scenario["dossiers"][number];
export type Inject = Scenario["injects"][number];
export type Action = z.infer<typeof actionSchema>;
export type Position = z.infer<typeof pointSchema> & {
  accuracy: number;
  timestamp: number;
  received: number;
};
export type TrainingState = {
  room: string;
  scenario: Scenario;
  clock: number;
  frozen: boolean;
  phase: Phase;
  revision: number;
  fired: string[];
  interventions: Record<string, string[]>;
  moduleEvents: Record<string, string[]>;
  positions: Record<string, Position>;
  cameraOffline: Record<string, boolean>;
  completed: string[];
  props: Record<string, boolean>;
  propStates: Record<string, string>;
  workflows: Record<string, WorkflowInstance>;
  // Projection-only: the prop triggers of workflows relevant to a field
  // station, so the device can offer the simulated connection action.
  workflowTriggers?: { id: string; name: string; trigger: Workflow["trigger"] }[];
  log: { at: number; message: string }[];
  notes: { at: number; role: string; text: string }[];
  messages: { at: number; from: string; to: string; text: string }[];
  presence: Record<string, { online: boolean; lastSeen: number }>;
};
export function newState(
  room: string,
  scenario = template("sar"),
): TrainingState {
  return {
    room,
    scenario,
    clock: 0,
    frozen: true,
    phase: "ready",
    revision: 0,
    fired: [],
    interventions: {},
    moduleEvents: {},
    positions: {},
    cameraOffline: {},
    completed: [],
    props: {},
    propStates: Object.fromEntries(scenario.props.map((p) => [p.id, p.initial])),
    workflows: {},
    log: [],
    notes: [],
    messages: [],
    presence: {},
  };
}
const defaultMap = {
  lat: 51.23,
  lng: 6.78,
  zoom: 15,
  tiles: "",
  attribution: "",
};

// A valid, empty scenario of a type. Used when the user starts a new scenario
// from the guided surface; every collection stays present and empty.
export function blankScenario(type: ScenarioType = "custom"): Scenario {
  return scenarioSchema.parse({
    version: 2,
    type,
    name: "New scenario",
    mode: type === "film" ? "PLAYBACK" : "LIVE",
    seed: 2048,
    map: defaultMap,
    stations: [],
  });
}

export function template(
  kind: "sar" | "medical" | "film" | "airsoft",
): Scenario {
  const medical = {
    id: "patient-1",
    name: "Patient 01",
    kind: "stable" as const,
    since: 0,
  };
  return scenarioSchema.parse({
    version: 2,
    name: {
      sar: "Search & Rescue",
      medical: "Medical exercise",
      film: "Film playback",
      airsoft: "Airsoft field exercise",
    }[kind],
    mode: kind === "film" ? "PLAYBACK" : "LIVE",
    type: { sar: "field", medical: "medical", film: "film", airsoft: "field" }[
      kind
    ],
    // Search & rescue carries a casualty even though `field` hides patients.
    capabilities: kind === "sar" ? { patients: true } : {},
    seed: 2048,
    map: {
      lat: 51.23,
      lng: 6.78,
      zoom: 15,
      tiles: "",
      attribution: "",
    },
    stations: [
      { id: "hq", name: "Headquarters", role: "hq", module: "tracking" },
      {
        id: "med-1",
        name: "Medic 01",
        role: "element",
        module: "medical",
        bindings: { patient: medical.id },
      },
      {
        id: "player-1",
        name: "Alpha 01",
        role: "element",
        module: "tracking",
        player: true,
        route: [
          { lat: 51.23, lng: 6.78 },
          { lat: 51.233, lng: 6.786 },
        ],
      },
      { id: "cam-1", name: "Camera 01", role: "element", module: "camera" },
      {
        id: "prop-1",
        name: "Sequence terminal",
        role: "element",
        module: "countdown",
      },
      {
        id: "files-1",
        name: "Intelligence",
        role: "element",
        module: "terminal",
      },
    ],
    patients: [medical],
    dossiers: [],
    zones: [
      {
        id: "zone-1",
        name: "Search sector",
        lat: 51.233,
        lng: 6.786,
        radius: 100,
      },
    ],
    objectives: [{ id: "objective-1", name: "Locate and report casualty" }],
    injects: [
      {
        id: "rule-1",
        name: "Deterioration after 3 minutes unless treated",
        trigger: "timer",
        at: 180,
        station: "med-1",
        unless: "treated",
        actions: [{ type: "patient", target: medical.id, kind: "desat" }],
      },
    ],
  });
}
export function logEvent(s: TrainingState, message: string) {
  s.log = [...s.log, { at: s.clock, message }].slice(-300);
}
export function setProp(s: TrainingState, propId: string, state: string) {
  const prop = s.scenario.props.find((p) => p.id === propId);
  if (!prop || !prop.states.includes(state)) return false;
  s.propStates[propId] = state;
  logEvent(s, `${prop.name}: ${state}`);
  return true;
}
export function act(s: TrainingState, a: Action) {
  if (a.type === "patient") {
    const p = s.scenario.patients.find((p) => p.id === a.target);
    if (p) {
      p.kind = a.kind;
      p.since = s.clock;
      p.overrides = {};
    }
  }
  if (a.type === "release") {
    const d = s.scenario.dossiers.find((d) => d.id === a.target);
    if (d) d.released = true;
  }
  if (a.type === "camera") s.cameraOffline[a.target] = a.offline;
  if (a.type === "prop") setProp(s, a.target, a.state);
  if (a.type === "objective" && !s.completed.includes(a.target))
    s.completed.push(a.target);
  logEvent(s, a.type === "message" ? a.text : `${a.type}: ${a.target}`);
}
export function distance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const rad = Math.PI / 180,
    dlat = (b.lat - a.lat) * rad,
    dlng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dlng / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
export function dueAt(rule: Inject, seed: number) {
  let hash = seed;
  for (const ch of rule.id) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619);
  const base = rule.scheduledAt ?? rule.at;
  return base + ((hash >>> 0) / 4294967296) * rule.jitter;
}
export function evaluate(
  s: TrainingState,
  event?: {
    type: "zone" | "intervention" | "prop" | "signal";
    station: string;
    value?: string;
  },
  now = Date.now(),
) {
  if (s.frozen) return;
  for (const r of s.scenario.injects) {
    if (!r.enabled || s.fired.includes(r.id)) continue;
    let ready = r.trigger === "timer" && s.clock >= dueAt(r, s.scenario.seed);
    if (event && event.type === r.trigger && event.station === r.station) {
      if (r.trigger === "signal") ready = r.intervention === event.value;
      if (r.trigger === "intervention") ready = r.intervention === event.value;
      if (r.trigger === "prop") ready = true;
      if (r.trigger === "zone") {
        const pos = s.positions[r.station],
          zone = s.scenario.zones.find((z) => z.id === r.zone);
        ready =
          !!pos &&
          !!zone &&
          now - pos.timestamp < 15000 &&
          distance(pos, zone) + pos.accuracy <= zone.radius;
      }
    }
    if (!ready) continue;
    s.fired.push(r.id);
    if (r.unless && s.interventions[r.station]?.includes(r.unless)) {
      logEvent(s, `Skipped: ${r.name}`);
      continue;
    }
    logEvent(s, `Event: ${r.name}`);
    r.actions.forEach((a) => act(s, a));
  }
}
export function advance(s: TrainingState, delta: number, now = Date.now()) {
  if (s.frozen) return;
  s.clock += Math.max(0, Math.min(delta, 2));
  if (s.scenario.mode === "PLAYBACK")
    for (const st of s.scenario.stations) {
      if (!st.player || st.route.length < 2) continue;
      const progress = Math.min(s.clock / 300, 1) * (st.route.length - 1),
        i = Math.min(Math.floor(progress), st.route.length - 2),
        f = progress - i;
      const a = st.route[i],
        b = st.route[i + 1];
      s.positions[st.id] = {
        lat: a.lat + (b.lat - a.lat) * f,
        lng: a.lng + (b.lng - a.lng) * f,
        accuracy: 0,
        timestamp: now,
        received: now,
      };
      evaluate(s, { type: "zone", station: st.id }, now);
    }
  evaluate(s, undefined, now);
}
// Instances a station may interact with: the workflow's surface targets the
// station, its trigger or active task uses the station's prop, or the workflow
// triggers on that prop.
export function stationWorkflowInstances(
  s: TrainingState,
  station: string,
): WorkflowInstance[] {
  const st = s.scenario.stations.find((row) => row.id === station);
  const bound = st?.bindings.prop ?? "";
  return Object.values(s.workflows).filter((instance) => {
    if (instance.surface?.station === station) return true;
    if (!bound) return false;
    const workflow = s.scenario.workflows.find(
      (w) => w.id === instance.workflowId,
    );
    if (!workflow) return false;
    if (workflow.trigger.type === "prop" && workflow.trigger.prop === bound)
      return true;
    const activeTask = activeTaskOf(workflow, instance);
    return activeTask
      ? String(activeTask.config.prop ?? "") === bound
      : false;
  });
}

// Player input for the station's active task. Returns no events when no task
// is active, so stale or duplicate input never produces a second effect.
export function interactionEvents(
  s: TrainingState,
  station: string,
  value: string,
): WorkflowEvent[] {
  const code =
    s.scenario.stations.find((row) => row.id === station)?.code || "";
  for (const instance of stationWorkflowInstances(s, station)) {
    if (instance.status !== "running") continue;
    const workflow = s.scenario.workflows.find(
      (w) => w.id === instance.workflowId,
    );
    if (!workflow) continue;
    const events = evaluateWorkflow(
      workflow,
      instance,
      { type: "interaction", value },
      s.clock,
      code,
    );
    if (events.length) return events;
  }
  return [];
}

// Prop changes advance waiting tasks (`wait-for-event`, `connect`) across all
// running instances. Called by the server for every prop change.
export function workflowPropEvents(
  s: TrainingState,
  prop: string,
  state: string,
  clock: number,
): WorkflowEvent[] {
  const events: WorkflowEvent[] = [];
  for (const instance of Object.values(s.workflows)) {
    if (instance.status !== "running") continue;
    const workflow = s.scenario.workflows.find(
      (w) => w.id === instance.workflowId,
    );
    if (!workflow) continue;
    events.push(
      ...evaluateWorkflow(
        workflow,
        instance,
        { type: "prop", prop, state },
        clock,
      ),
    );
  }
  return events;
}

// Starts one workflow instance; empty when unknown or already running.
export function workflowStartEvents(
  s: TrainingState,
  workflowId: string,
  clock: number,
): WorkflowEvent[] {
  const workflow = s.scenario.workflows.find((w) => w.id === workflowId);
  if (!workflow || s.workflows[workflow.id]) return [];
  return startWorkflow(workflow, workflow.id, clock);
}

// Deterministic instance id: one run per workflow per exercise.
export function workflowStartsForProp(
  s: TrainingState,
  prop: string,
  to: string,
  clock: number,
): WorkflowEvent[] {
  const events: WorkflowEvent[] = [];
  for (const workflow of s.scenario.workflows) {
    if (
      workflow.trigger.type !== "prop" ||
      workflow.trigger.prop !== prop ||
      workflow.trigger.to !== to
    )
      continue;
    events.push(...workflowStartEvents(s, workflow.id, clock));
  }
  return events;
}

export function workflowTick(s: TrainingState, clock: number): WorkflowEvent[] {
  const events: WorkflowEvent[] = [];
  for (const instance of Object.values(s.workflows)) {
    if (instance.status !== "running") continue;
    const workflow = s.scenario.workflows.find(
      (w) => w.id === instance.workflowId,
    );
    if (!workflow) continue;
    events.push(...advanceWorkflow(workflow, instance, clock));
  }
  return events;
}

function redactProjectedInstances(
  s: TrainingState,
  keep?: Set<string>,
): Record<string, WorkflowInstance> {
  return Object.fromEntries(
    Object.entries(s.workflows)
      .filter(([key]) => !keep || keep.has(key))
      .map(([key, instance]) => {
        const workflow = s.scenario.workflows.find(
          (w) => w.id === instance.workflowId,
        );
        if (!workflow) return [key, instance];
        const redacted = redactInstanceSecrets(workflow, instance);
        const activeTask = activeTaskOf(workflow, instance);
        return [key, activeTask ? { ...redacted, activeTask } : redacted];
      }),
  );
}

// Do not send trainer secrets, hidden injects, locked dossiers or other teams' locations to field devices.
export function projectState(
  s: TrainingState,
  role: "trainer" | "hq" | "element" | "safety" | "assessor",
  station = "",
): TrainingState {
  const out = structuredClone(s);
  if (role === "trainer" || role === "safety") return out;
  if (role === "assessor") {
    out.scenario.stations.forEach((st) => {
      st.code = "";
    });
    out.scenario.workflows = out.scenario.workflows.map(redactWorkflowSecrets);
    out.workflows = redactProjectedInstances(out);
    return out;
  }
  const visibleInstances =
    role === "element"
      ? new Set(stationWorkflowInstances(s, station).map((i) => i.id))
      : undefined;
  out.workflows = redactProjectedInstances(out, visibleInstances);
  out.scenario.injects = [];
  out.scenario.workflows = [];
  out.scenario.stations.forEach((st) => {
    st.code = "";
    st.route = [];
  });
  out.scenario.dossiers = out.scenario.dossiers.filter((d) => d.released);
  out.fired = [];
  out.interventions =
    role === "element" ? { [station]: out.interventions[station] || [] } : {};
  if (role === "element")
    out.moduleEvents = { [station]: out.moduleEvents?.[station] || [] };
  out.log = out.log.filter(
    (e) => !e.message.startsWith("Skipped:") && !e.message.startsWith("Event:"),
  );
  if (role === "hq" || role === "element")
    out.messages = out.messages.filter(
      (m) => m.to === "all" || m.to === (role === "hq" ? "hq" : station),
    );
  if (role === "element") {
    const st = s.scenario.stations.find((st) => st.id === station);
    out.workflowTriggers = s.scenario.workflows
      .filter(
        (w) => w.trigger.type === "prop" && w.trigger.prop === st?.bindings.prop,
      )
      .map((w) => ({ id: w.id, name: w.name, trigger: w.trigger }));
    out.scenario.stations = out.scenario.stations.filter(
      (row) => row.id === station || (row.player && row.team === st?.team),
    );
    out.scenario.patients = out.scenario.patients.filter(
      (p) => p.id === st?.bindings.patient,
    );
    out.positions = Object.fromEntries(
      Object.entries(out.positions).filter(([key]) =>
        out.scenario.stations.some((row) => row.id === key),
      ),
    );
    out.presence = Object.fromEntries(
      Object.entries(out.presence).filter(([key]) =>
        out.scenario.stations.some((row) => row.id === key),
      ),
    );
    out.log = [];
  }
  return out;
}
