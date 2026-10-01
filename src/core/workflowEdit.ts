import { taskBlock } from "./taskBlocks.ts";
import * as graph from "./graphEdit.ts";
import { markGeneratedModified } from "./guided/meta.ts";
import {
  workflowNodePorts,
  workflowSchema,
  type Workflow,
  type WorkflowEdge,
  type WorkflowNode,
  type WorkflowValue,
  type WorkflowVariable,
} from "./workflow.ts";
import type { Finding } from "./missionLint.ts";
import type { Scenario } from "./training.ts";

// Pure editing helpers for the graph editor. They return new workflows; the
// editor commits them like any other mission edit (undo/redo, revision, gate).
export function workflowUid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export const workflowNodeTypes = [
  "start",
  "end",
  "task",
  "condition",
  "set-variable",
  "increment",
  "delay",
  "show-surface",
  "set-prop-state",
  "complete-objective",
] as const;
export type WorkflowNodeType = (typeof workflowNodeTypes)[number];

// i18n keys for the editor palette and node headers (German chrome).
export const workflowNodeLabels: Record<WorkflowNodeType, string> = {
  start: "node.start",
  end: "node.end",
  task: "node.task",
  condition: "node.condition",
  "set-variable": "node.setVariable",
  increment: "node.increment",
  delay: "node.delay",
  "show-surface": "node.showSurface",
  "set-prop-state": "node.setPropState",
  "complete-objective": "node.completeObjective",
};

// Human node concepts of the flow workspace. Technical node/task types stay
// the storage format; the palette and inspector speak these concepts.
export const flowNodeKinds = [
  "start",
  "action",
  "decision",
  "wait",
  "message",
  "state",
  "objective",
  "end",
] as const;
export type FlowNodeKind = (typeof flowNodeKinds)[number];

export const flowNodeLabels: Record<FlowNodeKind, string> = {
  start: "flow.node.start",
  action: "flow.node.action",
  decision: "flow.node.decision",
  wait: "flow.node.wait",
  message: "flow.node.message",
  state: "flow.node.state",
  objective: "flow.node.objective",
  end: "flow.node.end",
};

// Human labels for the task registry entries (the "action" node's variants).
export const taskTypeLabels: Record<string, string> = {
  "code-entry": "task.codeEntry",
  confirm: "task.confirm",
  choice: "task.choice",
  "wait-for-event": "task.waitForEvent",
  connect: "task.connect",
  report: "task.report",
  inspect: "task.inspect",
  transfer: "task.transfer",
  dial: "task.dial",
  "code-table": "task.codeTable",
  datasheet: "task.datasheet",
  timer: "task.timer",
  countdown: "task.countdown",
  "message-viewer": "task.messageViewer",
  "file-browser": "task.fileBrowser",
  hacking: "task.hacking",
  medical: "task.medical",
  camera: "task.camera",
  tracking: "task.tracking",
};

export function taskTypeLabel(task: string): string {
  return taskTypeLabels[task] ?? task;
}

// Human labels for the fixed node outputs; dynamic ports (choice options)
// keep their configured id.
export const portLabels: Record<string, string> = {
  out: "flow.port.out",
  success: "flow.port.success",
  failure: "flow.port.failure",
  true: "flow.port.true",
  false: "flow.port.false",
};

export function workflowPortLabel(port: string): string {
  return portLabels[port] ?? port;
}

export function flowKindOfNode(node: WorkflowNode): FlowNodeKind | "advanced" {
  switch (node.type) {
    case "start":
      return "start";
    case "end":
      return "end";
    case "condition":
      return "decision";
    case "set-variable":
      return "state";
    case "complete-objective":
      return "objective";
    case "task":
      if (node.task === "wait-for-event" || node.task === "connect")
        return "wait";
      if (node.task === "message-viewer") return "message";
      return "action";
    default:
      return "advanced";
  }
}

