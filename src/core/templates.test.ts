import { describe, it, expect } from "vitest";
import { buildMission, missionTemplates } from "./templates";
import { scenarioSchema } from "./training";
import { lintMission } from "./missionLint";

const MEL_TEMPLATES = [
  "relay-recovery",
  "secure-transfer",
  "distributed-command",
];

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

  it("gives every mission-library MEL entry a purpose and expected outcome", () => {
    for (const t of missionTemplates) {
      if (!MEL_TEMPLATES.includes(t.id)) continue;
      for (const inject of t.scenario.injects) {
        expect(inject.purpose.length, t.id).toBeGreaterThan(0);
        expect(inject.expectedOutcome.length, t.id).toBeGreaterThan(0);
      }
    }
  });

  it("builds a deep copy and rejects unknown ids", () => {
    const mission = buildMission("distributed-command");
    const found = missionTemplates.find((t) => t.id === "distributed-command");
    expect(mission.name).toBe(found?.name);
    expect(mission).not.toBe(found?.scenario);
    expect(() => buildMission("nope")).toThrow(/Unknown/);
  });
});
