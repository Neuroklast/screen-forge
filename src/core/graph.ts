import type { Finding } from "./missionLint.ts";
import type { Scenario } from "./training.ts";
import { taskBlock } from "./taskBlocks.ts";
import {
  workflowNodePorts,
  workflowSettles,
  type Workflow,
} from "./workflow.ts";
import { t } from "../i18n/index.ts";

const EXTERNAL_TRIGGERS = ["zone", "prop", "signal"];

// Finds nodes that participate in a cycle of the escalation graph.
function findCycleNodes(edges: Map<string, string[]>): Set<string> {
  const color = new Map<string, number>();
  const inCycle = new Set<string>();
  const stack: string[] = [];
  const visit = (node: string): void => {
    color.set(node, 1);
    stack.push(node);
    for (const next of edges.get(node) || []) {
      const c = color.get(next) || 0;
      if (c === 1) {
        const start = stack.indexOf(next);
        for (let i = start; i < stack.length; i++) inCycle.add(stack[i]);
      } else if (c === 0) {
        visit(next);
      }
    }
    stack.pop();
    color.set(node, 2);
  };
  for (const node of edges.keys()) if (!color.get(node)) visit(node);
  return inCycle;
}

// Workflow graph checks: every port needs an exit, every node must be
// reachable from the entry, and automatic cycles without a wait are errors.
function lintWorkflow(workflow: Workflow): Finding[] {
  const out: Finding[] = [];
  const error = (id: string, message: string) =>
    out.push({
      id,
      severity: "error",
      message,
      path: { collection: "workflows", id: workflow.id },
    });
  const outputs = new Map<string, Set<string>>();
  const adjacency = new Map<string, string[]>();
  for (const edge of workflow.edges) {
    const ports = outputs.get(edge.source) ?? new Set<string>();
    ports.add(edge.output);
    outputs.set(edge.source, ports);
    adjacency.set(edge.source, [
      ...(adjacency.get(edge.source) ?? []),
      edge.target,
    ]);
  }
  for (const node of workflow.nodes) {
    const name = node.name || node.id;
    if (node.type === "task" && !taskBlock(node.task))
      error(`graph-wf-task-${workflow.id}-${node.id}`, t("graph.wfTask", { name }));
    for (const port of workflowNodePorts(node))
      if (!outputs.get(node.id)?.has(port))
        error(
          `graph-wf-exit-${workflow.id}-${node.id}-${port}`,
          t("graph.wfExit", { name, port }),
        );
  }
  const reachable = new Set<string>();
  const stack = [workflow.entry];
  while (stack.length) {
    const nodeId = stack.pop();
    if (!nodeId || reachable.has(nodeId)) continue;
    reachable.add(nodeId);
    for (const next of adjacency.get(nodeId) ?? []) stack.push(next);
  }
  for (const node of workflow.nodes)
    if (!reachable.has(node.id))
      error(
        `graph-wf-unreachable-${workflow.id}-${node.id}`,
        t("graph.wfUnreachable", { name: node.name || node.id }),
      );
  // Every reachable node must have a terminal path: reverse reachability from
  // the end nodes. A branch that only leads back into itself is an error even
  // when every port is connected.
  const reverse = new Map<string, string[]>();
  for (const edge of workflow.edges)
    reverse.set(edge.target, [
      ...(reverse.get(edge.target) ?? []),
      edge.source,
    ]);
  const canReachEnd = new Set(
    workflow.nodes.filter((node) => node.type === "end").map((node) => node.id),
  );
  const walk = [...canReachEnd];
  while (walk.length) {
    const nodeId = walk.pop();
    if (!nodeId) continue;
    for (const previous of reverse.get(nodeId) ?? [])
      if (!canReachEnd.has(previous)) {
        canReachEnd.add(previous);
        walk.push(previous);
      }
  }
  for (const node of workflow.nodes) {
    if (!reachable.has(node.id) || canReachEnd.has(node.id)) continue;
    error(
      `graph-wf-terminal-${workflow.id}-${node.id}`,
      t("graph.wfNoTerminal", { name: node.name || node.id }),
    );
  }
  if (!workflowSettles(workflow))
    error(
      `graph-wf-loop-${workflow.id}`,
      t("graph.wfLoop", { name: workflow.name }),
    );
  return out;
}

// Graph-level validation on top of the schema/linter: dangling escalation,
// missing training intent and dependency cycles.
export function lintGraph(s: Scenario): Finding[] {
  const out: Finding[] = [];
  const error = (id: string, message: string, target?: string) =>
    out.push({
      id,
      severity: "error",
      message,
      path: { collection: "injects", id: target },
    });
  const warn = (id: string, message: string, target?: string) =>
    out.push({
      id,
      severity: "warning",
      message,
      path: { collection: "injects", id: target },
    });

  const ids = new Set(s.injects.map((r) => r.id));
  for (const r of s.injects) {
    if (r.escalation && !ids.has(r.escalation))
      error(`graph-escalation-${r.id}`, t("graph.escalation", { name: r.name }), r.id);
    if (!r.purpose)
      warn(`graph-purpose-${r.id}`, t("graph.purpose", { name: r.name }), r.id);
    if (r.expectedOutcome.length === 0)
      warn(
        `graph-outcome-${r.id}`,
        t("graph.outcome", { name: r.name }),
        r.id,
      );
    if (EXTERNAL_TRIGGERS.includes(r.trigger) && !r.fallback)
      warn(
        `graph-fallback-${r.id}`,
        t("graph.fallback", { name: r.name }),
        r.id,
      );
  }

  const edges = new Map<string, string[]>();
  for (const r of s.injects)
    edges.set(
      r.id,
      r.escalation && ids.has(r.escalation) ? [r.escalation] : [],
    );
  for (const id of findCycleNodes(edges)) {
    const r = s.injects.find((x) => x.id === id);
    if (!r) continue;
    if (!r.repeatable)
      error(`graph-cycle-${id}`, t("graph.cycle", { name: r.name }), id);
    else if (r.maxIterations <= 1)
      error(`graph-cycle-cap-${id}`, t("graph.cycleCap", { name: r.name }), id);
    else if (!r.exitCondition)
      warn(
        `graph-cycle-exit-${id}`,
        t("graph.cycleExit", { name: r.name }),
        id,
      );
  }

  for (const workflow of s.workflows) out.push(...lintWorkflow(workflow));

  return out;
}
