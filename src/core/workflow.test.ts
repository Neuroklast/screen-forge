import { describe, expect, it } from "vitest";
import type { z } from "zod";
import {
  advanceWorkflow,
  evaluateWorkflow,
  redactWorkflowSecrets,
  startWorkflow,
  workflowNodePorts,
  workflowSchema,
} from "./workflow";
import {
  interactionEvents,
  newState,
  projectState,
  scenarioSchema,
  template,
  workflowPropEvents,
  workflowStartEvents,
  workflowStartsForProp,
} from "./training";
import { applyEvent } from "./events";

type WorkflowInput = z.input<typeof workflowSchema>;
type PilotInput = WorkflowInput & {
  edges: NonNullable<WorkflowInput["edges"]>;
  variables: NonNullable<WorkflowInput["variables"]>;
};

// The vertical pilot: prop link → code challenge → lockout/diagnostics → objective.
const pilot = (): PilotInput => ({
  id: "wf-pilot",
  version: 1,
  name: "Cable link",
  trigger: { type: "prop", prop: "device-alpha", to: "connected" },
  entry: "start",
  nodes: [
    { id: "start", type: "start" },
    { id: "link", type: "show-surface", station: "prop-1", surface: "link" },
    {
      id: "code",
      type: "task",
      task: "code-entry",
      config: {
        expectedValueRef: "accessCode",
        maxAttempts: 3,
        inputLength: 4,
        maskInput: true,
      },
    },
    { id: "fail", type: "increment", variable: "attempts" },
    {
      id: "limit",
      type: "condition",
      variable: "attempts",
      operator: ">=",
      value: 3,
    },
    {
      id: "lockout",
      type: "show-surface",
      station: "prop-1",
      surface: "lockout",
    },
    { id: "lockout-end", type: "end", outcome: "failure" },
    {
      id: "diagnostics",
      type: "show-surface",
      station: "prop-1",
      surface: "diagnostics",
    },
    { id: "arm", type: "set-prop-state", prop: "device-alpha", state: "diagnosed" },
    { id: "done", type: "complete-objective", objective: "objective-1" },
    { id: "end", type: "end", outcome: "success" },
  ],
  edges: [
    { id: "e1", source: "start", output: "out", target: "link" },
    { id: "e2", source: "link", output: "out", target: "code" },
    { id: "e3", source: "code", output: "success", target: "diagnostics" },
    { id: "e4", source: "code", output: "failure", target: "fail" },
    { id: "e5", source: "fail", output: "out", target: "limit" },
    { id: "e6", source: "limit", output: "true", target: "lockout" },
    { id: "e7", source: "limit", output: "false", target: "code" },
    { id: "e8", source: "lockout", output: "out", target: "lockout-end" },
    { id: "e9", source: "diagnostics", output: "out", target: "arm" },
    { id: "e10", source: "arm", output: "out", target: "done" },
    { id: "e11", source: "done", output: "out", target: "end" },
  ],
  variables: [
    { id: "accessCode", kind: "string", initial: "7392", secret: true },
    { id: "attempts", kind: "number", initial: 0 },
  ],
});

const pilotScenario = () => ({
  ...template("sar"),
  props: [
    {
      id: "device-alpha",
      kind: "custom" as const,
      name: "Device alpha",
      states: ["disconnected", "connected", "diagnosed", "locked"],
      initial: "disconnected",
    },
  ],
  workflows: [pilot()],
});

function broken(mutate: (w: PilotInput) => void) {
  const w = pilot();
  mutate(w);
  return workflowSchema.safeParse(w);
}

