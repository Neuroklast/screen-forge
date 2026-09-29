import { describe, expect, it } from "vitest";
import { lintGraph } from "./graph";
import { scenarioSchema, template } from "./training";

const base = (injects: unknown[]) =>
  scenarioSchema.parse({
    version: 2,
    name: "Graph",
    mode: "LIVE",
    seed: 1,
    map: { lat: 0, lng: 0, zoom: 5, tiles: "", attribution: "" },
    stations: [{ id: "hq", name: "HQ", role: "hq", module: "tracking" }],
    injects,
  });

const inject = (id: string, escalation: string, extra = {}) => ({
  id,
  name: id.toUpperCase(),
  trigger: "manual",
  actions: [{ type: "message", text: id }],
  escalation,
  purpose: "train",
  expectedOutcome: ["ack"],
  ...extra,
});

describe("graph linter", () => {
  it("flags a cycle without a repeat rule", () => {
    const s = base([inject("a", "b"), inject("b", "a")]);
    expect(
      lintGraph(s).some((f) => f.id === "graph-cycle-a" && f.severity === "error"),
    ).toBe(true);
  });

  it("accepts a repeatable cycle with a cap and exit", () => {
    const s = base([
      inject("a", "b", {
        repeatable: true,
        maxIterations: 3,
        exitCondition: "ack",
      }),
      inject("b", "a", {
        repeatable: true,
        maxIterations: 3,
        exitCondition: "ack",
      }),
    ]);
    expect(lintGraph(s).some((f) => f.severity === "error")).toBe(false);
  });

  it("flags a repeatable cycle without a cap", () => {
    const s = base([
      inject("a", "b", { repeatable: true }),
      inject("b", "a", { repeatable: true }),
    ]);
    expect(
      lintGraph(s).some((f) => f.id === "graph-cycle-cap-a"),
    ).toBe(true);
  });

  it("flags dangling escalation", () => {
    const s = base([inject("a", "ghost")]);
    expect(lintGraph(s).some((f) => f.id === "graph-escalation-a")).toBe(true);
  });

  it("warns when training intent is missing", () => {
    const s = structuredClone(template("sar"));
    expect(lintGraph(s).some((f) => f.id === "graph-purpose-rule-1")).toBe(true);
    expect(lintGraph(s).some((f) => f.id === "graph-outcome-rule-1")).toBe(true);
  });

  it("warns when an external trigger has no fallback", () => {
    const s = structuredClone(template("sar"));
    s.injects[0].trigger = "signal";
    s.injects[0].fallback = "";
    expect(lintGraph(s).some((f) => f.id === "graph-fallback-rule-1")).toBe(
      true,
    );
  });
});
