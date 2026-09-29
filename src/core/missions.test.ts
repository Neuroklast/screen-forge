import { describe, expect, it } from "vitest";
import { buildMission, missionTemplates } from "./missions";
import { lintMission } from "./missionLint";
import { scenarioSchema } from "./training";

describe("mission templates", () => {
  it("builds valid missions for every template", () => {
    for (const template of missionTemplates) {
      const mission = buildMission(template.id);
      expect(scenarioSchema.safeParse(mission).success).toBe(true);
      expect(mission.name).toBe(template.name);
    }
  });

  it("gives every MEL entry a purpose and expected outcome", () => {
    for (const template of missionTemplates) {
      const mission = buildMission(template.id);
      for (const inject of mission.injects) {
        expect(inject.purpose.length).toBeGreaterThan(0);
        expect(inject.expectedOutcome.length).toBeGreaterThan(0);
      }
    }
  });

  it("has no graph errors for the professional template", () => {
    const mission = buildMission("distributed-command");
    expect(lintMission(mission).some((f) => f.severity === "error")).toBe(
      false,
    );
  });

  it("rejects an unknown template id", () => {
    expect(() => buildMission("nope")).toThrow(/Unknown/);
  });
});
