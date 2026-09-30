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

const baseWorkflow = (overrides: Record<string, unknown> = {}) => ({
  id: "wf-1",
  version: 1,
  name: "Flow",
  trigger: { type: "manual" },
  entry: "start",
  nodes: [
    { id: "start", type: "start" },
    { id: "task", type: "task", task: "confirm", config: {} },
    { id: "end", type: "end", outcome: "success" },
  ],
  edges: [
    { id: "e1", source: "start", output: "out", target: "task" },
    { id: "e2", source: "task", output: "success", target: "end" },
    { id: "e3", source: "task", output: "failure", target: "end" },
  ],
  ...overrides,
});

const withWorkflows = (workflows: unknown[]) =>
  scenarioSchema.parse({
    version: 2,
    name: "Graph",
    mode: "LIVE",
    seed: 1,
    map: { lat: 0, lng: 0, zoom: 5, tiles: "", attribution: "" },
    stations: [{ id: "hq", name: "HQ", role: "hq", module: "tracking" }],
    workflows,
  });

const workflowFindings = (workflows: unknown[]) =>
  lintGraph(withWorkflows(workflows)).filter((f) =>
    f.id.startsWith("graph-wf-"),
  );

describe("workflow graph linter", () => {
  it("accepts a reachable workflow with every port connected", () => {
    expect(workflowFindings([baseWorkflow()])).toEqual([]);
  });

  it("flags unreachable nodes", () => {
    const workflow = baseWorkflow({
      nodes: [
        { id: "start", type: "start" },
        { id: "task", type: "task", task: "confirm", config: {} },
        { id: "end", type: "end", outcome: "success" },
        { id: "orphan", type: "end", outcome: "failure" },
      ],
    });
    expect(
      workflowFindings([workflow]).some(
        (f) => f.id === "graph-wf-unreachable-wf-1-orphan",
      ),
    ).toBe(true);
  });

  it("flags nodes with an unconnected output", () => {
    const workflow = baseWorkflow({
      edges: [
        { id: "e1", source: "start", output: "out", target: "task" },
        { id: "e2", source: "task", output: "success", target: "end" },
      ],
    });
    expect(
      workflowFindings([workflow]).some((f) =>
        f.id.startsWith("graph-wf-exit-wf-1-task"),
      ),
    ).toBe(true);
  });

  it("flags automatic cycles without a wait", () => {
    const workflow = baseWorkflow({
      nodes: [
        { id: "start", type: "start" },
        { id: "bump", type: "increment", variable: "n" },
        {
          id: "check",
          type: "condition",
          variable: "n",
          operator: ">=",
          value: 0,
        },
        { id: "end", type: "end", outcome: "success" },
      ],
      edges: [
        { id: "e1", source: "start", output: "out", target: "bump" },
        { id: "e2", source: "bump", output: "out", target: "check" },
        { id: "e3", source: "check", output: "true", target: "bump" },
        { id: "e4", source: "check", output: "false", target: "end" },
      ],
      variables: [{ id: "n", kind: "number", initial: 0 }],
    });
    expect(
      workflowFindings([workflow]).some((f) => f.id === "graph-wf-loop-wf-1"),
    ).toBe(true);
  });

  it("accepts an automatic cycle that settles through a condition", () => {
    const workflow = baseWorkflow({
      nodes: [
        { id: "start", type: "start" },
        { id: "bump", type: "increment", variable: "n" },
        {
          id: "check",
          type: "condition",
          variable: "n",
          operator: ">=",
          value: 3,
        },
        { id: "end", type: "end", outcome: "success" },
      ],
      edges: [
        { id: "e1", source: "start", output: "out", target: "bump" },
        { id: "e2", source: "bump", output: "out", target: "check" },
        { id: "e3", source: "check", output: "true", target: "end" },
        { id: "e4", source: "check", output: "false", target: "bump" },
      ],
      variables: [{ id: "n", kind: "number", initial: 0 }],
    });
    expect(workflowFindings([workflow])).toEqual([]);
  });

  it("flags a branch that never reaches a terminal node", () => {
    const workflow = baseWorkflow({
      nodes: [
        { id: "start", type: "start" },
        { id: "task", type: "task", task: "confirm", config: {} },
      ],
      edges: [
        { id: "e1", source: "start", output: "out", target: "task" },
        { id: "e2", source: "task", output: "success", target: "task" },
        { id: "e3", source: "task", output: "failure", target: "task" },
      ],
    });
    expect(
      workflowFindings([workflow]).some((f) =>
        f.id.startsWith("graph-wf-terminal-wf-1-task"),
      ),
    ).toBe(true);
  });

  it("accepts a workflow whose branches all reach an end", () => {
    const workflow = baseWorkflow({
      nodes: [
        { id: "start", type: "start" },
        {
          id: "check",
          type: "condition",
          variable: "n",
          operator: ">=",
          value: 1,
        },
        { id: "end", type: "end", outcome: "success" },
        { id: "fail", type: "end", outcome: "failure" },
      ],
      edges: [
        { id: "e1", source: "start", output: "out", target: "check" },
        { id: "e2", source: "check", output: "true", target: "end" },
        { id: "e3", source: "check", output: "false", target: "fail" },
      ],
      variables: [{ id: "n", kind: "number", initial: 0 }],
    });
    expect(workflowFindings([workflow])).toEqual([]);
  });
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
