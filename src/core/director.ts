import { z } from "zod";
import { schema, defaults, type Config } from "./config";
import { addNode, reachableFrom } from "./graphEdit.ts";
import { t } from "../i18n";

// A show is a graph of takes. Every take has explicit success/fail/timeout
// ports; a terminal is an explicit `end` node. There is no implicit ordering:
// the previous `next`/`onFail` fields are migrated into real edges.
export const cueSchema = z.enum(["idle", "active", "warning", "complete"]);
export const triggerSchema = z.enum(["time", "key", "pin", "signal"]);
export const showPorts = ["success", "fail", "timeout"] as const;
export type ShowPort = (typeof showPorts)[number];

const positionSchema = z
  .object({ x: z.number().finite(), y: z.number().finite() })
  .optional();

export const takeSchema = z.object({
  kind: z.literal("take"),
  id: z.string().max(80),
  name: z.string().max(60),
  config: schema,
  cue: cueSchema,
  operation: z.string().max(40).default(""),
  trigger: triggerSchema.default("signal"),
  duration: z.number().min(0.1).max(35999),
  value: z.string().max(80),
  timeout: z.number().min(0).max(35999).default(0),
  position: positionSchema,
});

export const endNodeSchema = z.object({
  kind: z.literal("end"),
  id: z.string().max(80),
  name: z.string().max(60).default(""),
  position: positionSchema,
});

export const showNodeSchema = z.discriminatedUnion("kind", [
  takeSchema,
  endNodeSchema,
]);

export const showEdgeSchema = z.object({
  id: z.string().max(80),
  source: z.string().max(80),
  output: z.enum(showPorts),
  target: z.string().max(80),
});

export const showSchema = z
  .object({
    version: z.literal(3),
    name: z.string().max(80),
    entry: z.string().max(80),
    nodes: z.array(showNodeSchema).min(1).max(60),
    edges: z.array(showEdgeSchema).max(240).default([]),
  })
  .superRefine((show, ctx) => {
    const issue = (message: string) =>
      ctx.addIssue({ code: "custom", message });
    const nodeIds = new Set(show.nodes.map((node) => node.id));
    if (nodeIds.size !== show.nodes.length) issue("Duplicate node IDs");
    const edgeIds = new Set(show.edges.map((edge) => edge.id));
    if (edgeIds.size !== show.edges.length) issue("Duplicate edge IDs");
    const entry = show.nodes.find((node) => node.id === show.entry);
    if (!entry || entry.kind !== "take")
      issue("Entry must reference a take node");
    const ports = new Set<string>();
    for (const edge of show.edges) {
      const source = show.nodes.find((node) => node.id === edge.source);
      if (!source || !nodeIds.has(edge.target)) {
        issue(`Edge ${edge.id} references a missing node`);
        continue;
      }
      if (source.kind !== "take")
        issue(`Edge ${edge.id} leaves a terminal node`);
      const key = `${edge.source}:${edge.output}`;
      if (ports.has(key)) issue(`Output ${edge.output} of ${edge.source} is doubled`);
      ports.add(key);
    }
    for (const node of show.nodes)
      if (node.kind === "end" && show.edges.some((e) => e.source === node.id))
        issue(`Terminal ${node.id} must not have outgoing edges`);
  });

export type Show = z.infer<typeof showSchema>;
export type ShowNode = z.infer<typeof showNodeSchema>;
export type Take = z.infer<typeof takeSchema>;
export type ShowEdge = z.infer<typeof showEdgeSchema>;
export type Step = Take;

export function newStep(config: Config): Take {
  return {
    kind: "take",
    id: crypto.randomUUID(),
    name: config.title,
    config: structuredClone(config),
    cue: "idle",
    operation: "",
    trigger: "time",
    duration: 10,
    value: "Enter",
    timeout: 0,
  };
}

// Visible outputs of a node. Takes always expose success and fail; the timeout
// port appears only when a timeout is configured. Terminals have no outputs.
export function showNodePorts(node: ShowNode): string[] {
  if (node.kind !== "take") return [];
  return node.timeout > 0
    ? ["success", "fail", "timeout"]
    : ["success", "fail"];
}

export function stepById(show: Show, id: string): Take | undefined {
  const node = show.nodes.find((candidate) => candidate.id === id);
  return node?.kind === "take" ? node : undefined;
}

export function entryStep(show: Show): Take | null {
  return stepById(show, show.entry) ?? null;
}

function follow(show: Show, id: string, output: ShowPort): Take | null {
  const edge = show.edges.find(
    (candidate) => candidate.source === id && candidate.output === output,
  );
  return edge ? (stepById(show, edge.target) ?? null) : null;
}

export function nextStep(show: Show, id: string): Take | null {
  return follow(show, id, "success");
}

export function failStep(show: Show, id: string): Take | null {
  return follow(show, id, "fail");
}

export function timeoutStep(show: Show, id: string): Take | null {
  return follow(show, id, "timeout") ?? failStep(show, id);
}

// Linear traversal of the success path from the entry; unvisited takes are
// appended in authoring order so a demo/linear host never loses content.
export function showOrder(show: Show): Take[] {
  const order: Take[] = [];
  const seen = new Set<string>();
  let current: Take | null = entryStep(show);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    order.push(current);
    current = nextStep(show, current.id);
  }
  for (const node of show.nodes)
    if (node.kind === "take" && !seen.has(node.id)) order.push(node);
  return order;
}

