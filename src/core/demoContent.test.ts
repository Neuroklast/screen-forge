import { describe, expect, it } from "vitest";
import { seedDemoState } from "./demoContent";
import { showOrder, showSchema } from "./director";
import { scenarioSchema } from "./training";

describe("demo seed content", () => {
  it("validates against the show and mission schemas", () => {
    const state = seedDemoState();
    expect(showSchema.safeParse(state.show).success).toBe(true);
    expect(scenarioSchema.safeParse(state.mission).success).toBe(true);
    expect(showOrder(state.show).length).toBeGreaterThan(0);
    expect(state.mission.stations.length).toBeGreaterThan(0);
    expect(state.mission.injects.length).toBeGreaterThan(0);
  });

  it("returns an independent copy per call", () => {
    const a = seedDemoState();
    const b = seedDemoState();
    expect(a).not.toBe(b);
    a.show.name = "changed";
    expect(b.show.name).not.toBe("changed");
  });
});