describe("workflow schema", () => {
  it("parses the pilot workflow and applies defaults", () => {
    const parsed = workflowSchema.parse(pilot());
    expect(parsed.trigger).toEqual({
      type: "prop",
      prop: "device-alpha",
      to: "connected",
    });
    expect(parsed.variables).toHaveLength(2);
    expect(parsed.nodes[0].name).toBe("");
    expect(parsed.edges).toHaveLength(11);
  });

  it("exposes ports per node type", () => {
    const parsed = workflowSchema.parse(pilot());
    const byId = new Map(parsed.nodes.map((n) => [n.id, n]));
    expect(workflowNodePorts(byId.get("start")!)).toEqual(["out"]);
    expect(workflowNodePorts(byId.get("code")!)).toEqual(["success", "failure"]);
    expect(workflowNodePorts(byId.get("limit")!)).toEqual(["true", "false"]);
    expect(workflowNodePorts(byId.get("end")!)).toEqual([]);
  });

  it("rejects duplicate node ids", () => {
    expect(broken((w) => w.nodes.push({ id: "start", type: "start" })).success).toBe(
      false,
    );
  });

  it("rejects edges that reference missing nodes or outputs", () => {
    expect(broken((w) => (w.edges[0].target = "ghost")).success).toBe(false);
    expect(broken((w) => (w.edges[0].output = "sideways")).success).toBe(false);
    expect(broken((w) => (w.edges[0].target = "start")).success).toBe(false);
    expect(
      broken((w) =>
        w.edges.push({ id: "e12", source: "end", output: "out", target: "start" }),
      ).success,
    ).toBe(false);
  });

  it("rejects task nodes with unknown or invalid configuration", () => {
    const findCode = (w: PilotInput) => {
      const node = w.nodes.find((n) => n.type === "task" && n.task === "code-entry");
      if (node?.type !== "task") throw new Error("fixture broken");
      return node;
    };
    expect(broken((w) => (findCode(w).task = "teleport")).success).toBe(false);
    expect(
      broken((w) => (findCode(w).config = { expectedValueRef: "accessCode", maxAttempts: 99 }))
        .success,
    ).toBe(false);
    expect(
      broken((w) => (findCode(w).config = { expectedValueRef: "ghost" })).success,
    ).toBe(false);
    expect(
      broken((w) => (findCode(w).config = { expectedValueRef: "attempts" })).success,
    ).toBe(false);
  });

  it("rejects conditions and variables with mismatched types", () => {
    expect(broken((w) => (w.variables[0].kind = "number")).success).toBe(false);
    expect(
      broken((w) => (w.variables[0] = { id: "accessCode", kind: "boolean", initial: "yes" }))
        .success,
    ).toBe(false);
    expect(
      broken((w) =>
        w.variables.push({ id: "mode", kind: "enum", initial: "x", values: ["a", "b"] }),
      ).success,
    ).toBe(false);
    expect(broken((w) => (w.variables[1].kind = "boolean")).success).toBe(false);
  });

  it("redacts secret variable values for projections", () => {
    const parsed = workflowSchema.parse(pilot());
    const redacted = redactWorkflowSecrets(parsed);
    expect(redacted.variables.find((v) => v.id === "accessCode")?.initial).toBe("");
    expect(redacted.variables.find((v) => v.id === "attempts")?.initial).toBe(0);
  });
});

describe("mission workflows", () => {
  it("accepts a workflow that references existing scenario entities", () => {
    expect(scenarioSchema.safeParse(pilotScenario()).success).toBe(true);
  });

  it("rejects broken scenario references", () => {
    const mutate = (fn: (w: z.output<typeof workflowSchema>) => void) => {
      const s = scenarioSchema.parse(pilotScenario());
      fn(s.workflows[0]);
      return scenarioSchema.safeParse(s).success;
    };
    expect(
      mutate((w) => (w.trigger = { type: "prop", prop: "ghost", to: "connected" })),
    ).toBe(false);
    expect(
      mutate((w) => (w.trigger = { type: "prop", prop: "device-alpha", to: "exploded" })),
    ).toBe(false);
    expect(
      mutate((w) => {
        const node = w.nodes.find((n) => n.type === "set-prop-state");
        if (node?.type === "set-prop-state") node.state = "exploded";
      }),
    ).toBe(false);
    expect(
      mutate((w) => {
        const node = w.nodes.find((n) => n.type === "show-surface");
        if (node?.type === "show-surface") node.station = "ghost";
      }),
    ).toBe(false);
    expect(
      mutate((w) => {
        const node = w.nodes.find((n) => n.type === "complete-objective");
        if (node?.type === "complete-objective") node.objective = "ghost";
      }),
    ).toBe(false);
  });

  it("hides workflow secrets from non-EXCON projections", () => {
    const state = newState("test", scenarioSchema.parse(pilotScenario()));
    expect(projectState(state, "trainer").scenario.workflows).toHaveLength(1);
    const assessor = projectState(state, "assessor").scenario.workflows;
    expect(assessor[0].variables.find((v) => v.id === "accessCode")?.initial).toBe("");
    expect(projectState(state, "hq").scenario.workflows).toEqual([]);
    expect(projectState(state, "element", "prop-1").scenario.workflows).toEqual([]);
  });
});

