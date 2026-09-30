import { z } from "zod";
import { taskBlock, taskBlockPortsFor } from "./taskBlocks.ts";

// Shared by the browser and Node 24. Pure data and validation only: the
// deterministic interpreter (evaluateWorkflow/advanceWorkflow) is added by I3
// and MUST NOT touch React, sockets or wall-clock timers.
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/);
const label = z.string().trim().min(1).max(120);
const value = z.union([z.boolean(), z.number().finite(), z.string().max(200)]);

export const workflowVariableKinds = [
  "boolean",
  "number",
  "string",
  "enum",
] as const;
export type WorkflowVariableKind = (typeof workflowVariableKinds)[number];

export const conditionOperators = [
  "==",
  "!=",
  "<",
  "<=",
  ">",
  ">=",
] as const;

export const workflowVariableSchema = z.object({
  id,
  kind: z.enum(workflowVariableKinds),
  initial: value.default(""),
  values: z.array(z.string().max(60)).max(20).default([]),
  secret: z.boolean().default(false),
});

// `position` is editor layout only; the interpreter ignores it.
const nodeBase = {
  id,
  name: z.string().max(60).default(""),
  position: z
    .object({ x: z.number().finite(), y: z.number().finite() })
    .optional(),
};

export const workflowNodeSchema = z.discriminatedUnion("type", [
  z.object({ ...nodeBase, type: z.literal("start") }),
  z.object({
    ...nodeBase,
    type: z.literal("end"),
    outcome: z.enum(["success", "failure"]).default("success"),
  }),
  z.object({
    ...nodeBase,
    type: z.literal("task"),
    task: z.string().max(40),
    config: z.record(z.string(), z.unknown()).default({}),
  }),
  z.object({
    ...nodeBase,
    type: z.literal("condition"),
    variable: id,
    operator: z.enum(conditionOperators),
    value,
  }),
  z.object({
    ...nodeBase,
    type: z.literal("set-variable"),
    variable: id,
    value,
  }),
  z.object({
    ...nodeBase,
    type: z.literal("increment"),
    variable: id,
    by: z.number().finite().default(1),
  }),
  z.object({
    ...nodeBase,
    type: z.literal("delay"),
    seconds: z.number().finite().min(0).max(86400),
  }),
  z.object({
    ...nodeBase,
    type: z.literal("show-surface"),
    station: z.string().max(40),
    surface: z.string().max(40),
  }),
  z.object({
    ...nodeBase,
    type: z.literal("set-prop-state"),
    prop: z.string().max(40),
    state: z.string().max(40),
  }),
  z.object({
    ...nodeBase,
    type: z.literal("complete-objective"),
    objective: z.string().max(40),
  }),
]);

export const workflowTriggerSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("manual") }),
  z.object({
    type: z.literal("prop"),
    prop: z.string().max(40),
    to: z.string().max(40),
  }),
]);

export const workflowEdgeSchema = z.object({
  id,
  source: id,
  output: z.string().max(40),
  target: id,
});

export function workflowNodePorts(
  node: z.infer<typeof workflowNodeSchema>,
): string[] {
  switch (node.type) {
    case "start":
    case "set-variable":
    case "increment":
    case "delay":
    case "show-surface":
    case "set-prop-state":
    case "complete-objective":
      return ["out"];
    case "task":
      return taskBlockPortsFor(node.task, node.config);
    case "condition":
      return ["true", "false"];
    case "end":
      return [];
  }
}

function kindMatches(kind: WorkflowVariableKind, v: unknown): boolean {
  if (kind === "boolean") return typeof v === "boolean";
  if (kind === "number") return typeof v === "number";
  return typeof v === "string";
}

