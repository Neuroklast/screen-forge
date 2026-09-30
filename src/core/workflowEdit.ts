import { taskBlock } from "./taskBlocks.ts";
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

export const workflowSurfaces = [
  "console",
  "link",
  "diagnostics",
  "lockout",
  "code-challenge",
  "confirm",
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
  return { ...workflow, nodes: [...workflow.nodes, node] };
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
  if (nodeId === workflow.entry) return workflow;
  return {
    ...workflow,
    nodes: workflow.nodes.filter((node) => node.id !== nodeId),
    edges: workflow.edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId,
    ),
  };
}

export function replaceNode(workflow: Workflow, node: WorkflowNode): Workflow {
  const previous = workflow.nodes.find((row) => row.id === node.id);
  // A type or task change can retire outputs; drop their edges so the mission
  // never keeps dangling connections. Config edits keep edges on purpose.
  const changedShape =
    !!previous &&
    (previous.type !== node.type ||
      (previous.type === "task" &&
        node.type === "task" &&
        previous.task !== node.task));
  const ports = changedShape
    ? new Set(workflowNodePorts(node))
    : undefined;
  return {
    ...workflow,
    nodes: workflow.nodes.map((row) => (row.id === node.id ? node : row)),
    edges: ports
      ? workflow.edges.filter(
          (edge) => edge.source !== node.id || ports.has(edge.output),
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
    nodes: workflow.nodes.map((node) =>
      node.id === nodeId ? { ...node, position } : node,
    ),
  };
}

export function addEdge(workflow: Workflow, edge: WorkflowEdge): Workflow {
  return { ...workflow, edges: [...workflow.edges, edge] };
}

export function removeEdge(workflow: Workflow, edgeId: string): Workflow {
  return {
    ...workflow,
    edges: workflow.edges.filter((edge) => edge.id !== edgeId),
  };
}

export function edgeForOutput(
  workflow: Workflow,
  nodeId: string,
  output: string,
): WorkflowEdge | undefined {
  return workflow.edges.find(
    (edge) => edge.source === nodeId && edge.output === output,
  );
}

// Accessible alternative to dragging a connection: pick a target per output.
export function setOutputTarget(
  workflow: Workflow,
  nodeId: string,
  output: string,
  target: string,
): Workflow {
  const existing = edgeForOutput(workflow, nodeId, output);
  const edges = workflow.edges.filter(
    (edge) => !(edge.source === nodeId && edge.output === output),
  );
  if (!target) return { ...workflow, edges };
  return {
    ...workflow,
    edges: [
      ...edges,
      {
        id: existing?.id ?? workflowUid("e"),
        source: nodeId,
        output,
        target,
      },
    ],
  };
}

export function addVariable(
  workflow: Workflow,
  variable: WorkflowVariable,
): Workflow {
  if (workflow.variables.some((v) => v.id === variable.id)) return workflow;
  return { ...workflow, variables: [...workflow.variables, variable] };
}

export function replaceVariable(
  workflow: Workflow,
  variable: WorkflowVariable,
): Workflow {
  return {
    ...workflow,
    variables: workflow.variables.map((v) =>
      v.id === variable.id ? variable : v,
    ),
  };
}

export function removeVariable(
  workflow: Workflow,
  variableId: string,
): Workflow {
  return {
    ...workflow,
    variables: workflow.variables.filter((v) => v.id !== variableId),
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
  return {
    ...workflow,
    variables: workflow.variables.map((v) =>
      v.id === from ? { ...v, id: to } : v,
    ),
    nodes: workflow.nodes.map((node) => {
      if (
        (node.type === "condition" ||
          node.type === "set-variable" ||
          node.type === "increment") &&
        node.variable === from
      )
        return { ...node, variable: to };
      if (
        node.type === "task" &&
        node.config.expectedValueRef === from
      )
        return { ...node, config: { ...node.config, expectedValueRef: to } };
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
        finding.id.startsWith(`graph-wf-task-${workflowId}-${nodeId}`)),
  );
}
