import { describe, it, expect } from "vitest";
import {
  capabilitiesFor,
  inferScenarioType,
  scenarioCapabilities,
  scenarioTypes,
} from "./capabilities";
import { scenarioSchema, template } from "./training";

describe("scenario capabilities", () => {
  it("keeps the disposal type free of patients by default", () => {
    const caps = capabilitiesFor("disposal");
    expect(caps.patients).toBe(false);
    expect(caps.props).toBe(true);
    expect(caps.participants).toBe(true);
    expect(caps.teams).toBe(true);
    expect(caps.workflows).toBe(true);
  });

  it("lets overrides switch a hidden capability back on", () => {
    const caps = capabilitiesFor("disposal", { patients: true });
    expect(caps.patients).toBe(true);
    expect(caps.props).toBe(true);
  });

  it("derives film and medical presets from their domain concepts", () => {
    const film = capabilitiesFor("film");
    expect(film.actors).toBe(true);
    expect(film.props).toBe(true);
    expect(film.patients).toBe(false);
    expect(film.teams).toBe(false);
    const medical = capabilitiesFor("medical");
    expect(medical.patients).toBe(true);
    expect(medical.props).toBe(false);
  });

  it("resolves capabilities from a persisted scenario", () => {
    const parsed = scenarioSchema.parse({
      ...template("medical"),
      type: "disposal",
      capabilities: { patients: true },
    });
    const caps = scenarioCapabilities(parsed);
    expect(caps.patients).toBe(true);
    expect(caps.actors).toBe(false);
  });
});

describe("scenario type inference", () => {
  it("infers medical from patients and medical modules", () => {
    expect(
      inferScenarioType({
        stations: [{ module: "medical" }],
        patients: [],
      }),
    ).toBe("medical");
    expect(inferScenarioType({ patients: [{ id: "p" }] })).toBe("medical");
  });

  it("infers disposal from an ordnance prop or module", () => {
    expect(
      inferScenarioType({ props: [{ kind: "ordnance" }] }),
    ).toBe("disposal");
    expect(
      inferScenarioType({ stations: [{ module: "ordnance" }] }),
    ).toBe("disposal");
  });

  it("infers film from actors or playback", () => {
    expect(inferScenarioType({ actors: [{ id: "a" }] })).toBe("film");
    expect(inferScenarioType({ mode: "PLAYBACK" })).toBe("film");
  });

  it("falls back to field", () => {
    expect(inferScenarioType({})).toBe("field");
  });

  it("only infers known types", () => {
    expect(scenarioTypes).toContain(inferScenarioType({ mode: "LIVE" }));
  });
});

describe("migration adds a stable type", () => {
  it("persists the inferred type on parse and keeps it on reparse", () => {
    const legacy = {
      version: 2,
      name: "Legacy",
      mode: "LIVE",
      seed: 2048,
      map: { lat: 51.23, lng: 6.78, zoom: 15, tiles: "", attribution: "" },
      stations: [
        { id: "hq", name: "HQ", role: "hq", module: "tracking" },
        {
          id: "med-1",
          name: "Medic",
          role: "element",
          module: "medical",
          bindings: { patient: "patient-1" },
        },
      ],
      patients: [{ id: "patient-1", name: "Patient 01", kind: "stable", since: 0 }],
      injects: [],
      objectives: [],
    };
    const once = scenarioSchema.parse(legacy);
    expect(once.type).toBe("medical");
    const twice = scenarioSchema.parse(once);
    expect(twice.type).toBe("medical");
  });

  it("keeps an explicit type even when content suggests another one", () => {
    const parsed = scenarioSchema.parse({
      ...template("sar"),
      type: "disposal",
    });
    expect(parsed.type).toBe("disposal");
  });
});
