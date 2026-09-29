export const roles = ["film", "trainer", "hq", "element", "safety", "assessor"] as const;
export type Role = (typeof roles)[number];

// Canonical role vocabulary (concept glossary). The exercise wire protocol still
// uses the legacy ids (`trainer`/`element`) until protocol v2 (plan task R1/R7).
export const publicRoles = ["director", "excon", "hq", "player", "safety", "assessor"] as const;
export type PublicRole = (typeof publicRoles)[number];

export const modes = ["film", "training", "demo"] as const;
export type Mode = (typeof modes)[number];

export const depths = ["guided", "advanced"] as const;
export type Depth = (typeof depths)[number];

const roleAliases: Record<string, PublicRole> = {
  director: "director",
  film: "director",
  excon: "excon",
  trainer: "excon",
  hq: "hq",
  player: "player",
  element: "player",
  safety: "safety",
  assessor: "assessor",
};

export function wireRole(role: PublicRole): Role {
  if (role === "director") return "film";
  if (role === "excon") return "trainer";
  if (role === "player") return "element";
  if (role === "safety") return "safety";
  if (role === "assessor") return "assessor";
  return "hq";
}

export type Session = {
  /** Canonical role (concept vocabulary). */
  publicRole: PublicRole;
  /** Legacy/wire role used by the exercise provider and views. */
  role: Role;
  mode: Mode;
  /** Explicit depth from the URL; `null` means "use the stored default". */
  depth: Depth | null;
  room: string;
  station: string;
  kiosk: boolean;
  demo: boolean;
  /** True when the URL already selects a mode, role, room, station or kiosk. */
  explicit: boolean;
};

export function sessionFromSearch(search = ""): Session {
  const q = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const publicRole = roleAliases[(q.get("role") ?? "").toLowerCase()];
  const demo = q.has("demo") || q.get("mode") === "demo";
  const rawMode = (q.get("mode") ?? "").toLowerCase();
  const rawDepth = (q.get("depth") ?? "").toLowerCase();
  const depth: Depth | null =
    rawDepth === "guided" || rawDepth === "advanced" ? rawDepth : null;
  const resolved: PublicRole =
    publicRole ?? (rawMode === "training" ? "excon" : "director");
  const mode: Mode = demo
    ? "demo"
    : rawMode === "training" || (!rawMode && resolved !== "director")
      ? "training"
      : "film";
  const kiosk = q.has("kiosk");
  const explicit =
    !!publicRole ||
    demo ||
    rawMode === "training" ||
    rawMode === "film" ||
    kiosk ||
    q.has("station") ||
    q.has("room");
  return {
    publicRole: resolved,
    role: wireRole(resolved),
    mode,
    depth,
    station: (q.get("station") || "").slice(0, 40),
    room: (q.get("room") || "default").slice(0, 40),
    kiosk,
    demo,
    explicit,
  };
}
export function stationUrl(
  origin: string,
  room: string,
  role: Exclude<Role, "film">,
  station = "",
) {
  const q = new URLSearchParams({ role, room });
  if (station) q.set("station", station);
  if (role === "element" || role === "hq") q.set("kiosk", "1");
  return `${origin}/?${q}`;
}
