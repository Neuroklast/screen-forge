import { describe, expect, it } from "vitest";
import { buildDebrief } from "./debrief";
import { blankScenario, scenarioSchema } from "./training";

function scenario() {
  return scenarioSchema.parse({
    ...blankScenario("sar"),
    objectives: [
      { id: "obj-1", name: "Locate casualty" },
      { id: "obj-2", name: "Untouched" },
    ],
    injects: [
      {
        id: "e1",
        name: "Radio fails",
        trigger: "timer",
        at: 60,
        objective: "obj-1",
        purpose: "Force fallback communication",
        expectedOutcome: ["runner used"],
        evidence: ["radio failure logged"],
        actions: [{ type: "message", text: "Radio degraded" }],
      },
      {
        id: "e2",
        name: "Unlinked beat",
        trigger: "manual",
        purpose: "No objective",
        actions: [{ type: "message", text: "beat" }],
      },
    ],
  });
}

describe("buildDebrief", () => {
  it("groups events under the objective they serve", () => {
    const report = buildDebrief(scenario(), { fired: ["e1"], completed: [] });
    const objective = report.objectives.find((row) => row.id === "obj-1");
    expect(objective?.events.map((event) => event.id)).toEqual(["e1"]);
    expect(objective?.expectedOutcome).toEqual(["runner used"]);
    expect(objective?.evidence).toEqual(["radio failure logged"]);
  });

  it("reports fired vs planned and the objective completion", () => {
    const report = buildDebrief(scenario(), {
      fired: ["e1"],
      completed: ["obj-1"],
    });
    expect(report.events.find((event) => event.id === "e1")?.status).toBe(
      "fired",
    );
    expect(report.events.find((event) => event.id === "e2")?.status).toBe(
      "planned",
    );
    expect(report.objectives.find((row) => row.id === "obj-1")?.completed).toBe(
      true,
    );
    expect(report.summary).toMatchObject({
      objectives: 2,
      completed: 1,
      events: 2,
      fired: 1,
      skipped: 0,
      evidence: 1,
    });
  });

  it("reports a suppressed event as skipped, never as fired", () => {
    // The runtime pushes a suppressed inject into both `fired` and `skipped`.
    const report = buildDebrief(scenario(), {
      fired: ["e1"],
      skipped: ["e1"],
      completed: [],
    });
    expect(report.events.find((event) => event.id === "e1")?.status).toBe(
      "skipped",
    );
    expect(report.summary.fired).toBe(0);
    expect(report.summary.skipped).toBe(1);
  });

  it("de-duplicates expected outcomes and evidence per objective", () => {
    const base = scenario();
    const withSecond = scenarioSchema.parse({
      ...base,
      injects: [
        ...base.injects,
        {
          id: "e3",
          name: "Second linked beat",
          trigger: "manual",
          objective: "obj-1",
          expectedOutcome: ["runner used"],
          evidence: ["radio failure logged"],
          actions: [{ type: "message", text: "beat" }],
        },
      ],
    });
    const objective = buildDebrief(withSecond, {
      fired: [],
      completed: [],
    }).objectives.find((row) => row.id === "obj-1");
    expect(objective?.expectedOutcome).toEqual(["runner used"]);
    expect(objective?.evidence).toEqual(["radio failure logged"]);
    expect(objective?.events).toHaveLength(2);
  });

  it("treats an event with a dangling objective id as unlinked", () => {
    const base = scenario();
    const dangling = scenarioSchema.parse({
      ...base,
      injects: [
        ...base.injects,
        {
          id: "e4",
          name: "Dangling",
          trigger: "manual",
          objective: "does-not-exist",
          actions: [{ type: "message", text: "x" }],
        },
      ],
    });
    const report = buildDebrief(dangling, { fired: [], completed: [] });
    expect(report.unlinked.map((event) => event.id)).toContain("e4");
    expect(report.events.find((event) => event.id === "e4")?.objectiveName).toBe(
      "",
    );
  });

  it("surfaces events without an objective and objectives without events", () => {
    const report = buildDebrief(scenario(), { fired: [], completed: [] });
    expect(report.unlinked.map((event) => event.id)).toEqual(["e2"]);
    expect(report.uncovered.map((objective) => objective.id)).toEqual(["obj-2"]);
  });

  it("is empty-safe", () => {
    const report = buildDebrief(blankScenario("custom"), {
      fired: [],
      completed: [],
    });
    expect(report.objectives).toEqual([]);
    expect(report.events).toEqual([]);
    expect(report.summary.events).toBe(0);
  });
});
