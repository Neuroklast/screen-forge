import { describe, it, expect } from "vitest";
import { newState, scenarioSchema, setProp } from "./training";

const mission = scenarioSchema.parse({
  version: 2,
  name: "Beacon",
  mode: "LIVE",
  seed: 1,
  map: { lat: 0, lng: 0, zoom: 5, tiles: "", attribution: "" },
  stations: [
    { id: "hq", name: "HQ", role: "hq", module: "tracking" },
    {
      id: "b-1",
      name: "Bake",
      role: "element",
      module: "beacon",
      bindings: { patient: "", prop: "beacon-1", objective: "" },
    },
  ],
  props: [
    {
      id: "beacon-1",
      kind: "beacon",
      name: "Bake 01",
      states: ["off", "active", "interference"],
      initial: "off",
    },
  ],
});

describe("prop runtime", () => {
  it("initializes prop states from the scenario", () => {
    const s = newState("t", mission);
    expect(s.propStates["beacon-1"]).toBe("off");
  });

  it("applies valid transitions and rejects unknown states or props", () => {
    const s = newState("t", mission);
    expect(setProp(s, "beacon-1", "active")).toBe(true);
    expect(s.propStates["beacon-1"]).toBe("active");
    expect(setProp(s, "beacon-1", "bogus")).toBe(false);
    expect(setProp(s, "missing", "off")).toBe(false);
  });
});