export function createNodeOfKind(
  workflow: Workflow,
  kind: FlowNodeKind,
  options: {
    taskType?: string;
    position?: { x: number; y: number };
  } = {},
): { workflow: Workflow; nodeId: string } {
  switch (kind) {
    case "start":
      return addNodeOfType(workflow, "start", options);
    case "end":
      return addNodeOfType(workflow, "end", options);
    case "action":
      return addNodeOfType(workflow, "task", {
        ...options,
        taskType: options.taskType ?? "confirm",
      });
    case "decision":
      return addNodeOfType(workflow, "condition", options);
    case "wait":
      return addNodeOfType(workflow, "task", {
        ...options,
        taskType: "wait-for-event",
      });
    case "message":
      return addNodeOfType(workflow, "task", {
        ...options,
        taskType: "message-viewer",
      });
    case "state":
      return addNodeOfType(workflow, "set-variable", options);
    case "objective":
      return addNodeOfType(workflow, "complete-objective", options);
  }
}

// Events that visibly start a workflow: an inject action that sets a prop
// state matches the workflow's prop trigger. Derived, never stored.
export type FlowLink = { inject: string; workflow: string };

export function flowLinks(scenario: Scenario): FlowLink[] {
  const links: FlowLink[] = [];
  for (const inject of scenario.injects)
    for (const action of inject.actions)
      if (action.type === "prop")
        for (const workflow of scenario.workflows)
          if (
            workflow.trigger.type === "prop" &&
            workflow.trigger.prop === action.target &&
            workflow.trigger.to === action.state
          )
            links.push({ inject: inject.id, workflow: workflow.id });
  return links;
}

export const workflowSurfaces = [
  "console",
  "link",
  "diagnostics",
  "lockout",
  "code-challenge",
  "confirm",
  "dial",
  "code-table",
  "datasheet",
  "timer",
  "countdown",
  "message-viewer",
  "file-browser",
] as const;

export function createWorkflow(id: string): Workflow {
  return workflowSchema.parse({
    id,
    version: 1,
    name: "Workflow",
    trigger: { type: "manual" },
    entry: "start",
    nodes: [
      { id: "start", type: "start", position: { x: 0, y: 80 } },
      { id: "end", type: "end", outcome: "success", position: { x: 480, y: 80 } },
    ],
    edges: [{ id: "edge-1", source: "start", output: "out", target: "end" }],
    variables: [],
  });
}

export function defaultValueFor(variable: WorkflowVariable): WorkflowValue {
  if (variable.kind === "boolean") return false;
  if (variable.kind === "number") return 0;
  if (variable.kind === "enum") return variable.values[0] ?? "";
  return "";
}

export function newVariable(): WorkflowVariable {
  return {
    id: workflowUid("var"),
    kind: "number",
    initial: 0,
    values: [],
    secret: false,
  };
}

function ensureNumberVariable(workflow: Workflow): {
  workflow: Workflow;
  id: string;
} {
  const existing = workflow.variables.find((v) => v.kind === "number");
  if (existing) return { workflow, id: existing.id };
  const variable: WorkflowVariable = {
    id: workflowUid("count"),
    kind: "number",
    initial: 0,
    values: [],
    secret: false,
  };
  return { workflow: addVariable(workflow, variable), id: variable.id };
}

export function addNode(workflow: Workflow, node: WorkflowNode): Workflow {
  return graph.addNode(markGeneratedModified(workflow), node);
}

