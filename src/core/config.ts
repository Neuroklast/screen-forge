import { z } from "zod";
export const sceneIds = [
  "corporate",
  "terminal",
  "countdown",
  "tracking",
  "hologram",
] as const;
export type SceneId = (typeof sceneIds)[number];
export const schema = z.object({
  version: z.literal(1),
  scene: z.enum(sceneIds),
  title: z.string().trim().min(1).max(40),
  subtitle: z.string().max(70),
  identifier: z.string().max(24),
  accent: z.string().regex(/^#[0-9a-f]{6}$/i),
  mood: z.enum(["clinical", "tense", "damaged"]),
  effects: z.number().min(0).max(1),
  density: z.enum(["focused", "detailed"]),
  duration: z.number().int().min(1).max(35999),
  brightness: z.number().min(0.5).max(1.25),
  actorMode: z.boolean(),
  script: z.string().max(300),
  seed: z.number().int().min(1).max(99999),
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
}[] = [
  {
    id: "corporate",
    name: "Konzernsystem",
    code: "01 / INSTITUTIONAL",
    description: "Klinische Ordnung. Kontrollierter Zugriff.",
    accent: "#cf233c",
    title: "VESPER",
    subtitle: "BIOLOGICAL RESEARCH DIVISION",
  },
  {
    id: "terminal",
    name: "Netzwerkterminal",
    code: "02 / NETWORK",
    description: "Signalwege. Zugriffe. Verborgene Systeme.",
    accent: "#e7c85a",
    title: "BLACKLINE",
    subtitle: "NETWORK OPERATIONS / LOCAL SESSION",
  },
  {
    id: "countdown",
    name: "Countdown",
    code: "03 / DEVICE",
    description: "Eine klare Zeit. Eine kontrollierte Eskalation.",
    accent: "#ff8a62",
    title: "SEQUENCE CONTROL",
    subtitle: "AUTONOMOUS DEVICE / SERIES 09",
  },
  {
    id: "tracking",
    name: "Orbital Tracking",
    code: "04 / TELEMETRY",
    description: "Zielerfassung und synthetische Telemetrie.",
    accent: "#9ad9c0",
    title: "ORBITAL SURVEY",
    subtitle: "REMOTE OBSERVATION / SECTOR 07",
  },
  {
    id: "hologram",
    name: "Analysetisch",
    code: "05 / SPATIAL",
    description: "Berühren. Drehen. Zusammenhänge erkennen.",
    accent: "#8acde8",
    title: "AEON",
    subtitle: "SPATIAL ANALYSIS ENVIRONMENT",
  },
];
export function defaults(scene: SceneId = "corporate"): Config {
  const s = scenes.find((x) => x.id === scene)!;
  return {
    version: 1,
    scene,
    title: s.title,
    subtitle: s.subtitle,
    identifier: "VS-204 / UNIT 07",
    accent: s.accent,
    mood: "clinical",
    effects: 0.25,
    density: "detailed",
    duration: 180,
    brightness: 1,
    actorMode: true,
    script: "inspect relay --sector 07 --verify",
    seed: 2048,
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