export const workflowSchema = z
  .object({
    id,
    version: z.literal(1),
    name: label.default("Workflow"),
    trigger: workflowTriggerSchema.default({ type: "manual" }),
    entry: id,
    nodes: z.array(workflowNodeSchema).min(2).max(200),
    edges: z.array(workflowEdgeSchema).max(400).default([]),
    variables: z.array(workflowVariableSchema).max(40).default([]),
  })
  .superRefine((w, ctx) => {
    const issue = (message: string) => ctx.addIssue({ code: "custom", message });
    const nodeIds = new Set(w.nodes.map((n) => n.id));
    if (nodeIds.size !== w.nodes.length) issue("Node IDs must be unique");
    const edgeIds = new Set(w.edges.map((e) => e.id));
    if (edgeIds.size !== w.edges.length) issue("Edge IDs must be unique");
    const variableIds = new Set(w.variables.map((v) => v.id));
    if (variableIds.size !== w.variables.length)
      issue("Variable IDs must be unique");
    const variables = new Map(w.variables.map((v) => [v.id, v]));
    const entry = w.nodes.find((n) => n.id === w.entry);
    if (!entry || entry.type !== "start")
      issue("Entry must reference a start node");
    const nodes = new Map(w.nodes.map((n) => [n.id, n]));
    for (const e of w.edges) {
      const source = nodes.get(e.source);
      if (!source || !nodes.has(e.target)) {
        issue(`Edge ${e.id} references a missing node`);
        continue;
      }
      if (!workflowNodePorts(source).includes(e.output))
        issue(`Edge ${e.id} uses an undefined output`);
      if (e.target === w.entry) issue("The start node cannot be re-entered");
    }
    for (const n of w.nodes) {
      if (n.type === "end") {
        if (w.edges.some((e) => e.source === n.id))
          issue(`End node ${n.id} must not have outgoing edges`);
      }
      if (n.type === "condition" || n.type === "set-variable") {
        const variable = variables.get(n.variable);
        if (!variable) {
          issue(`Unknown variable ${n.variable}`);
          continue;
        }
        if (!kindMatches(variable.kind, n.value))
          issue(`Value type does not match variable ${n.variable}`);
      }
      if (n.type === "increment") {
        const variable = variables.get(n.variable);
        if (!variable || variable.kind !== "number")
          issue(`Increment needs a number variable (${n.variable})`);
      }
      if (n.type === "task") {
        const block = taskBlock(n.task);
        if (!block) {
          issue(`Unknown task type ${n.task}`);
          continue;
        }
        const parsed = block.schema.safeParse(n.config);
        if (!parsed.success) issue(`Invalid config for task ${n.task}`);
        if (
          n.task === "code-entry" &&
          typeof n.config.expectedValueRef === "string" &&
          n.config.expectedValueRef
        ) {
          const variable = variables.get(n.config.expectedValueRef);
          if (!variable || variable.kind !== "string")
            issue(
              `Code entry needs a string variable (${n.config.expectedValueRef})`,
            );
        }
      }
    }
    for (const v of w.variables) {
      if (!kindMatches(v.kind, v.initial))
        issue(`Initial value does not match variable ${v.id}`);
      if (v.kind === "enum" && !v.values.includes(String(v.initial)))
        issue(`Enum variable ${v.id} needs a matching initial value`);
    }
  });

export type Workflow = z.infer<typeof workflowSchema>;
export type WorkflowNode = z.infer<typeof workflowNodeSchema>;
export type WorkflowEdge = z.infer<typeof workflowEdgeSchema>;
export type WorkflowVariable = z.infer<typeof workflowVariableSchema>;
export type WorkflowValue = z.infer<typeof value>;
export type WorkflowOperator = (typeof conditionOperators)[number];

