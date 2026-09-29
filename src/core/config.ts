import { z } from "zod";
import { stageFormatIds } from "./stage";
export const sceneIds = [
  "corporate",
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
  return scene === "corporate"
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
export const schema = z.object({
  version: z.literal(1),
  palette: paletteSchema.optional(),
  mediaIds: z.array(z.string().max(80)).max(100).default([]),
  pin: z
    .string()
    .regex(/^[A-Za-z0-9]{4,8}$/)
    .default("2048"),
  pinEnabled: z.boolean().default(false),
  pinMode: z.enum(["numeric", "alphanumeric"]).default("numeric"),
  pinFake: z.boolean().default(false),
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
  device: z.enum(["antimatter", "nuclear"]).default("antimatter"),
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
  workspace: z.enum(["film", "training"]).default("film"),
  instructorPin: z
    .string()
    .regex(/^[A-Za-z0-9]{4,8}$/)
    .default("2048"),
  exerciseMark: z.boolean().default(false),
  osApp: z
    .enum([
      "overview",
      "terminal",
      "files",
      "personnel",
      "clusters",
      "dimension",
      "messages",
    ])
    .default("overview"),
  commandsUntilSuccess: z.number().int().min(1).max(40).default(4),
  frame: z
    .object({
      style: z.enum(["none", "hud", "plate"]).default("hud"),
      corners: z.boolean().default(true),
      labels: z.boolean().default(true),
    })
    .default({ style: "hud", corners: true, labels: true }),
  duration: z.number().int().min(1).max(35999),
  brightness: z.number().min(0.5).max(1.25),
  actorMode: z.boolean(),
  script: z.string().max(300),
  seed: z.number().int().min(1).max(99999),
  sequenceScale: z.number().min(0.25).max(4).default(1),
  overlays: overlaySchema.default(() => overlaySchema.parse({})),
});
export type Config = z.infer<typeof schema>;
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
    id: "corporate",
    name: "Konzernsystem",
    code: "01 / INSTITUTIONAL",
    description: "Klinische Ordnung. Kontrollierter Zugriff.",
    accent: "#cf233c",
    title: "VESPER",
    subtitle: "BIOLOGICAL RESEARCH DIVISION",
    kind: "scene",
  },
  {
    id: "terminal",
    name: "Netzwerkterminal",
    code: "02 / NETWORK",
    description: "BLACKLINE OS. Archive, Identitäten, Sequenzen.",
    accent: "#f36c75",
    title: "BLACKLINE",
    subtitle: "NETWORK OPERATIONS / LOCAL SESSION",
    kind: "scene",
  },
  {
    id: "countdown",
    name: "Countdown",
    code: "03 / DEVICE",
    description: "Eine klare Zeit. Eine kontrollierte Eskalation.",
    accent: "#ff8a62",
    title: "SEQUENCE CONTROL",
    subtitle: "AUTONOMOUS DEVICE / SERIES 09",
    kind: "scene",
  },
  {
    id: "tracking",
    name: "Orbital Tracking",
    code: "04 / TELEMETRY",
    description: "Zielerfassung und synthetische Telemetrie.",
    accent: "#9ad9c0",
    title: "ORBITAL SURVEY",
    subtitle: "REMOTE OBSERVATION / SECTOR 07",
    kind: "scene",
  },
  {
    id: "hologram",
    name: "Analysetisch",
    code: "05 / SPATIAL",
    description: "Berühren. Drehen. Zusammenhänge erkennen.",
    accent: "#8acde8",
    title: "AEON",
    subtitle: "SPATIAL ANALYSIS ENVIRONMENT",
    kind: "scene",
  },
  {
    id: "lock",
    name: "Codeschloss",
    code: "06 / ACCESS",
    description: "PIN-Feld. Ein Baustein.",
    accent: "#e10600",
    title: "ACCESS GATE",
    subtitle: "LOCAL AUTH / KEYPAD",
    kind: "block",
  },
  {
    id: "access",
    name: "Türsteuerung",
    code: "07 / INTERLOCK",
    description: "Riegel. Halten zum Öffnen.",
    accent: "#dfa943",
    title: "DOOR 02",
    subtitle: "INTERLOCK CONTROLLER",
    kind: "block",
  },
  {
    id: "medical",
    name: "Medizin",
    code: "08 / CLINICAL",
    description: "Vitalwerte. Protokoll halten.",
    accent: "#76fa96",
    title: "INFIRMARY",
    subtitle: "SITE MEDICAL / MED-01",
    kind: "block",
  },
  {
    id: "camera",
    name: "Kamera",
    code: "09 / OPTICAL",
    description: "Vier Kanäle. Einen wählen.",
    accent: "#9ad9c0",
    title: "OPTICS",
    subtitle: "SITE CAMERA ARRAY",
    kind: "block",
  },
  {
    id: "comms",
    name: "Funk",
    code: "10 / COMMS",
    description: "Log und Sprechtaste.",
    accent: "#78cce5",
    title: "RELAY",
    subtitle: "VOICE / DATA CHANNEL",
    kind: "block",
  },
  {
    id: "slide",
    name: "Schieber",
    code: "11 / SLIDE",
    description: "Schieben zum Freigeben.",
    accent: "#80dce5",
    title: "SLIDE",
    subtitle: "GATE ALIGNMENT",
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
  | "sound"
  | "format"
  | "frame"
  | "commandsUntilSuccess"
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
    sound: config.sound,
    format: config.format,
    frame: config.frame,
    commandsUntilSuccess: config.commandsUntilSuccess,
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
export function defaults(scene: SceneId = "corporate"): Config {
  const s = scenes.find((x) => x.id === scene)!;
  return {
    version: 1,
    mediaIds: [],
    pin: "2048",
    pinEnabled: false,
    pinMode: "numeric",
    pinFake: false,
    sound: true,
    font: "space",
    tokens: {},
    skin: "standard",
    device: "antimatter",
    scene,
    company: "",
    theme: "",
    title: s.title,
    subtitle: s.subtitle,
    identifier: "VS-204 / UNIT 07",
    accent: s.accent,
    mood: "clinical",
    effects: scene === "corporate" ? 0.45 : 0.8,
    density: "detailed",
    format: "16-9",
    workspace: "film",
    instructorPin: "2048",
    exerciseMark: false,
    osApp: "overview",
    commandsUntilSuccess: 4,
    frame: { style: "hud", corners: true, labels: true },
    duration: 180,
    brightness: 1,
    actorMode: true,
    script: "inspect relay --sector 07 --verify",
    seed: 2048,
    sequenceScale: 1,
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
