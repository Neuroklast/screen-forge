import { describe, it, expect } from "vitest";
import { scenarioSchema, template } from "./training";

const v1 = {
  version: 1,
  name: "Legacy",
  mode: "LIVE",
  seed: 2048,
  map: { lat: 51.23, lng: 6.78, zoom: 15, tiles: "", attribution: "" },
  stations: [
    { id: "hq", name: "HQ", role: "hq", scene: "tracking" },
    {
      id: "med-1",
      name: "Medic",
      role: "element",
      scene: "medical",
      entityId: "patient-1",
    },
  ],
  patients: [{ id: "patient-1", name: "Patient 01", kind: "stable", since: 0 }],
  dossiers: [],
  zones: [],
  rules: [
    {
      id: "rule-1",
      name: "Timer",
      trigger: "timer",
      at: 60,
      station: "med-1",
      unless: "treated",
      actions: [{ type: "patient", target: "patient-1", kind: "desat" }],
    },
  ],
  objectives: [],
};

describe("mission v1 -> v2 migration", () => {
  it("maps scene/entityId/rules to module/bindings/injects", () => {
    const m = scenarioSchema.parse(v1);
    expect(m.version).toBe(2);
    expect(m.stations[0].module).toBe("tracking");
    expect(m.stations[1].module).toBe("medical");
    expect(m.stations[1].bindings.patient).toBe("patient-1");
    expect(m.injects).toHaveLength(1);
    expect(m.injects[0].id).toBe("rule-1");
    expect(m.props).toEqual([]);
    expect(m.teams).toEqual([]);
    expect(m.actors).toEqual([]);
    expect("rules" in m).toBe(false);
    expect("scene" in (m.stations[0] as object)).toBe(false);
  });

  it("is idempotent across repeated parses", () => {
    const once = scenarioSchema.parse(v1);
    const twice = scenarioSchema.parse(once);
    expect(twice).toEqual(once);
  });

  it("rejects a v1 mission whose medical station loses its patient", () => {
    const broken = structuredClone(v1);
    broken.stations[1].entityId = "missing";
    expect(scenarioSchema.safeParse(broken).success).toBe(false);
  });

  it("accepts a mission without patients, props or injects", () => {
    const m = template("sar");
    m.patients = [];
    m.dossiers = [];
    m.zones = [];
    m.objectives = [];
    m.injects = [];
    m.stations = m.stations.filter((s) => s.module !== "medical");
    expect(scenarioSchema.safeParse(m).success).toBe(true);
  });

  it("renames the legacy corporate module to intranet", () => {
    const legacy = {
      ...template("sar"),
      patients: [],
      props: [],
      dossiers: [],
      zones: [],
      objectives: [],
      injects: [],
      stations: [
        { id: "stage-1", name: "Stage 01", role: "element", module: "corporate" },
      ],
    };
    const parsed = scenarioSchema.parse(legacy);
    expect(parsed.stations[0].module).toBe("intranet");
  });
});