export function gate(
  kind: "file.found" | "file.decrypt" | "shell.success",
  path = "",
) {
  return path ? `${kind}:${path}` : kind;
}

export function triggerMatches(
  step: Step,
  elapsed: number,
  input?: { type: string; value: string },
) {
  return step.trigger === "time"
    ? elapsed >= step.duration
    : !!input && input.type === step.trigger && input.value === step.value;
}

export type ShowFinding = {
  id: string;
  severity: "error" | "warning";
  message: string;
  nodeId?: string;
};

// Film graph linter. Errors block the start; every reachable take must lead to
// a terminal and no node may be orphaned.
export function lintShow(show: Show): ShowFinding[] {
  const out: ShowFinding[] = [];
  const reachable = reachableFrom(show);
  const ends = new Set(
    show.nodes.filter((node) => node.kind === "end").map((node) => node.id),
  );
  const reverse = new Map<string, string[]>();
  for (const edge of show.edges)
    reverse.set(edge.target, [
      ...(reverse.get(edge.target) ?? []),
      edge.source,
    ]);
  const canReachEnd = new Set(ends);
  const walk = [...ends];
  while (walk.length) {
    const id = walk.pop();
    if (!id) continue;
    for (const previous of reverse.get(id) ?? [])
      if (!canReachEnd.has(previous)) {
        canReachEnd.add(previous);
        walk.push(previous);
      }
  }
  for (const node of show.nodes) {
    if (node.kind !== "take") continue;
    const name = node.name || node.id;
    if (!reachable.has(node.id))
      out.push({
        id: `show-unreachable-${node.id}`,
        severity: "error",
        message: t("show.lint.unreachable", { name }),
        nodeId: node.id,
      });
    else if (!canReachEnd.has(node.id))
      out.push({
        id: `show-terminal-${node.id}`,
        severity: "error",
        message: t("show.lint.noTerminal", { name }),
        nodeId: node.id,
      });
    if (node.trigger === "pin" && !/^[A-Za-z0-9]{4,8}$/.test(node.config.pin))
      out.push({
        id: `show-pin-${node.id}`,
        severity: "error",
        message: t("show.lint.pin", { name }),
        nodeId: node.id,
      });
  }
  return out;
}

type LegacyStep = {
  id: string;
  name: string;
  config: Config;
  cue: Take["cue"];
  operation?: string;
  trigger?: Take["trigger"];
  duration: number;
  value: string;
  next?: string;
  onFail?: string;
  timeout?: number;
};

// v1/v2 `{steps, next, onFail}` becomes a v3 graph with explicit edges. Invalid
// legacy references are dropped instead of carried as dangling links.
export function migrateShow(input: unknown): Show {
  if (
    input &&
    typeof input === "object" &&
    (input as { version?: unknown }).version === 3
  )
    return showSchema.parse(input);
  const legacy = input as {
    name?: string;
    steps?: LegacyStep[];
  } | null;
  const steps = Array.isArray(legacy?.steps) ? legacy.steps : [];
  if (!steps.length) return defaultShow();
  const ids = new Set(steps.map((step) => step.id));
  const nodes: ShowNode[] = steps.map((step, index) => ({
    kind: "take",
    id: step.id,
    name: step.name,
    config: step.config,
    cue: step.cue,
    operation: step.operation ?? "",
    trigger: step.trigger ?? "signal",
    duration: step.duration,
    value: step.value,
    timeout: step.timeout ?? 0,
    position: { x: index * 280, y: 0 },
  }));
  const edges: ShowEdge[] = [];
  let needsEnd = false;
  const link = (source: string, output: ShowPort, target: string) => {
    if (!target) return;
    if (target !== "end" && !ids.has(target)) return;
    if (target === "end") needsEnd = true;
    edges.push({
      id: `edge-${edges.length + 1}`,
      source,
      output,
      target,
    });
  };
  steps.forEach((step, index) => {
    const next = step.next ?? "";
    if (next) link(step.id, "success", next);
    else if (index + 1 < steps.length) link(step.id, "success", steps[index + 1].id);
    else link(step.id, "success", "end");
    if (step.onFail) link(step.id, "fail", step.onFail);
  });
  if (needsEnd)
    nodes.push({
      kind: "end",
      id: "end",
      name: "",
      position: { x: steps.length * 280, y: 0 },
    });
  return showSchema.parse({
    version: 3,
    name: legacy?.name ?? "Show",
    entry: steps[0].id,
    nodes,
    edges,
  });
}

// Guarantees a terminal node exists and returns its id, so every new take can
// be wired to a terminal without a dangling success port.
export function ensureEndNode(show: Show): { show: Show; endId: string } {
  const existing = show.nodes.find((node) => node.kind === "end");
  if (existing) return { show, endId: existing.id };
  const endId = "end";
  return {
    show: addNode(show, {
      kind: "end",
      id: endId,
      name: "",
      position: { x: show.nodes.length * 280, y: 0 },
    }),
    endId,
  };
}

export function defaultShow(): Show {
  const take = newStep(defaults("terminal"));
  return showSchema.parse({
    version: 3,
    name: "Take 01",
    entry: take.id,
    nodes: [
      take,
      { kind: "end", id: "end", name: "", position: { x: 320, y: 0 } },
    ],
    edges: [
      { id: "edge-1", source: take.id, output: "success", target: "end" },
    ],
  });
}

export function loadShow(): Show {
  try {
    return migrateShow(
      JSON.parse(localStorage.getItem("screenforge.show.v1") || "null"),
    );
  } catch {
    return defaultShow();
  }
}
