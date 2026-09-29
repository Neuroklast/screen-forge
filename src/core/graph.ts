import type { Finding } from "./missionLint";
import type { Scenario } from "./training";

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
      error(`graph-escalation-${r.id}`, `Folgeeintrag fehlt für ${r.name}.`, r.id);
    if (!r.purpose)
      warn(`graph-purpose-${r.id}`, `Ereignis ohne Zweck: ${r.name}.`, r.id);
    if (r.expectedOutcome.length === 0)
      warn(
        `graph-outcome-${r.id}`,
        `Kein erwartetes Ergebnis: ${r.name}.`,
        r.id,
      );
    if (EXTERNAL_TRIGGERS.includes(r.trigger) && !r.fallback)
      warn(
        `graph-fallback-${r.id}`,
        `Kein Fallback bei externer Zustellung: ${r.name}.`,
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
      error(`graph-cycle-${id}`, `Zyklus ohne Wiederholungsregel: ${r.name}.`, id);
    else if (r.maxIterations <= 1)
      error(`graph-cycle-cap-${id}`, `Wiederholung ohne Obergrenze: ${r.name}.`, id);
    else if (!r.exitCondition)
      warn(
        `graph-cycle-exit-${id}`,
        `Wiederholung ohne Endbedingung: ${r.name}.`,
        id,
      );
  }

  return out;
}
