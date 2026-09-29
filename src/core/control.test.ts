import { describe, it, expect } from "vitest";
import { act, evaluate, newState, scenarioSchema } from "./training";

const mission = scenarioSchema.parse({
  version: 2,
  name: "Control",
  mode: "LIVE",
  seed: 1,
  map: { lat: 0, lng: 0, zoom: 5, tiles: "", attribution: "" },
  stations: [
    {
      id: "b-1",
      name: "Bake",
      role: "element",
      module: "beacon",
      bindings: { patient: "", prop: "beacon-1", objective: "" },
    },
  ],
  props: [
    { id: "beacon-1", kind: "beacon", name: "Bake 01", states: ["off", "active"], initial: "off" },
  ],
  injects: [
    {
      id: "auto",
      name: "Auto",
      trigger: "timer",
      at: 10,
      actions: [{ type: "message", text: "auto" }],
      enabled: true,
    },
    {
      id: "manual",
      name: "Manual",
      trigger: "manual",
      actions: [{ type: "prop", target: "beacon-1", state: "active" }],
      enabled: true,
    },
  ],
});

describe("control engine", () => {
  it("starts in the ready phase", () => {
    expect(newState("t", mission).phase).toBe("ready");
  });

  it("fires timer injects but never manual injects", () => {
    const s = newState("t", mission);
    s.frozen = false;
    s.clock = 100;
    evaluate(s);
    expect(s.fired).toContain("auto");
    expect(s.fired).not.toContain("manual");
  });

  it("applies a prop action through act", () => {
    const s = newState("t", mission);
    act(s, { type: "prop", target: "beacon-1", state: "active" });
    expect(s.propStates["beacon-1"]).toBe("active");
  });
});