describe("workflow interpreter", () => {
  const workflow = () => workflowSchema.parse(pilot());

  function started() {
    const s = newState("test", scenarioSchema.parse(pilotScenario()));
    for (const event of workflowStartsForProp(
      s,
      "device-alpha",
      "connected",
      0,
    ))
      applyEvent(s, event);
    return s;
  }

  it("projects the station's running instance to the field device", () => {
    const s = started();
    const projected = projectState(s, "element", "prop-1");
    expect(projected.workflows["wf-pilot"]?.activeNodeIds).toEqual(["code"]);
    expect(projected.workflows["wf-pilot"]?.variables.accessCode).toBe("");
    expect(projected.workflows["wf-pilot"]?.variables.attempts).toBe(0);
  });

  it("starts on the prop trigger and settles on the first waiting task", () => {
    const s = started();
    const instance = s.workflows["wf-pilot"];
    expect(instance.activeNodeIds).toEqual(["code"]);
    expect(instance.surface).toEqual({ station: "prop-1", surface: "link" });
    expect(s.log.some((entry) => entry.message === "Workflow: Cable link")).toBe(
      true,
    );
  });

  it("takes the success branch, completes the objective and sets the prop", () => {
    const s = started();
    for (const event of interactionEvents(s, "prop-1", "7392"))
      applyEvent(s, event);
    expect(s.workflows["wf-pilot"].status).toBe("completed");
    expect(s.workflows["wf-pilot"].outcome).toBe("success");
    expect(s.completed).toContain("objective-1");
    expect(s.propStates["device-alpha"]).toBe("diagnosed");
    expect(interactionEvents(s, "prop-1", "7392")).toEqual([]);
    expect(s.log.some((entry) => entry.message === "Workflow: code-entry success")).toBe(true);
  });

  it("counts failures and takes the lockout branch", () => {
    const s = started();
    for (const attempt of [1, 2, 3]) {
      for (const event of interactionEvents(s, "prop-1", "0000"))
        applyEvent(s, event);
      expect(s.workflows["wf-pilot"].variables.attempts).toBe(attempt);
    }
    expect(
      s.log.filter((entry) => entry.message === "Workflow: code-entry failure"),
    ).toHaveLength(3);
    expect(s.workflows["wf-pilot"].status).toBe("completed");
    expect(s.workflows["wf-pilot"].outcome).toBe("failure");
    expect(s.workflows["wf-pilot"].surface).toEqual({
      station: "prop-1",
      surface: "lockout",
    });
  });

  it("falls back to the station code when the task has no value source", () => {
    const scenario = pilotScenario();
    const code = scenario.workflows[0].nodes.find((n) => n.type === "task");
    if (code?.type === "task")
      code.config = { ...(code.config ?? {}), expectedValueRef: "" };
    const s = newState("test", scenarioSchema.parse(scenario));
    for (const event of workflowStartsForProp(
      s,
      "device-alpha",
      "connected",
      0,
    ))
      applyEvent(s, event);
    expect(s.scenario.stations.find((st) => st.id === "prop-1")?.code).toBe(
      "7392",
    );
    for (const event of interactionEvents(s, "prop-1", "0000"))
      applyEvent(s, event);
    expect(s.workflows["wf-pilot"].variables.attempts).toBe(1);
    for (const event of interactionEvents(s, "prop-1", "7392"))
      applyEvent(s, event);
    expect(s.workflows["wf-pilot"].status).toBe("completed");
    expect(s.workflows["wf-pilot"].outcome).toBe("success");
  });

  it("replays identically from the same event sequence", () => {
    const run = () => {
      const s = started();
      for (const event of interactionEvents(s, "prop-1", "0000"))
        applyEvent(s, event);
      return s;
    };
    expect(JSON.stringify(run().workflows)).toBe(
      JSON.stringify(run().workflows),
    );
  });

  it("advances delay nodes only when the exercise clock passes the deadline", () => {
    const wf = workflowSchema.parse({
      id: "wf-delay",
      version: 1,
      trigger: { type: "manual" },
      entry: "start",
      nodes: [
        { id: "start", type: "start" },
        { id: "wait", type: "delay", seconds: 10 },
        { id: "end", type: "end", outcome: "success" },
      ],
      edges: [
        { id: "e1", source: "start", output: "out", target: "wait" },
        { id: "e2", source: "wait", output: "out", target: "end" },
      ],
    });
    const events = startWorkflow(wf, "wf-delay", 0);
    expect(events.at(-1)).toMatchObject({
      type: "workflow.transition.taken",
      to: "wait",
    });
    const s = newState(
      "test",
      scenarioSchema.parse({ ...template("sar"), workflows: [wf] }),
    );
    for (const event of events) applyEvent(s, event);
    expect(advanceWorkflow(wf, s.workflows["wf-delay"], 9)).toEqual([]);
    expect(advanceWorkflow(wf, s.workflows["wf-delay"], 10).at(-1)).toMatchObject(
      { type: "workflow.completed", outcome: "success" },
    );
  });
});