// Journaled workflow events. The interpreter returns these; the reducer in
// events.ts applies them. Nothing here touches React, sockets or wall clocks.
export const workflowEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("workflow.started"),
    instance: z.string().max(60),
    workflow: z.string().max(40),
    at: z.number().min(0),
  }),
  z.object({
    type: z.literal("workflow.transition.taken"),
    instance: z.string().max(60),
    from: id,
    output: z.string().max(40),
    to: id,
    at: z.number().min(0),
    // Player input for reporting tasks; code entries never carry their value.
    input: z.string().max(500).optional(),
  }),
  z.object({
    type: z.literal("workflow.variable.changed"),
    instance: z.string().max(60),
    variable: id,
    value,
    at: z.number().min(0),
  }),
  z.object({
    type: z.literal("workflow.completed"),
    instance: z.string().max(60),
    outcome: z.enum(["success", "failure"]),
    at: z.number().min(0),
  }),
]);
export type WorkflowEvent = z.infer<typeof workflowEventSchema>;

export type WorkflowInstance = {
  id: string;
  workflowId: string;
  activeNodeIds: string[];
  status: "running" | "completed";
  outcome?: "success" | "failure";
  variables: Record<string, WorkflowValue>;
  surface?: { station: string; surface: string };
  enteredAt: Record<string, number>;
  startedAt: number;
  updatedAt: number;
  // The outcome of the last interaction with a task node, kept across the
  // automatic follow-up transitions so surfaces can show feedback.
  lastResult?: { node: string; output: string; at: number; input?: string };
  // Projection-only: the task the station must solve right now, with registry
  // defaults applied and no secret values. The authoritative state never
  // stores it; surfaces render from it.
  activeTask?: { node: string; task: string; config: Record<string, unknown> };
};

// Resolves the active task of an instance for the field surface.
export function activeTaskOf(
  workflow: Workflow,
  instance: WorkflowInstance,
): WorkflowInstance["activeTask"] {
  if (instance.status !== "running") return undefined;
  for (const nodeId of instance.activeNodeIds) {
    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (node?.type !== "task") continue;
    const block = taskBlock(node.task);
    const parsed = block?.schema.safeParse(node.config);
    return {
      node: node.id,
      task: node.task,
      config: parsed?.success
        ? (parsed.data as Record<string, unknown>)
        : {},
    };
  }
  return undefined;
}

export function compareValues(
  current: WorkflowValue | undefined,
  operator: WorkflowOperator,
  expected: WorkflowValue,
): boolean {
  if (operator === "==") return current === expected;
  if (operator === "!=") return current !== expected;
  if (typeof current !== "number" || typeof expected !== "number") return false;
  if (operator === "<") return current < expected;
  if (operator === "<=") return current <= expected;
  if (operator === ">") return current > expected;
  return current >= expected;
}

// A run of automatic nodes (no waiting task, no delay) is bounded; a cycle
// without a waiting node is a linter error and stops here without effects.
const MAX_STEPS = 200;

function nodeMap(workflow: Workflow): Map<string, WorkflowNode> {
  return new Map(workflow.nodes.map((n) => [n.id, n]));
}

function move(
  workflow: Workflow,
  draft: WorkflowInstance,
  from: string,
  output: string,
  clock: number,
  events: WorkflowEvent[],
  input?: string,
): boolean {
  const edge = workflow.edges.find(
    (e) => e.source === from && e.output === output,
  );
  draft.activeNodeIds = draft.activeNodeIds.filter((nodeId) => nodeId !== from);
  if (!edge) return false;
  if (!draft.activeNodeIds.includes(edge.target))
    draft.activeNodeIds.push(edge.target);
  draft.enteredAt[edge.target] = clock;
  draft.updatedAt = clock;
  events.push({
    type: "workflow.transition.taken",
    instance: draft.id,
    from,
    output,
    to: edge.target,
    at: clock,
    input,
  });
  return true;
}

