// Scenario capability layer: the scenario type selects which domain concepts
// the preparation UI exposes. Capabilities are derived from the type and may be
// overridden per scenario. The underlying scenario schema keeps every
// collection; hidden concepts are reachable through the expert surfaces.
// Shared by the browser and Node 24; no browser-only imports.
export const scenarioTypes = [
  "disposal",
  "medical",
  "sar",
  "technical",
  "film",
  "field",
  "custom",
] as const;
export type ScenarioType = (typeof scenarioTypes)[number];

export const capabilityKeys = [
  "participants",
  "teams",
  "actors",
  "patients",
  "props",
  "zones",
  "dossiers",
  "devices",
  "workflows",
  "objectives",
] as const;
export type CapabilityKey = (typeof capabilityKeys)[number];
export type ScenarioCapabilities = Record<CapabilityKey, boolean>;
export type CapabilityOverrides = Partial<ScenarioCapabilities>;

// Minimal per-type defaults; a scenario may switch any flag back on through
// its capability overrides (e.g. a disposal exercise with a contingency
// casualty). Nothing here removes data — only visibility.
const PRESETS: Record<ScenarioType, ScenarioCapabilities> = {
  disposal: {
    participants: true,
    teams: true,
    actors: false,
    patients: false,
    props: true,
    zones: true,
    dossiers: false,
    devices: true,
    workflows: true,
    objectives: true,
  },
  medical: {
    participants: true,
    teams: false,
    actors: false,
    patients: true,
    props: false,
    zones: false,
    dossiers: false,
    devices: true,
    workflows: true,
    objectives: true,
  },
  sar: {
    participants: true,
    teams: true,
    actors: false,
    patients: true,
    props: true,
    zones: true,
    dossiers: false,
    devices: true,
    workflows: true,
    objectives: true,
  },
  technical: {
    participants: true,
    teams: true,
    actors: false,
    patients: false,
    props: true,
    zones: true,
    dossiers: true,
    devices: true,
    workflows: true,
    objectives: true,
  },
  film: {
    participants: false,
    teams: false,
    actors: true,
    patients: false,
    props: true,
    zones: false,
    dossiers: false,
    devices: true,
    workflows: true,
    objectives: true,
  },
  field: {
    participants: true,
    teams: true,
    actors: false,
    patients: false,
    props: true,
    zones: true,
    dossiers: true,
    devices: true,
    workflows: true,
    objectives: true,
  },
  custom: {
    participants: true,
    teams: true,
    actors: true,
    patients: true,
    props: true,
    zones: true,
    dossiers: true,
    devices: true,
    workflows: true,
    objectives: true,
  },
};

export function capabilitiesFor(
  type: ScenarioType,
  overrides: CapabilityOverrides = {},
): ScenarioCapabilities {
  return { ...PRESETS[type], ...overrides };
}

// Resolves the effective capabilities of a scenario. Type-only import: the
// module graph stays free of a runtime cycle with training.ts.
export function scenarioCapabilities(scenario: {
  type: ScenarioType;
  capabilities: CapabilityOverrides;
}): ScenarioCapabilities {
  return capabilitiesFor(scenario.type, scenario.capabilities);
}

export function isScenarioType(value: unknown): value is ScenarioType {
  return (
    typeof value === "string" &&
    (scenarioTypes as readonly string[]).includes(value)
  );
}

// Toggling a capability stores an override only when it differs from the
// type's preset, so switching types keeps the override set minimal.
export function withCapability(
  type: ScenarioType,
  overrides: CapabilityOverrides,
  key: CapabilityKey,
  value: boolean,
): CapabilityOverrides {
  const next = { ...overrides };
  if (value === capabilitiesFor(type)[key]) delete next[key];
  else next[key] = value;
  return next;
}

// Best-effort type for scenarios saved before `type` existed. The result is
// persisted on the next save, so the type stays stable afterwards.
export function inferScenarioType(input: Record<string, unknown>): ScenarioType {
  const stations = Array.isArray(input.stations) ? input.stations : [];
  const modules = stations.map((station) => {
    if (!station || typeof station !== "object") return "";
    return String((station as Record<string, unknown>).module ?? "");
  });
  const patients = Array.isArray(input.patients) ? input.patients : [];
  const actors = Array.isArray(input.actors) ? input.actors : [];
  const props = Array.isArray(input.props) ? input.props : [];
  if (patients.length > 0 || modules.includes("medical")) return "medical";
  const hasOrdnance =
    modules.includes("ordnance") ||
    props.some(
      (prop) =>
        !!prop &&
        typeof prop === "object" &&
        (prop as Record<string, unknown>).kind === "ordnance",
    );
  if (hasOrdnance) return "disposal";
  if (actors.length > 0) return "film";
  if (input.mode === "PLAYBACK") return "film";
  return "field";
}