describe("task catalog", () => {
  const base = {
    version: 2 as const,
    name: "Tasks",
    mode: "LIVE" as const,
    seed: 1,
    map: { lat: 0, lng: 0, zoom: 5, tiles: "", attribution: "" },
    stations: [
      { id: "hq", name: "HQ", role: "hq" as const, module: "tracking" as const },
    ],
    props: [
      {
        id: "device-alpha",
        kind: "custom" as const,
        name: "Device",
        states: ["disconnected", "connected"],
        initial: "disconnected",
      },
    ],
  };
  const stateFor = (workflow: ReturnType<typeof workflowSchema.parse>) => {
    const s = newState(
      "test",
      scenarioSchema.parse({ ...base, workflows: [workflow] }),
    );
    for (const event of workflowStartEvents(s, workflow.id, 0))
      applyEvent(s, event);
    return s;
  };

  it("choice derives its ports from the options", () => {
    const workflow = workflowSchema.parse({
      id: "wf-choice",
      version: 1,
      trigger: { type: "manual" },
      entry: "start",
      nodes: [
        { id: "start", type: "start" },
        {
          id: "pick",
          type: "task",
          task: "choice",
          config: {
            prompt: "Pick",
            options: [
              { id: "left", label: "Left" },
              { id: "right", label: "Right" },
            ],
          },
        },
        { id: "end", type: "end", outcome: "success" },
      ],
      edges: [
        { id: "e1", source: "start", output: "out", target: "pick" },
        { id: "e2", source: "pick", output: "left", target: "end" },
        { id: "e3", source: "pick", output: "right", target: "end" },
      ],
    });
    expect(workflowNodePorts(workflow.nodes[1])).toEqual(["left", "right"]);
    const s = stateFor(workflow);
    const instance = s.workflows["wf-choice"];
    expect(instance.activeNodeIds).toEqual(["pick"]);
    expect(
      evaluateWorkflow(
        workflow,
        instance,
        { type: "interaction", value: "left" },
        1,
      )[0],
    ).toMatchObject({ type: "workflow.transition.taken", output: "left" });
    expect(
      evaluateWorkflow(
        workflow,
        instance,
        { type: "interaction", value: "ghost" },
        1,
      ),
    ).toEqual([]);
  });

  it("wait-for-event completes on a matching prop state", () => {
    const workflow = workflowSchema.parse({
      id: "wf-wait",
      version: 1,
      trigger: { type: "manual" },
      entry: "start",
      nodes: [
        { id: "start", type: "start" },
        {
          id: "wait",
          type: "task",
          task: "wait-for-event",
          config: { prop: "device-alpha", to: "connected" },
        },
        { id: "end", type: "end", outcome: "success" },
      ],
      edges: [
        { id: "e1", source: "start", output: "out", target: "wait" },
        { id: "e2", source: "wait", output: "out", target: "end" },
      ],
    });
    const s = stateFor(workflow);
    expect(workflowPropEvents(s, "device-alpha", "disconnected", 1)).toEqual(
      [],
    );
    expect(
      workflowPropEvents(s, "device-alpha", "connected", 2).at(-1),
    ).toMatchObject({ type: "workflow.completed", outcome: "success" });
  });

  it("connect completes on the configured prop state", () => {
    const workflow = workflowSchema.parse({
      id: "wf-connect",
      version: 1,
      trigger: { type: "manual" },
      entry: "start",
      nodes: [
        { id: "start", type: "start" },
        {
          id: "link",
          type: "task",
          task: "connect",
          config: {
            prompt: "Connect",
            prop: "device-alpha",
            to: "connected",
          },
        },
        { id: "end", type: "end", outcome: "success" },
      ],
      edges: [
        { id: "e1", source: "start", output: "out", target: "link" },
        { id: "e2", source: "link", output: "success", target: "end" },
      ],
    });
    const s = stateFor(workflow);
    expect(
      workflowPropEvents(s, "device-alpha", "connected", 2).some(
        (event) =>
          event.type === "workflow.transition.taken" &&
          event.from === "link" &&
          event.output === "success",
      ),
    ).toBe(true);
  });

  it("journaled report input reaches the AAR log", () => {
    const workflow = workflowSchema.parse({
      id: "wf-report",
      version: 1,
      trigger: { type: "manual" },
      entry: "start",
      nodes: [
        { id: "start", type: "start" },
        {
          id: "report",
          type: "task",
          task: "report",
          config: {
            prompt: "Report",
            fields: [{ id: "fault", label: "Fault" }],
          },
        },
        { id: "end", type: "end", outcome: "success" },
      ],
      edges: [
        { id: "e1", source: "start", output: "out", target: "report" },
        { id: "e2", source: "report", output: "success", target: "end" },
      ],
    });
    const s = stateFor(workflow);
    const events = evaluateWorkflow(
      workflow,
      s.workflows["wf-report"],
      { type: "interaction", value: JSON.stringify({ fault: "F03" }) },
      1,
    );
    expect(events[0]).toMatchObject({
      type: "workflow.transition.taken",
      input: JSON.stringify({ fault: "F03" }),
    });
    for (const event of events) applyEvent(s, event);
    expect(s.workflows["wf-report"].lastResult?.input).toContain("F03");
    expect(s.log.some((entry) => entry.message.includes("F03"))).toBe(true);
  });

  it("countdown routes the success and failure branches", () => {
    const workflow = workflowSchema.parse({
      id: "wf-countdown",
      version: 1,
      trigger: { type: "manual" },
      entry: "start",
      nodes: [
        { id: "start", type: "start" },
        {
          id: "deadline",
          type: "task",
          task: "countdown",
          config: { prompt: "Act", seconds: 30 },
        },
        { id: "ok", type: "end", outcome: "success" },
        { id: "late", type: "end", outcome: "failure" },
      ],
      edges: [
        { id: "e1", source: "start", output: "out", target: "deadline" },
        { id: "e2", source: "deadline", output: "success", target: "ok" },
        { id: "e3", source: "deadline", output: "failure", target: "late" },
      ],
    });
    const s = stateFor(workflow);
    const instance = s.workflows["wf-countdown"];
    expect(
      evaluateWorkflow(
        workflow,
        instance,
        { type: "interaction", value: "success" },
        1,
      )[0],
    ).toMatchObject({ type: "workflow.transition.taken", output: "success" });
    expect(
      evaluateWorkflow(
        workflow,
        instance,
        { type: "interaction", value: "failure" },
        1,
      )[0],
    ).toMatchObject({ type: "workflow.transition.taken", output: "failure" });
  });

  it("starts a manual workflow exactly once", () => {
    const workflow = workflowSchema.parse({
      id: "wf-manual",
      version: 1,
      trigger: { type: "manual" },
      entry: "start",
      nodes: [
        { id: "start", type: "start" },
        { id: "end", type: "end", outcome: "success" },
      ],
      edges: [{ id: "e1", source: "start", output: "out", target: "end" }],
    });
    const s = newState(
      "test",
      scenarioSchema.parse({ ...base, workflows: [workflow] }),
    );
    const first = workflowStartEvents(s, "wf-manual", 0);
    expect(first[0]).toMatchObject({ type: "workflow.started" });
    for (const event of first) applyEvent(s, event);
    expect(workflowStartEvents(s, "wf-manual", 1)).toEqual([]);
  });
});
