import { describe, it, expect } from "vitest";
import { applyVariant, buildMission, missionTemplates } from "./templates";
import { scenarioSchema, template } from "./training";
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

describe("applyVariant", () => {
  it("replaces an entity by id and appends a new one", () => {
    const base = template("sar");
    const scenario = applyVariant(base, {
      id: "v",
      name: "v",
      summary: "",
      patch: {
        objectives: [
          { id: "objective-1", name: "Renamed" },
          { id: "objective-2", name: "New" },
        ],
      },
    });
    expect(scenario.objectives).toHaveLength(2);
    expect(scenario.objectives.find((o) => o.id === "objective-1")?.name).toBe(
      "Renamed",
    );
    expect(scenario.objectives.some((o) => o.id === "objective-2")).toBe(true);
  });

  it("replaces scalars and keeps untouched entities", () => {
    const base = template("sar");
    const scenario = applyVariant(base, {
      id: "v",
      name: "v",
      summary: "",
      patch: { name: "Renamed", seed: 99 },
    });
    expect(scenario.name).toBe("Renamed");
    expect(scenario.seed).toBe(99);
    expect(scenario.stations).toHaveLength(base.stations.length);
  });

  it("does not mutate the base scenario", () => {
    const base = template("sar");
    const original = JSON.stringify(base);
    applyVariant(base, {
      id: "v",
      name: "v",
      summary: "",
      patch: { name: "X" },
    });
    expect(JSON.stringify(base)).toBe(original);
  });

  it("every built-in variant applies cleanly and never drops base content", () => {
    for (const tpl of missionTemplates) {
      for (const variant of tpl.variants ?? []) {
        const scenario = applyVariant(tpl.scenario, variant);
        expect(scenario.stations.length).toBeGreaterThanOrEqual(
          tpl.scenario.stations.length,
        );
        expect(scenario.objectives.length).toBeGreaterThanOrEqual(
          tpl.scenario.objectives.length,
        );
        expect(scenario.injects.length).toBeGreaterThanOrEqual(
          tpl.scenario.injects.length,
        );
        expect(scenarioSchema.safeParse(scenario).success, variant.id).toBe(
          true,
        );
      }
    }
  });
});