function step(
  workflow: Workflow,
  draft: WorkflowInstance,
  node: WorkflowNode,
  clock: number,
  events: WorkflowEvent[],
): boolean {
  switch (node.type) {
    case "start":
    case "show-surface":
    case "set-prop-state":
    case "complete-objective":
      return move(workflow, draft, node.id, "out", clock, events);
    case "set-variable":
      draft.variables[node.variable] = node.value;
      events.push({
        type: "workflow.variable.changed",
        instance: draft.id,
        variable: node.variable,
        value: node.value,
        at: clock,
      });
      return move(workflow, draft, node.id, "out", clock, events);
    case "increment": {
      const next = Number(draft.variables[node.variable] ?? 0) + node.by;
      draft.variables[node.variable] = next;
      events.push({
        type: "workflow.variable.changed",
        instance: draft.id,
        variable: node.variable,
        value: next,
        at: clock,
      });
      return move(workflow, draft, node.id, "out", clock, events);
    }
    case "condition":
      return move(
        workflow,
        draft,
        node.id,
        compareValues(
          draft.variables[node.variable],
          node.operator,
          node.value,
        )
          ? "true"
          : "false",
        clock,
        events,
      );
    case "end":
      draft.status = "completed";
      draft.outcome = node.outcome;
      draft.activeNodeIds = draft.activeNodeIds.filter(
        (nodeId) => nodeId !== node.id,
      );
      draft.updatedAt = clock;
      events.push({
        type: "workflow.completed",
        instance: draft.id,
        outcome: node.outcome,
        at: clock,
      });
      return true;
    case "task":
    case "delay":
      return false;
  }
}

// Runs automatic nodes until the instance waits for an interaction or a delay.
// Returns false when the step cap is hit: a cycle of automatic nodes without
// an exit. The linter reports that as an infinite loop.
function settle(
  workflow: Workflow,
  draft: WorkflowInstance,
  clock: number,
  events: WorkflowEvent[],
  nodes: Map<string, WorkflowNode>,
): boolean {
  for (let steps = 0; steps < MAX_STEPS; steps++) {
    if (draft.status === "completed") return true;
    const node = draft.activeNodeIds
      .map((nodeId) => nodes.get(nodeId))
      .find((candidate) => candidate?.type !== "task" && candidate?.type !== "delay");
    if (!node) return true;
    if (!step(workflow, draft, node, clock, events)) return true;
  }
  return false;
}

// Linter helper: can the workflow run from its entry without an interaction
// until it waits or completes? A false result means an automatic cycle.
export function workflowSettles(workflow: Workflow): boolean {
  const draft: WorkflowInstance = {
    id: workflow.id,
    workflowId: workflow.id,
    activeNodeIds: [workflow.entry],
    status: "running",
    variables: Object.fromEntries(
      workflow.variables.map((v) => [v.id, v.initial]),
    ),
    enteredAt: { [workflow.entry]: 0 },
    startedAt: 0,
    updatedAt: 0,
  };
  return settle(workflow, draft, 0, [], nodeMap(workflow));
}

function taskOutput(
  draft: WorkflowInstance,
  node: Extract<WorkflowNode, { type: "task" }>,
  value: string,
  fallbackSecret: string,
): string | null {
  const block = taskBlock(node.task);
  const parsed = block?.schema.safeParse(node.config);
  if (!parsed?.success) return null;
  if (node.task === "code-entry") {
    const ref = String(
      (parsed.data as { expectedValueRef: string }).expectedValueRef || "",
    );
    // The expected value comes from a (secret) workflow variable; without a
    // reference the station code stays the default secret source.
    const expected = ref ? draft.variables[ref] : fallbackSecret;
    if (expected === undefined || expected === "") return "failure";
    return String(expected) === value ? "success" : "failure";
  }
  if (node.task === "choice") {
    // Unknown or stale option ids produce no transition, never a wrong branch.
    const options = (parsed.data as { options: { id: string }[] }).options;
    return options.some((option) => option.id === value) ? value : null;
  }
  return "success";
}

