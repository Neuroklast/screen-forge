import { describe, it, expect } from "vitest";
import { findingCounts, lintMission } from "./missionLint";
import { scenarioSchema, template } from "./training";

describe("mission linter", () => {
  it("flags a mission without stations as an error", () => {
    const s = scenarioSchema.parse({
      version: 2,
      name: "Empty",
      mode: "LIVE",
      seed: 1,
      map: { lat: 0, lng: 0, zoom: 5, tiles: "", attribution: "" },
      stations: [],
    });
    expect(s.stations).toEqual([]);
    expect(
      lintMission(s).some((f) => f.id === "stations-min" && f.severity === "error"),
    ).toBe(true);
  });

  it("flags a medical station without a patient", () => {
    const s = structuredClone(template("sar"));
    s.patients = [];
    s.stations = s.stations.map((st) =>
      st.module === "medical"
        ? { ...st, bindings: { ...st.bindings, patient: "" } }
        : st,
    );
    expect(
      lintMission(s).some(
        (f) => f.severity === "error" && f.path.id === "med-1",
      ),
    ).toBe(true);
  });

  it("reports no error for a neutral single-device mission", () => {
    const s = scenarioSchema.parse({
      version: 2,
      name: "Blank",
      mode: "LIVE",
      seed: 1,
      map: { lat: 0, lng: 0, zoom: 5, tiles: "", attribution: "" },
      stations: [
        { id: "term-1", name: "Terminal", role: "element", module: "terminal" },
      ],
    });
    expect(findingCounts(lintMission(s)).error).toBe(0);
  });

  it("warns when no objective is defined", () => {
    const s = structuredClone(template("sar"));
    s.objectives = [];
    expect(
      lintMission(s).some((f) => f.id === "no-objective" && f.severity === "warning"),
    ).toBe(true);
  });

  it("blocks patients in a disposal scenario unless they are enabled", () => {
    const s = structuredClone(template("sar"));
    s.type = "disposal";
    s.capabilities = {};
    expect(
      lintMission(s).some(
        (f) => f.id === "cap-patients-off" && f.severity === "error",
      ),
    ).toBe(true);
  });

  it("allows patients in a disposal scenario when explicitly enabled", () => {
    const s = structuredClone(template("sar"));
    s.type = "disposal";
    s.capabilities = { patients: true };
    expect(lintMission(s).some((f) => f.id === "cap-patients-off")).toBe(false);
  });

  it("blocks a medical scenario that treats patients without one", () => {
    const s = structuredClone(template("medical"));
    s.patients = [];
    s.stations = s.stations.map((st) =>
      st.module === "medical"
        ? { ...st, bindings: { ...st.bindings, patient: "" } }
        : st,
    );
    expect(
      lintMission(s).some((f) => f.id === "cap-medical-patient"),
    ).toBe(true);
  });

  it("blocks a personal tracking device without owner or task", () => {
    const s = scenarioSchema.parse({
      version: 2,
      name: "Owner",
      mode: "LIVE",
      seed: 1,
      map: { lat: 0, lng: 0, zoom: 5, tiles: "", attribution: "" },
      stations: [
        { id: "hq", name: "HQ", role: "hq", module: "tracking" },
        { id: "op-1", name: "Operator", role: "element", module: "tracking" },
      ],
    });
    expect(
      lintMission(s).some((f) => f.id === "cap-device-op-1"),
    ).toBe(true);
  });

  it("accepts a personal tracking device owned by a team", () => {
    const s = scenarioSchema.parse({
      version: 2,
      name: "Owner",
      mode: "LIVE",
      seed: 1,
      map: { lat: 0, lng: 0, zoom: 5, tiles: "", attribution: "" },
      stations: [
        { id: "hq", name: "HQ", role: "hq", module: "tracking" },
        {
          id: "op-1",
          name: "Operator",
          role: "element",
          module: "tracking",
          team: "ALPHA",
        },
      ],
      teams: [{ id: "ALPHA", name: "Alpha" }],
    });
    expect(lintMission(s).some((f) => f.id.startsWith("cap-device-"))).toBe(
      false,
    );
  });
});