export function addNodeOfType(
  workflow: Workflow,
  type: WorkflowNodeType,
  options: {
    taskType?: string;
    position?: { x: number; y: number };
  } = {},
): { workflow: Workflow; nodeId: string } {
  const id = workflowUid("n");
  const position = options.position ?? { x: 0, y: 0 };
  let next = workflow;
  let node: WorkflowNode;
  switch (type) {
    case "start":
      node = { id, name: "", type: "start", position };
      break;
    case "end":
      node = { id, name: "", type: "end", outcome: "success", position };
      break;
    case "task": {
      const taskType = options.taskType ?? "confirm";
      node = {
        id,
        name: "",
        type: "task",
        task: taskType,
        config: taskBlock(taskType)?.defaults() ?? {},
        position,
      };
      break;
    }
    case "condition": {
      const ensured = ensureNumberVariable(next);
      next = ensured.workflow;
      const variable = next.variables.find((v) => v.id === ensured.id)!;
      node = {
        id,
        name: "",
        type: "condition",
        variable: ensured.id,
        operator: ">=",
        value: defaultValueFor(variable),
        position,
      };
      break;
    }
    case "set-variable": {
      const ensured = ensureNumberVariable(next);
      next = ensured.workflow;
      const variable = next.variables.find((v) => v.id === ensured.id)!;
      node = {
        id,
        name: "",
        type: "set-variable",
        variable: ensured.id,
        value: defaultValueFor(variable),
        position,
      };
      break;
    }
    case "increment": {
      const ensured = ensureNumberVariable(next);
      next = ensured.workflow;
      node = {
        id,
        name: "",
        type: "increment",
        variable: ensured.id,
        by: 1,
        position,
      };
      break;
    }
    case "delay":
      node = { id, name: "", type: "delay", seconds: 5, position };
      break;
    case "show-surface":
      node = {
        id,
        name: "",
        type: "show-surface",
        station: "",
        surface: "console",
        position,
      };
      break;
    case "set-prop-state":
      node = {
        id,
        name: "",
        type: "set-prop-state",
        prop: "",
        state: "",
        position,
      };
      break;
    case "complete-objective":
      node = {
        id,
        name: "",
        type: "complete-objective",
        objective: "",
        position,
      };
      break;
  }
  return { workflow: addNode(next, node), nodeId: id };
}

export function removeNode(workflow: Workflow, nodeId: string): Workflow {
  return graph.removeNode(markGeneratedModified(workflow), nodeId);
}

export function replaceNode(workflow: Workflow, node: WorkflowNode): Workflow {
  const previous = workflow.nodes.find((row) => row.id === node.id);
  // Editing generated content freezes it against automatic reconciliation.
  const next: WorkflowNode = previous?.origin
    ? {
        ...node,
        origin: { ...(node.origin ?? previous.origin), userModified: true },
      }
    : node;
  // A type or task change can retire outputs; drop their edges so the mission
  // never keeps dangling connections. Config edits keep edges on purpose.
  const changedShape =
    !!previous &&
    (previous.type !== next.type ||
      (previous.type === "task" &&
        next.type === "task" &&
        previous.task !== next.task));
  const ports = changedShape
    ? new Set(workflowNodePorts(next))
    : undefined;
  return {
    ...workflow,
    nodes: workflow.nodes.map((row) => (row.id === next.id ? next : row)),
    edges: ports
      ? workflow.edges.filter(
          (edge) => edge.source !== next.id || ports.has(edge.output),
        )
      : workflow.edges,
  };
}

export function setNodePosition(
  workflow: Workflow,
  nodeId: string,
  position: { x: number; y: number },
): Workflow {
  return {
    ...workflow,
    nodes: workflow.nodes.map((row) =>
      row.id === nodeId ? { ...markGeneratedModified(row), position } : row,
    ),
  };
}

export function addEdge(workflow: Workflow, edge: WorkflowEdge): Workflow {
  return graph.connect(markGeneratedModified(workflow), edge);
}

export function removeEdge(workflow: Workflow, edgeId: string): Workflow {
  return graph.disconnect(markGeneratedModified(workflow), edgeId);
}

export function edgeForOutput(
  workflow: Workflow,
  nodeId: string,
  output: string,
): WorkflowEdge | undefined {
  return graph.edgeForOutput(workflow, nodeId, output);
}

// Accessible alternative to dragging a connection: pick a target per output.
export function setOutputTarget(
  workflow: Workflow,
  nodeId: string,
  output: string,
  target: string,
): Workflow {
  return graph.setOutputTarget(
    markGeneratedModified(workflow),
    nodeId,
    output,
    target,
    () => workflowUid("e"),
  );
}