export function startWorkflow(
  workflow: Workflow,
  instanceId: string,
  clock: number,
): WorkflowEvent[] {
  const draft: WorkflowInstance = {
    id: instanceId,
    workflowId: workflow.id,
    activeNodeIds: [workflow.entry],
    status: "running",
    variables: Object.fromEntries(
      workflow.variables.map((v) => [v.id, v.initial]),
    ),
    enteredAt: { [workflow.entry]: clock },
    startedAt: clock,
    updatedAt: clock,
  };
  const events: WorkflowEvent[] = [
    {
      type: "workflow.started",
      instance: instanceId,
      workflow: workflow.id,
      at: clock,
    },
  ];
  settle(workflow, draft, clock, events, nodeMap(workflow));
  return events;
}

// Player input or a prop change for the active task. Returns no events when
// the instance has no matching task (stale or duplicate input), which keeps
// effects at-most-once.
export function evaluateWorkflow(
  workflow: Workflow,
  instance: WorkflowInstance,
  event:
    | { type: "interaction"; value: string }
    | { type: "prop"; prop: string; state: string },
  clock: number,
  fallbackSecret = "",
): WorkflowEvent[] {
  const draft = structuredClone(instance);
  const events: WorkflowEvent[] = [];
  const nodes = nodeMap(workflow);
  if (event.type === "prop") {
    for (const nodeId of [...draft.activeNodeIds]) {
      const node = nodes.get(nodeId);
      if (node?.type !== "task") continue;
      if (node.task !== "wait-for-event" && node.task !== "connect") continue;
      const parsed = taskBlock(node.task)?.schema.safeParse(node.config);
      if (!parsed?.success) continue;
      const config = parsed.data as { prop: string; to: string };
      if (config.prop !== event.prop || config.to !== event.state) continue;
      const output = node.task === "connect" ? "success" : "out";
      if (move(workflow, draft, node.id, output, clock, events))
        settle(workflow, draft, clock, events, nodes);
    }
    return events;
  }
  for (const nodeId of [...draft.activeNodeIds]) {
    const node = nodes.get(nodeId);
    if (node?.type !== "task") continue;
    const output = taskOutput(draft, node, event.value, fallbackSecret);
    if (!output) continue;
    move(
      workflow,
      draft,
      node.id,
      output,
      clock,
      events,
      node.task === "report" ? event.value : undefined,
    );
    settle(workflow, draft, clock, events, nodes);
    break;
  }
  return events;
}

// Delay nodes complete when the exercise clock passes their deadline. Called
// on the server tick; pause freezes the clock, so delays freeze too.
export function advanceWorkflow(
  workflow: Workflow,
  instance: WorkflowInstance,
  clock: number,
): WorkflowEvent[] {
  const draft = structuredClone(instance);
  const events: WorkflowEvent[] = [];
  const nodes = nodeMap(workflow);
  for (const nodeId of [...draft.activeNodeIds]) {
    const node = nodes.get(nodeId);
    if (node?.type !== "delay") continue;
    if ((draft.enteredAt[nodeId] ?? draft.startedAt) + node.seconds > clock)
      continue;
    move(workflow, draft, node.id, "out", clock, events);
    settle(workflow, draft, clock, events, nodes);
  }
  return events;
}

export function redactInstanceSecrets(
  workflow: Workflow,
  instance: WorkflowInstance,
): WorkflowInstance {
  const out = structuredClone(instance);
  for (const v of workflow.variables)
    if (v.secret)
      out.variables[v.id] =
        v.kind === "boolean" ? false : v.kind === "number" ? 0 : "";
  return out;
}

// Secret values never reach players; the projection keeps the shape and blanks
// the initial value so surfaces can still show that the variable exists.
export function redactWorkflowSecrets(workflow: Workflow): Workflow {
  return {
    ...workflow,
    variables: workflow.variables.map((v) =>
      v.secret
        ? {
            ...v,
            initial: v.kind === "boolean" ? false : v.kind === "number" ? 0 : "",
          }
        : v,
    ),
  };
}
