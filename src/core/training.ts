import { z } from "zod";

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
  "terminal",
  "countdown",
  "access",
  "comms",
  "corporate",
  "hologram",
  "lock",
  "slide",
  "ordnance",
  "beacon",
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
  corporate: ["identity.confirmed"],
  ordnance: ["ordnance.stage", "ordnance.disarmed", "ordnance.tampered"],
  beacon: ["beacon.active", "beacon.lost"],
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
});
export const propSchema = z.object({
  id,
  kind: z.enum(propKinds),
  name: label,
  states: z.array(z.string().max(40)).min(1).max(20).default(["off", "on"]),
  initial: z.string().max(40).default("off"),
  visible: z.boolean().default(true),
});
export const teamSchema = z.object({
  id,
  name: label,
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .default("#80dce5"),
});
export const actorSchema = z.object({
  id,
  name: label,
  character: z.string().max(120).default(""),
  briefing: text.default(""),
  dossierId: z.string().max(40).default(""),
});
export const zoneSchema = pointSchema.extend({
  id,
  name: label,
  radius: finite.min(5).max(10000),
});
export const objectiveSchema = z.object({ id, name: label });
export const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("patient"), target: id, kind: z.enum(kinds) }),
  z.object({ type: z.literal("release"), target: id }),
  z.object({ type: z.literal("camera"), target: id, offline: z.boolean() }),
  z.object({ type: z.literal("objective"), target: id }),
  z.object({ type: z.literal("message"), text: label }),
  z.object({ type: z.literal("prop"), target: id, state: z.string().max(40) }),
]);
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
});
const scenarioV2Schema = z
  .object({
    version: z.literal(2),
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
    ])
      if (new Set(rows.map((x) => x.id)).size !== rows.length)
        issue("IDs must be unique within each collection");
    for (const st of s.stations) {
      if (
        st.module === "medical" &&
        !s.patients.some((p) => p.id === st.bindings.patient)
      )
        issue(`Patient missing for ${st.name}`);
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
    return { ...st, module, bindings };
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
  positions: Record<string, Position>;
  cameraOffline: Record<string, boolean>;
  completed: string[];
  props: Record<string, boolean>;
  propStates: Record<string, string>;
  log: { at: number; message: string }[];
  notes: { at: number; role: string; text: string }[];
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
    positions: {},
    cameraOffline: {},
    completed: [],
    props: {},
    propStates: Object.fromEntries(scenario.props.map((p) => [p.id, p.initial])),
    log: [],
    notes: [],
    presence: {},
  };
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
  return rule.at + ((hash >>> 0) / 4294967296) * rule.jitter;
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
    return out;
  }
  out.scenario.injects = [];
  out.scenario.stations.forEach((st) => {
    st.code = "";
    st.route = [];
  });
  out.scenario.dossiers = out.scenario.dossiers.filter((d) => d.released);
  out.fired = [];
  out.interventions =
    role === "element" ? { [station]: out.interventions[station] || [] } : {};
  out.log = out.log.filter(
    (e) => !e.message.startsWith("Skipped:") && !e.message.startsWith("Event:"),
  );
  if (role === "element") {
    const st = s.scenario.stations.find((st) => st.id === station);
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
