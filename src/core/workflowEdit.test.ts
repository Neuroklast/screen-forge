import { describe, expect, it } from "vitest";
import {
  addEdge,
  addNodeOfType,
  addVariable,
  autoLayout,
  createWorkflow,
  edgeForOutput,
  newVariable,
  nodeFindingIds,
  nodeSummary,
  removeNode,
  removeVariable,
  renameVariable,
  replaceNode,
  replaceVariable,
  setNodePosition,
  setOutputTarget,
  workflowNodeTypes,
} from "./workflowEdit";
import { workflowSchema } from "./workflow";
import { taskBlock, taskBlocks } from "./taskBlocks";
import { lintGraph } from "./graph";
import { scenarioSchema } from "./training";

describe("workflow editor helpers", () => {
  it("creates a minimal, valid workflow with start connected to end", () => {
    const workflow = createWorkflow("wf-1");
    expect(workflowSchema.safeParse(workflow).success).toBe(true);
    expect(workflow.entry).toBe("start");
    expect(workflow.edges).toHaveLength(1);
  });

  it("adds every node type without breaking the schema", () => {
    for (const type of workflowNodeTypes) {
      const { workflow, nodeId } = addNodeOfType(createWorkflow("wf-1"), type);
      expect(workflow.nodes.some((n) => n.id === nodeId), type).toBe(true);
      expect(workflowSchema.safeParse(workflow).success, type).toBe(true);
    }
  });

  it("adds every registered task type without breaking the schema", () => {
    for (const block of taskBlocks()) {
      const { workflow } = addNodeOfType(createWorkflow("wf-1"), "task", {
        taskType: block.type,
      });
      expect(workflowSchema.safeParse(workflow).success, block.type).toBe(true);
    }
  });

  it("retires edges when the task shape changes", () => {
    const { workflow, nodeId } = addNodeOfType(createWorkflow("wf-1"), "task");
    const linked = setOutputTarget(workflow, nodeId, "success", "end");
    const node = linked.nodes.find((row) => row.id === nodeId)!;
    if (node.type !== "task") throw new Error("fixture");
    const switched = replaceNode(linked, {
      ...node,
      task: "choice",
      config: taskBlock("choice")!.defaults(),
    });
    expect(switched.edges.some((edge) => edge.source === nodeId)).toBe(false);
    // Config-only edits keep their edges.
    const kept = replaceNode(linked, { ...node, name: "Renamed" });
    expect(kept.edges.some((edge) => edge.source === nodeId)).toBe(true);
  });

  it("auto-creates a number variable for conditions and counters", () => {
    const condition = addNodeOfType(createWorkflow("wf-1"), "condition");
    expect(condition.workflow.variables).toHaveLength(1);
    const node = condition.workflow.nodes.find((n) => n.id === condition.nodeId);
    expect(node?.type).toBe("condition");
    if (node?.type === "condition")
      expect(node.variable).toBe(condition.workflow.variables[0].id);
    const increment = addNodeOfType(condition.workflow, "increment");
    expect(increment.workflow.variables).toHaveLength(1);
  });

  it("removes nodes with their edges but never the entry", () => {
    const base = createWorkflow("wf-1");
    const { workflow, nodeId } = addNodeOfType(base, "delay");
    const connected = addEdge(workflow, {
      id: "e-task",
      source: "start",
      output: "out",
      target: nodeId,
    });
    const removed = removeNode(connected, nodeId);
    expect(removed.nodes.some((n) => n.id === nodeId)).toBe(false);
    expect(removed.edges.some((e) => e.target === nodeId)).toBe(false);
    expect(removeNode(removed, "start")).toEqual(removed);
  });

  it("sets output targets for the accessible connection path", () => {
    const { workflow, nodeId } = addNodeOfType(createWorkflow("wf-1"), "delay");
    const linked = setOutputTarget(workflow, nodeId, "out", "end");
    expect(edgeForOutput(linked, nodeId, "out")?.target).toBe("end");
    const relinked = setOutputTarget(linked, nodeId, "out", "start");
    expect(edgeForOutput(relinked, nodeId, "out")?.target).toBe("start");
    expect(relinked.edges).toHaveLength(linked.edges.length);
    const cleared = setOutputTarget(relinked, nodeId, "out", "");
    expect(edgeForOutput(cleared, nodeId, "out")).toBeUndefined();
  });

  it("renames variables and their references", () => {
    const { workflow, nodeId } = addNodeOfType(createWorkflow("wf-1"), "increment");
    const variable = workflow.variables[0];
    const renamed = renameVariable(workflow, variable.id, "count");
    const node = renamed.nodes.find((n) => n.id === nodeId);
    expect(node?.type === "increment" && node.variable).toBe("count");
    expect(renameVariable(renamed, "count", "")).toBe(renamed);
    expect(renameVariable(renamed, "count", "count")).toBe(renamed);
  });

  it("keeps variable kinds and initial values consistent", () => {
    const workflow = createWorkflow("wf-1");
    const variable = newVariable();
    const withVariable = addVariable(workflow, variable);
    expect(withVariable.variables).toHaveLength(1);
    const enumVariable = replaceVariable(withVariable, {
      ...variable,
      kind: "enum",
      initial: "a",
      values: ["a", "b"],
    });
    expect(enumVariable.variables[0].values).toEqual(["a", "b"]);
    expect(removeVariable(enumVariable, variable.id).variables).toEqual([]);
  });

  it("lays out unreachable nodes without collisions", () => {
    const { workflow, nodeId } = addNodeOfType(createWorkflow("wf-1"), "delay");
    const layout = autoLayout(workflow);
    expect(Object.keys(layout)).toHaveLength(workflow.nodes.length);
    expect(layout[nodeId]).toBeDefined();
    expect(layout[nodeId]).not.toEqual(layout["start"]);
  });

  it("summarises every node type", () => {
    for (const type of workflowNodeTypes) {
      const { workflow, nodeId } = addNodeOfType(createWorkflow("wf-1"), type);
      const node = workflow.nodes.find((n) => n.id === nodeId)!;
      expect(() => nodeSummary(node)).not.toThrow();
    }
    expect(setNodePosition(workflowSchema.parse(createWorkflow("wf-1")), "start", { x: 5, y: 6 }).nodes[0].position).toEqual({ x: 5, y: 6 });
  });

  it("maps linter findings to their node", () => {
    const { workflow, nodeId } = addNodeOfType(createWorkflow("wf-1"), "task");
    const scenario = scenarioSchema.parse({
      version: 2,
      name: "Editor",
      mode: "LIVE",
      seed: 1,
      map: { lat: 0, lng: 0, zoom: 5, tiles: "", attribution: "" },
      stations: [{ id: "hq", name: "HQ", role: "hq", module: "tracking" }],
      workflows: [workflow],
    });
    const findings = lintGraph(scenario);
    const exit = findings.find((f) =>
      f.id.startsWith(`graph-wf-exit-wf-1-${nodeId}`),
    );
    expect(exit).toBeDefined();
    expect(nodeFindingIds(findings, "wf-1", nodeId)).toContain(exit);
    expect(nodeFindingIds(findings, "wf-1", "start")).toEqual([]);
  });
});
