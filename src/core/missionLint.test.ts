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
});
