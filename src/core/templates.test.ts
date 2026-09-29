import { describe, it, expect } from "vitest";
import { missionTemplates } from "./templates";
import { scenarioSchema } from "./training";
import { lintMission } from "./missionLint";

describe("mission templates", () => {
  it("all templates validate and have unique ids", () => {
    const ids = missionTemplates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of missionTemplates)
      expect(scenarioSchema.safeParse(t.scenario).success, t.id).toBe(true);
  });

  it("every non-blank template has a device and no lint errors", () => {
    for (const t of missionTemplates) {
      if (t.id === "blank") continue;
      expect(t.scenario.stations.length, t.id).toBeGreaterThan(0);
      const errors = lintMission(t.scenario).filter((f) => f.severity === "error");
      expect(
        errors.map((e) => e.message),
        `${t.id}: ${errors.map((e) => e.message).join("; ")}`,
      ).toEqual([]);
    }
  });
});
