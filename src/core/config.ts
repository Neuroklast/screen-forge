import { z } from "zod";
import { stageFormatIds } from "./stage.ts";
export const sceneIds = [
  "intranet",
  "os",
  "terminal",
  "countdown",
  "tracking",
  "hologram",
  "lock",
  "access",
  "medical",
  "camera",
  "comms",
  "slide",
  "clock",
  "rotary",
  "code-table",
  "data-sheet",
] as const;
export type SceneId = (typeof sceneIds)[number];
const overlaySchema = z.object({
  scanlines: z.number().min(0).max(1).default(0.35),
  glow: z.number().min(0).max(1).default(0.25),
  grid: z.number().min(0).max(1).default(0.15),
  grain: z.number().min(0).max(1).default(0.12),
  vignette: z.number().min(0).max(1).default(0.3),
  glitch: z.number().min(0).max(1).default(0.2),
  chromatic: z.number().min(0).max(1).default(0.15),
});
export const paletteSchema = z.object({
  background: z.string().regex(/^#[0-9a-f]{6}$/i),
  surface: z.string().regex(/^#[0-9a-f]{6}$/i),
  text: z.string().regex(/^#[0-9a-f]{6}$/i),
  secondary: z.string().regex(/^#[0-9a-f]{6}$/i),
});
export function scenePalette(scene: SceneId) {
  return scene === "intranet"
    ? {
        background: "#f4f3f0",
        surface: "#e4e3df",
        text: "#151515",
        secondary: "#62636b",
      }
    : {
        background: "#080d12",
        surface: "#0e171f",
        text: "#d6e2e5",
        secondary: "#80dce5",
      };
}
const osApps = [
  "overview",
  "terminal",
  "files",
  "personnel",
  "clusters",
  "dimension",
  "messages",
  "sequences",
] as const;
export function sceneOptionsDefaults() {
  return {
    os: {
      startupApp: "overview" as const,
      sequenceScale: 1,
      photoOverlay: 0.3,
      density: "compact" as const,
      sounds: true,
      login: {
        enabled: false,
        hackable: false,
        biometric: false,
        user: "operator",
        pass: "2048",
      },
    },
    terminal: {
      preset: "",
      goal: "Bypass login",
      prompt: "relay-07",
      actorMode: true,
      script: "inspect relay --sector 07 --verify",
      commandsUntilSuccess: 4,
      successText: "Access bypassed.",
      steps: [] as { command: string; outputs: string[]; hint: string }[],
    },
    intranet: { startApp: "overview" as const, sounds: true },
    countdown: {
      type: "bomb" as const,
      variant: "antimatter" as const,
      label: "",
      // The same console can show a countdown or a depleting resource (battery).
      display: "countdown" as const,
      unit: "%",
      warnAt: 50,
      criticalAt: 25,
    },
    tracking: { mode: "sensor" as const, callsign: "SENSOR 07" },
    analysis: {
      mode: "reconstruct" as const,
      input: "",
      result: "",
      key: "",
    },
    lock: { attempts: 3, animations: true },
    medical: { trends: true, alarms: true },
    slide: { stages: 1 },
    clock: { mode: "mission" as const, analog: false, label: "" },
    rotary: { dials: 3 },
    codeTable: { groupSize: 4, message: "RELAY" },
    dataSheet: {
      subject: "countdown" as const,
      title: "",
      image: "",
      search: [] as string[],
      archive: [] as {
        code: string;
        name: string;
        body: string;
        correct: boolean;
      }[],
      lines: [] as string[],
      steps: [] as string[],
      relayText: "",
    },
  };
}
export const sceneOptionsSchema = z.object({
  os: z
    .object({
      startupApp: z.enum(osApps).default("overview"),
      sequenceScale: z.number().min(0.25).max(4).default(1),
      photoOverlay: z.number().min(0).max(1).default(0.3),
      density: z.enum(["compact", "roomy"]).default("compact"),
      sounds: z.boolean().default(true),
      login: z
        .object({
          enabled: z.boolean().default(false),
          hackable: z.boolean().default(false),
          biometric: z.boolean().default(false),
          user: z.string().max(40).default("operator"),
          pass: z.string().max(40).default("2048"),
        })
        .default({
          enabled: false,
          hackable: false,
          biometric: false,
          user: "operator",
          pass: "2048",
        }),
    })
    .default(() => sceneOptionsDefaults().os),
  terminal: z
    .object({
      preset: z.string().max(40).default(""),
      goal: z.string().max(60).default("Bypass login"),
      prompt: z.string().max(40).default("relay-07"),
      actorMode: z.boolean().default(true),
      script: z.string().max(300).default(""),
      commandsUntilSuccess: z.number().int().min(1).max(40).default(4),
      successText: z.string().max(200).default("Access bypassed."),
      steps: z
        .array(
          z.object({
            command: z.string().max(120),
            outputs: z.array(z.string().max(200)).max(6).default([]),
            hint: z.string().max(120).default(""),
          }),
        )
        .max(20)
        .default([]),
    })
    .default(() => sceneOptionsDefaults().terminal),
  intranet: z
    .object({
      startApp: z
        .enum(["overview", "personnel", "archive", "diagnostics"])
        .default("overview"),
      sounds: z.boolean().default(true),
    })
    .default(() => sceneOptionsDefaults().intranet),
  countdown: z
    .object({
      type: z.enum(["transfer", "bomb", "reactor", "custom"]).default("bomb"),
      variant: z.enum(["antimatter", "nuclear"]).default("antimatter"),
      label: z.string().max(40).default(""),
      display: z.enum(["countdown", "battery"]).default("countdown"),
      unit: z.string().max(8).default("%"),
      warnAt: z.number().min(0).max(100).default(50),
      criticalAt: z.number().min(0).max(100).default(25),
    })
    .default(() => sceneOptionsDefaults().countdown),
  tracking: z
    .object({
      mode: z.enum(["sensor", "drone"]).default("sensor"),
      callsign: z.string().max(24).default("SENSOR 07"),
    })
    .default(() => sceneOptionsDefaults().tracking),
  analysis: z
    .object({
      mode: z.enum(["reconstruct", "decrypt", "data"]).default("reconstruct"),
      input: z.string().max(400).default(""),
      result: z.string().max(400).default(""),
      key: z.string().max(40).default(""),
    })
    .default(() => sceneOptionsDefaults().analysis),
  lock: z
    .object({
      attempts: z.number().int().min(1).max(9).default(3),
      animations: z.boolean().default(true),
    })
    .default(() => sceneOptionsDefaults().lock),
  medical: z
    .object({
      trends: z.boolean().default(true),
      alarms: z.boolean().default(true),
    })
    .default(() => sceneOptionsDefaults().medical),
  slide: z
    .object({ stages: z.number().int().min(1).max(4).default(1) })
    .default(() => sceneOptionsDefaults().slide),
  clock: z
    .object({
      mode: z
        .enum(["mission", "wall", "zones", "countdown", "schedule"])
        .default("mission"),
      analog: z.boolean().default(false),
      label: z.string().max(40).default(""),
    })
    .default(() => sceneOptionsDefaults().clock),
  rotary: z
    .object({ dials: z.number().int().min(1).max(4).default(3) })
    .default(() => sceneOptionsDefaults().rotary),
  codeTable: z
    .object({
      groupSize: z.number().int().min(1).max(8).default(4),
      message: z.string().max(60).default("RELAY"),
    })
    .default(() => sceneOptionsDefaults().codeTable),
  dataSheet: z
    .object({
      subject: z
        .enum(["countdown", "terminal", "access", "custom"])
        .default("countdown"),
      title: z.string().max(60).default(""),
      image: z.string().max(200).default(""),
      search: z.array(z.string().max(40)).max(8).default([]),
      archive: z
        .array(
          z.object({
            code: z.string().max(20),
            name: z.string().max(80),
            body: z.string().max(240).default(""),
            correct: z.boolean().default(false),
          }),
        )
        .max(24)
        .default([]),
      lines: z.array(z.string().max(120)).max(24).default([]),
      steps: z.array(z.string().max(160)).max(24).default([]),
      relayText: z.string().max(200).default(""),
    })
    .default(() => sceneOptionsDefaults().dataSheet),
});
const configSchema = z.object({
  version: z.literal(2),
  palette: paletteSchema.optional(),
  mediaIds: z.array(z.string().max(80)).max(100).default([]),
  pin: z
    .string()
    .regex(/^[A-Za-z0-9]{4,8}$/)
    .default("2048"),
  pinEnabled: z.boolean().default(false),
  pinMode: z.enum(["numeric", "alphanumeric"]).default("numeric"),
  pinFake: z.boolean().default(false),
  pinTitle: z.string().trim().min(1).max(40).default("Maintenance login"),
  sound: z.boolean().default(true),
  font: z
    .enum([
      "space",
      "matrix",
      "matrixDisplay",
      "digit7",
      "digit14",
      "digit16",
      "gridtile",
      "binary",
    ])
    .default("space"),
  tokens: z
    .record(
      z.string().regex(/^--sf-[a-z0-9-]+$/),
      z
        .string()
        .max(100)
        .regex(/^[#a-zA-Z0-9.,% ()+\/-]+$/),
    )
    .default({}),
  sceneOptions: sceneOptionsSchema.default(() => sceneOptionsDefaults()),
  skin: z.enum(["standard", "cyberdeck"]).default("standard"),
  brand: z
    .object({
      mark: z
          .enum([
            "default",
            "umbrella",
            "hex",
            "orbital",
            "atom",
            "triad",
            "plate",
            "ridge",
          ])
        .default("default"),
      logo: z
        .string()
        .max(180000)
        .refine(
          (s) =>
            s === "" ||
            /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(s),
        )
        .default(""),
    })
    .optional(),
  scene: z.enum(sceneIds),
  company: z.string().max(40).default(""),
  theme: z.string().max(40).default(""),
  title: z.string().trim().min(1).max(40),
  subtitle: z.string().max(70),
  identifier: z.string().max(24),
  accent: z.string().regex(/^#[0-9a-f]{6}$/i),
  mood: z.enum(["clinical", "tense", "damaged"]),
  effects: z.number().min(0).max(1),
  density: z.enum(["focused", "detailed"]),
  format: z.enum(stageFormatIds).default("16-9"),
  workspace: z.enum(["film", "rehearsal"]).default("film"),
  instructorPin: z
    .string()
    .regex(/^[A-Za-z0-9]{4,8}$/)
    .default("2048"),
  exerciseMark: z.boolean().default(false),
  frame: z
    .object({
      style: z.enum(["none", "hud", "plate"]).default("hud"),
      corners: z.boolean().default(true),
      labels: z.boolean().default(true),
    })
    .default({ style: "hud", corners: true, labels: true }),
  duration: z.number().int().min(1).max(35999),
  brightness: z.number().min(0.5).max(1.25),
  seed: z.number().int().min(1).max(99999),
  overlays: overlaySchema.default(() => overlaySchema.parse({})),
});
// Migration: legacy flat fields (osApp, device, actorMode, script, commandsUntilSuccess, sequenceScale)
// move into sceneOptions so old presets and localStorage configs keep working.
function normalizeConfig(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  const raw = { ...(input as Record<string, unknown>) };
  // Config v1: the `terminal` scene was the operating system. Split: v1 `terminal` -> `os`;
  // the new command-line scene keeps the id `terminal` from v2 on.
  if (raw.version === 1 || raw.version === undefined) {
    if (raw.scene === "terminal") raw.scene = "os";
    raw.version = 2;
  }
  // The studio work mode was named `training`, colliding with the exercise
  // product mode. It is now `rehearsal`; migrate persisted configs.
  if (raw.workspace === "training") raw.workspace = "rehearsal";
  // The scene id `corporate` was renamed to the functional `intranet` (brand
  // comes from the theme); migrate persisted configs and their scene options.
  if (raw.scene === "corporate") raw.scene = "intranet";
  const options = {
    ...(raw.sceneOptions && typeof raw.sceneOptions === "object"
      ? (raw.sceneOptions as Record<string, unknown>)
      : {}),
  };
  const os = {
    ...(options.os && typeof options.os === "object"
      ? (options.os as Record<string, unknown>)
      : {}),
  };
  if (raw.osApp !== undefined) os.startupApp = raw.osApp;
  if (raw.sequenceScale !== undefined) os.sequenceScale = raw.sequenceScale;
  options.os = os;
  const terminal = {
    ...(options.terminal && typeof options.terminal === "object"
      ? (options.terminal as Record<string, unknown>)
      : {}),
  };
  if (raw.actorMode !== undefined) terminal.actorMode = raw.actorMode;
  if (raw.script !== undefined) terminal.script = raw.script;
  if (raw.commandsUntilSuccess !== undefined)
    terminal.commandsUntilSuccess = raw.commandsUntilSuccess;
  options.terminal = terminal;
  const countdown = {
    ...(options.countdown && typeof options.countdown === "object"
      ? (options.countdown as Record<string, unknown>)
      : {}),
  };
  if (raw.device !== undefined) countdown.variant = raw.device;
  options.countdown = countdown;
  delete raw.osApp;
  delete raw.sequenceScale;
  delete raw.actorMode;
  delete raw.script;
  delete raw.commandsUntilSuccess;
  delete raw.device;
  if (options.corporate && !options.intranet)
    options.intranet = options.corporate;
  delete options.corporate;
  raw.sceneOptions = options;
  return raw;
}
export const schema = z.preprocess(normalizeConfig, configSchema);
export type Config = z.infer<typeof schema>;

// Presentation subset a scenario may bind to a station: the look and identity
// that must reach the field device. Excludes `scene`/`version`/`duration`/
// `seed`/`workspace`/`exerciseMark` (device decides those) and `mediaIds`/
// `brand` (uploaded media and logos live in the author's browser only).
export const scenePresetSchema = configSchema
  .pick({
    title: true,
    subtitle: true,
    identifier: true,
    accent: true,
    company: true,
    theme: true,
    palette: true,
    skin: true,
    font: true,
    mood: true,
    overlays: true,
    effects: true,
    brightness: true,
    tokens: true,
    sound: true,
    format: true,
    frame: true,
    sceneOptions: true,
    density: true,
  })
  .partial()
  .extend({ sceneOptions: sceneOptionsSchema.partial().optional() });
export type ScenePreset = z.infer<typeof scenePresetSchema>;

function mergeSceneOptions(
  base: Config["sceneOptions"],
  override?: Partial<Config["sceneOptions"]>,
): Config["sceneOptions"] {
  if (!override) return base;
  const out = { ...base };
  for (const key of Object.keys(override) as (keyof Config["sceneOptions"])[]) {
    const patch = override[key];
    if (patch === undefined) continue;
    Object.assign(out[key], patch);
  }
  return out;
}

// Builds the device config for a station: scene defaults overlaid with the
// scenario's presentation preset. Called by StageFrame for every field device.
export function presentationConfig(
  scene: SceneId,
  presentation?: { config?: ScenePreset } | null,
): Config {
  const base = defaults(scene);
  const preset = presentation?.config;
  if (!preset) return base;
  return {
    ...base,
    ...preset,
    overlays: { ...base.overlays, ...preset.overlays },
    sceneOptions: mergeSceneOptions(base.sceneOptions, preset.sceneOptions),
    frame: { ...base.frame, ...preset.frame },
    scene,
  };
}
export const scenes: {
  id: SceneId;
  name: string;
  code: string;
  description: string;
  accent: string;
  title: string;
  subtitle: string;
  kind: "scene" | "block";
}[] = [
  {
    id: "intranet",
    name: "Intranet",
    code: "01 / INSTITUTIONAL",
    description: "Company intranet: personnel, archive, diagnostics.",
    accent: "#cf233c",
    title: "VESPER",
    subtitle: "BIOLOGICAL RESEARCH DIVISION",
    kind: "scene",
  },
  {
    id: "os",
    name: "Operating System",
    code: "02 / SYSTEM",
    description: "Windows, apps, files. A workstation.",
    accent: "#f36c75",
    title: "BLACKLINE",
    subtitle: "OPERATING SYSTEM / LOCAL SESSION",
    kind: "scene",
  },
  {
    id: "terminal",
    name: "Terminal",
    code: "02b / SHELL",
    description: "Goal-driven command line.",
    accent: "#80dce5",
    title: "SHELL",
    subtitle: "COMMAND LINE / RELAY 07",
    kind: "scene",
  },
  {
    id: "countdown",
    name: "Countdown",
    code: "03 / DEVICE",
    description: "One clear time. A controlled escalation.",
    accent: "#ff8a62",
    title: "SEQUENCE CONTROL",
    subtitle: "AUTONOMOUS DEVICE / SERIES 09",
    kind: "scene",
  },
  {
    id: "tracking",
    name: "Orbital Tracking",
    code: "04 / TELEMETRY",
    description: "Target acquisition and synthetic telemetry.",
    accent: "#9ad9c0",
    title: "ORBITAL SURVEY",
    subtitle: "REMOTE OBSERVATION / SECTOR 07",
    kind: "scene",
  },
  {
    id: "hologram",
    name: "Analysis Table",
    code: "05 / SPATIAL",
    description: "Touch. Rotate. Recognise relationships.",
    accent: "#8acde8",
    title: "AEON",
    subtitle: "SPATIAL ANALYSIS ENVIRONMENT",
    kind: "scene",
  },
  {
    id: "lock",
    name: "Code Lock",
    code: "06 / ACCESS",
    description: "PIN pad. One building block.",
    accent: "#e10600",
    title: "ACCESS GATE",
    subtitle: "LOCAL AUTH / KEYPAD",
    kind: "block",
  },
  {
    id: "access",
    name: "Door Control",
    code: "07 / INTERLOCK",
    description: "Bolt. Hold to open.",
    accent: "#dfa943",
    title: "DOOR 02",
    subtitle: "INTERLOCK CONTROLLER",
    kind: "block",
  },
  {
    id: "medical",
    name: "Medical",
    code: "08 / CLINICAL",
    description: "Vitals. Keep the record.",
    accent: "#76fa96",
    title: "INFIRMARY",
    subtitle: "SITE MEDICAL / MED-01",
    kind: "block",
  },
  {
    id: "camera",
    name: "Camera",
    code: "09 / OPTICAL",
    description: "Four channels. Choose one.",
    accent: "#9ad9c0",
    title: "OPTICS",
    subtitle: "SITE CAMERA ARRAY",
    kind: "block",
  },
  {
    id: "comms",
    name: "Radio",
    code: "10 / COMMS",
    description: "Log and push-to-talk.",
    accent: "#78cce5",
    title: "RELAY",
    subtitle: "VOICE / DATA CHANNEL",
    kind: "block",
  },
  {
    id: "slide",
    name: "Slide",
    code: "11 / SLIDE",
    description: "Slide to release.",
    accent: "#80dce5",
    title: "SLIDE",
    subtitle: "GATE ALIGNMENT",
    kind: "block",
  },
  {
    id: "clock",
    name: "Clock",
    code: "12 / TIME",
    description: "Time, zones, schedule.",
    accent: "#80dce5",
    title: "TIME REFERENCE",
    subtitle: "MISSION / WALL / SCHEDULE",
    kind: "block",
  },
  {
    id: "rotary",
    name: "Rotary Dial",
    code: "13 / TUNE",
    description: "Align controls to target values.",
    accent: "#dfa943",
    title: "FIELD CONTROL",
    subtitle: "MANUAL ALIGNMENT",
    kind: "block",
  },
  {
    id: "code-table",
    name: "Code Table",
    code: "14 / CODE",
    description: "Decode the message and report.",
    accent: "#78cce5",
    title: "CODE TABLE",
    subtitle: "MESSAGE HANDLING",
    kind: "block",
  },
  {
    id: "data-sheet",
    name: "Data Sheet",
    code: "15 / DATA",
    description: "Schematic and disposal data to relay.",
    accent: "#e8b563",
    title: "TECHNICAL DATA SHEET",
    subtitle: "ORDNANCE / FICTIONAL",
    kind: "block",
  },
];
export function identityOf(config: Config): Pick<
  Config,
  | "title"
  | "subtitle"
  | "identifier"
  | "accent"
  | "brand"
  | "company"
  | "theme"
  | "palette"
  | "skin"
  | "font"
  | "mood"
  | "overlays"
  | "effects"
  | "brightness"
  | "mediaIds"
  | "tokens"
  | "pin"
  | "pinEnabled"
  | "pinMode"
  | "pinFake"
  | "pinTitle"
  | "sound"
  | "format"
  | "frame"
  | "sceneOptions"
  | "density"
  | "workspace"
  | "instructorPin"
  | "exerciseMark"
> {
  return {
    title: config.title,
    subtitle: config.subtitle,
    identifier: config.identifier,
    accent: config.accent,
    brand: config.brand,
    company: config.company,
    theme: config.theme,
    palette: config.palette,
    skin: config.skin,
    font: config.font,
    mood: config.mood,
    overlays: config.overlays,
    effects: config.effects,
    brightness: config.brightness,
    mediaIds: config.mediaIds,
    tokens: config.tokens,
    pin: config.pin,
    pinEnabled: config.pinEnabled,
    pinMode: config.pinMode,
    pinFake: config.pinFake,
    pinTitle: config.pinTitle,
    sound: config.sound,
    format: config.format,
    frame: config.frame,
    sceneOptions: config.sceneOptions,
    density: config.density,
    workspace: config.workspace,
    instructorPin: config.instructorPin,
    exerciseMark: config.exerciseMark,
  };
}
export function withScene(config: Config, scene: SceneId): Config {
  return { ...defaults(scene), ...identityOf(config), scene };
}
export function keepLook(current: Config, next: Config): Config {
  return { ...next, ...identityOf(current), scene: next.scene };
}
export function applyIdentity(
  config: Config,
  identity: Partial<
    Pick<Config, "title" | "subtitle" | "identifier" | "brand" | "company">
  >,
): Config {
  return {
    ...config,
    title: identity.title ?? config.title,
    subtitle: identity.subtitle ?? config.subtitle,
    identifier: identity.identifier ?? config.identifier,
    brand: identity.brand ?? config.brand,
    company: identity.company ?? config.company,
    scene: config.scene,
  };
}
export function applyTheme(
  config: Config,
  theme: Pick<
    Config,
    "palette" | "accent" | "mood" | "effects" | "overlays" | "font" | "tokens"
  > & { theme: string },
): Config {
  return {
    ...config,
    theme: theme.theme,
    palette: theme.palette,
    accent: theme.accent,
    mood: theme.mood,
    effects: theme.effects,
    overlays: theme.overlays,
    font: theme.font,
    tokens: theme.tokens,
    scene: config.scene,
  };
}
export function defaults(scene: SceneId = "intranet"): Config {
  const s = scenes.find((x) => x.id === scene)!;
  return {
    version: 2,
    mediaIds: [],
    pin: "2048",
    pinEnabled: false,
    pinMode: "numeric",
    pinFake: false,
    pinTitle: "Maintenance login",
    sound: true,
    font: "space",
    tokens: {},
    skin: "standard",
    sceneOptions: sceneOptionsDefaults(),
    scene,
    company: "",
    theme: "",
    title: s.title,
    subtitle: s.subtitle,
    identifier: "VS-204 / UNIT 07",
    accent: s.accent,
    mood: "clinical",
    effects: scene === "intranet" ? 0.45 : 0.8,
    density: "detailed",
    format: "16-9",
    workspace: "film",
    instructorPin: "2048",
    exerciseMark: false,
    frame: { style: "hud", corners: true, labels: true },
    duration: 180,
    brightness: 1,
    seed: 2048,
    overlays: overlaySchema.parse({}),
  };
}
export function loadConfig(): Config {
  try {
    return schema.parse(
      JSON.parse(localStorage.getItem("screenforge.config.v1") || "null"),
    );
  } catch {
    return defaults();
  }
}
export function downloadPreset(config: Config) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(config, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `screenforge-${config.scene}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
