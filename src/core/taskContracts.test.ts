import { describe, expect, it } from "vitest";
import { taskBlock, taskBlockPortsFor, taskBlocks } from "./taskBlocks";
import {
  evaluateWorkflow,
  startWorkflow,
  workflowSchema,
  type Workflow,
  type WorkflowEvent,
  type WorkflowInstance,
} from "./workflow";

// Active contract tests for the interaction engine:
//  1. every task type advances to the next node on the right port, and
//  2. every task config field is reachable from the editor.
// Both are derived from the task registry, so a new task is covered
// automatically.

function configFor(type: string): Record<string, unknown> {
  const config = { ...(taskBlock(type)?.defaults() ?? {}) };
  if (type === "wait-for-event" || type === "connect") {
    config.prop = "p1";
    config.to = "on";
  }
  return config;
}

function buildWorkflow(type: string): Workflow {
  const config = configFor(type);
  const ports = taskBlockPortsFor(type, config);
  const nodes: unknown[] = [
    { id: "start", type: "start" },
    { id: "task", type: "task", task: type, config },
  ];
  const edges: unknown[] = [
    { id: "e-start", source: "start", output: "out", target: "task" },
  ];
  ports.forEach((port, index) => {
    nodes.push({
      id: `end-${index}`,
      type: "end",
      outcome: port === "failure" ? "failure" : "success",
    });
    edges.push({
      id: `e-${index}`,
      source: "task",
      output: port,
      target: `end-${index}`,
    });
  });
  return workflowSchema.parse({
    id: "wf",
    version: 1,
    name: "Contract",
    entry: "start",
    nodes,
    edges,
  });
}

function instanceFor(workflow: Workflow): WorkflowInstance {
  return {
    id: "i1",
    workflowId: workflow.id,
    activeNodeIds: ["task"],
    status: "running",
    variables: Object.fromEntries(
      workflow.variables.map((variable) => [variable.id, variable.initial]),
    ),
    enteredAt: { task: 0 },
    startedAt: 0,
    updatedAt: 0,
  };
}

function outputOf(events: WorkflowEvent[]): string | undefined {
  for (const event of events)
    if (event.type === "workflow.transition.taken" && event.from === "task")
      return event.output;
  return undefined;
}

const EXPECTED: Record<string, { event: Parameters<typeof evaluateWorkflow>[2]; output: string }> = {
  "code-entry": {
    event: { type: "interaction", value: "7392" },
    output: "success",
  },
  choice: { event: { type: "interaction", value: "a" }, output: "a" },
  countdown: { event: { type: "interaction", value: "failure" }, output: "failure" },
  "wait-for-event": {
    event: { type: "prop", prop: "p1", state: "on" },
    output: "out",
  },
  connect: {
    event: { type: "prop", prop: "p1", state: "on" },
    output: "success",
  },
};

describe("task completion advances on the right port", () => {
  it("starts and settles to the waiting task", () => {
    for (const block of taskBlocks()) {
      const workflow = buildWorkflow(block.type);
      const events = startWorkflow(workflow, "i1", 0);
      expect(
        events.some(
          (event) =>
            event.type === "workflow.transition.taken" && event.to === "task",
        ),
        block.type,
      ).toBe(true);
    }
  });

  it("advances every task type on completion", () => {
    for (const block of taskBlocks()) {
      const workflow = buildWorkflow(block.type);
      const expectation = EXPECTED[block.type] ?? {
        event: { type: "interaction" as const, value: "go" },
        output: "success",
      };
      const events = evaluateWorkflow(
        workflow,
        instanceFor(workflow),
        expectation.event,
        1,
        "7392",
      );
      expect(outputOf(events), block.type).toBe(expectation.output);
      expect(
        events.some((event) => event.type === "workflow.completed"),
        block.type,
      ).toBe(true);
    }
  });

  it("code entry follows success and failure separately", () => {
    const workflow = buildWorkflow("code-entry");
    const success = evaluateWorkflow(
      workflow,
      instanceFor(workflow),
      { type: "interaction", value: "7392" },
      1,
      "7392",
    );
    const failure = evaluateWorkflow(
      workflow,
      instanceFor(workflow),
      { type: "interaction", value: "0000" },
      1,
      "7392",
    );
    expect(outputOf(success)).toBe("success");
    expect(outputOf(failure)).toBe("failure");
    expect(
      failure.find((event) => event.type === "workflow.completed")?.outcome,
    ).toBe("failure");
  });

  it("choice ignores an unknown option instead of taking a wrong branch", () => {
    const workflow = buildWorkflow("choice");
    const events = evaluateWorkflow(
      workflow,
      instanceFor(workflow),
      { type: "interaction", value: "nope" },
      1,
    );
    expect(events).toHaveLength(0);
  });
});

describe("every element is fully configurable", () => {
  // Fields rendered by dedicated controls in the node inspector rather than a
  // generic `ui.fields` entry.
  const SPECIAL: Record<string, string[]> = {
    choice: ["options"],
    report: ["fields"],
    inspect: ["lines"],
    "wait-for-event": ["prop", "to"],
    connect: ["prop", "to"],
  };

  it("exposes every task config field in the editor", () => {
    const missing: string[] = [];
    for (const block of taskBlocks()) {
      const uiPaths = new Set(block.ui.fields.map((field) => field.path));
      const special = new Set(SPECIAL[block.type] ?? []);
      for (const key of Object.keys(block.defaults())) {
        if (!uiPaths.has(key) && !special.has(key))
          missing.push(`${block.type}.${key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("declares options for every segmented field", () => {
    const missing: string[] = [];
    for (const block of taskBlocks())
      for (const field of block.ui.fields)
        if (field.control === "segmented" && !field.options?.length)
          missing.push(`${block.type}.${field.path}`);
    expect(missing).toEqual([]);
  });

  it("declares a surface or is a pure logic task", () => {
    const missing: string[] = [];
    for (const block of taskBlocks())
      if (!block.surface && !["hacking", "medical", "camera", "tracking"].includes(block.type))
        missing.push(block.type);
    expect(missing).toEqual([]);
  });
});