export function addVariable(
  workflow: Workflow,
  variable: WorkflowVariable,
): Workflow {
  if (workflow.variables.some((v) => v.id === variable.id)) return workflow;
  const marked = markGeneratedModified(workflow);
  return { ...marked, variables: [...marked.variables, variable] };
}

export function replaceVariable(
  workflow: Workflow,
  variable: WorkflowVariable,
): Workflow {
  const marked = markGeneratedModified(workflow);
  return {
    ...marked,
    variables: marked.variables.map((v) =>
      v.id === variable.id ? variable : v,
    ),
  };
}

export function removeVariable(
  workflow: Workflow,
  variableId: string,
): Workflow {
  const marked = markGeneratedModified(workflow);
  return {
    ...marked,
    variables: marked.variables.filter((v) => v.id !== variableId),
  };
}

// Renaming keeps node and task references valid.
export function renameVariable(
  workflow: Workflow,
  from: string,
  to: string,
): Workflow {
  if (!to || from === to || workflow.variables.some((v) => v.id === to))
    return workflow;
  const marked = markGeneratedModified(workflow);
  return {
    ...marked,
    variables: marked.variables.map((v) =>
      v.id === from ? { ...v, id: to } : v,
    ),
    nodes: marked.nodes.map((node) => {
      if (
        (node.type === "condition" ||
          node.type === "set-variable" ||
          node.type === "increment") &&
        node.variable === from
      )
        return markGeneratedModified({ ...node, variable: to });
      if (
        node.type === "task" &&
        node.config.expectedValueRef === from
      )
        return markGeneratedModified({
          ...node,
          config: { ...node.config, expectedValueRef: to },
        });
      return node;
    }),
  };
}

// Layered layout for workflows without stored positions (rank = BFS depth).
export function autoLayout(
  workflow: Workflow,
): Record<string, { x: number; y: number }> {
  const depth = new Map<string, number>([[workflow.entry, 0]]);
  const queue = [workflow.entry];
  while (queue.length) {
    const id = queue.shift()!;
    for (const edge of workflow.edges) {
      if (edge.source !== id || depth.has(edge.target)) continue;
      depth.set(edge.target, (depth.get(id) ?? 0) + 1);
      queue.push(edge.target);
    }
  }
  const rows = new Map<number, number>();
  const out: Record<string, { x: number; y: number }> = {};
  for (const node of workflow.nodes) {
    const rank = depth.get(node.id) ?? 0;
    const row = rows.get(rank) ?? 0;
    rows.set(rank, row + 1);
    out[node.id] = { x: rank * 260, y: row * 130 };
  }
  return out;
}

export function nodeSummary(node: WorkflowNode): string {
  switch (node.type) {
    case "task":
      return node.task;
    case "condition":
      return `${node.variable} ${node.operator} ${String(node.value)}`;
    case "set-variable":
      return `${node.variable} = ${String(node.value)}`;
    case "increment":
      return `${node.variable} +${node.by}`;
    case "delay":
      return `${node.seconds}s`;
    case "show-surface":
      return `${node.station || "?"} · ${node.surface}`;
    case "set-prop-state":
      return `${node.prop || "?"} → ${node.state || "?"}`;
    case "complete-objective":
      return node.objective || "?";
    case "end":
      return node.outcome;
    case "start":
      return "";
  }
}

// Findings that belong to one node, derived from the linter id prefixes.
export function nodeFindingIds(
  findings: Finding[],
  workflowId: string,
  nodeId: string,
): Finding[] {
  return findings.filter(
    (finding) =>
      finding.path.collection === "workflows" &&
      finding.path.id === workflowId &&
      (finding.id.startsWith(`graph-wf-exit-${workflowId}-${nodeId}-`) ||
        finding.id.startsWith(`graph-wf-unreachable-${workflowId}-${nodeId}`) ||
        finding.id.startsWith(`graph-wf-terminal-${workflowId}-${nodeId}`) ||
        finding.id.startsWith(`graph-wf-task-${workflowId}-${nodeId}`)),
  );
}
