import type { Scenario } from "../training.ts";
import type {
  ElementRef,
  EntityCollection,
  GeneratedMeta,
  ScenarioOperation,
} from "./types.ts";

// Provenance primitives shared by the engine, the packs and reconciliation.
export type Ownership =
  | "generated-unmodified"
  | "generated-modified"
  | "user-created";

export function ownershipOf(origin?: GeneratedMeta): Ownership {
  if (!origin) return "user-created";
  return origin.userModified ? "generated-modified" : "generated-unmodified";
}

// A user edit of generated content freezes it against automatic reconciliation.
export function markGeneratedModified<T extends { origin?: GeneratedMeta }>(
  row: T,
): T {
  if (!row.origin || row.origin.userModified) return row;
  return { ...row, origin: { ...row.origin, userModified: true } };
}

export function fnv1a(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++)
    hash = Math.imul(hash ^ input.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}

// Deterministic ids so recomputing a suggestion never creates a second element.
// The subject key keeps one rule able to generate several objects.
export function generatedId(
  ruleId: string,
  subjectKey: string,
  slot: string,
): string {
  const raw = `g-${ruleId}-${subjectKey}-${slot}`
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-");
  if (raw.length <= 40) return raw;
  return `${raw.slice(0, 31)}-${fnv1a(raw)}`;
}

export type FingerprintInputs = Readonly<
  Record<string, string | number | boolean | readonly string[] | undefined>
>;

// Fingerprint of the inputs a suggestion depends on. Same situation keeps the
// same id (a dismissal survives); a materially changed situation gets a new id
// (the recommendation may return).
export function suggestionFingerprint(inputs: FingerprintInputs): string {
  const keys = Object.keys(inputs).sort();
  const parts = keys.map((key) => {
    const value = inputs[key];
    const normalized = Array.isArray(value) ? [...value].sort() : value;
    return `${key}=${JSON.stringify(normalized ?? null)}`;
  });
  return fnv1a(parts.join("|"));
}

export function makeSuggestionId(
  ruleId: string,
  subjectKey: string,
  inputs: FingerprintInputs,
): string {
  return `${ruleId}:${subjectKey}:${suggestionFingerprint(inputs)}`;
}

export function entityRef(collection: EntityCollection, id: string): string {
  return `${collection}:${id}`;
}

export function workflowRef(id: string): string {
  return `workflows:${id}`;
}

export function nodeRef(workflowId: string, nodeId: string): string {
  return `nodes:${workflowId}/${nodeId}`;
}

export function eventRef(id: string): string {
  return `injects:${id}`;
}

type ParsedRef =
  | { kind: "entity"; collection: EntityCollection; id: string }
  | { kind: "workflow"; id: string }
  | { kind: "node"; workflowId: string; nodeId: string }
  | { kind: "event"; id: string };

export function parseElementRef(ref: ElementRef): ParsedRef | undefined {
  if (ref.startsWith("nodes:")) {
    const [workflowId, nodeId] = ref.slice("nodes:".length).split("/");
    if (!workflowId || !nodeId) return undefined;
    return { kind: "node", workflowId, nodeId };
  }
  if (ref.startsWith("workflows:"))
    return { kind: "workflow", id: ref.slice("workflows:".length) };
  if (ref.startsWith("injects:"))
    return { kind: "event", id: ref.slice("injects:".length) };
  const [collection, id] = ref.split(":");
  if (!collection || !id) return undefined;
  return { kind: "entity", collection: collection as EntityCollection, id };
}

const entityCollections: EntityCollection[] = [
  "stations",
  "patients",
  "props",
  "teams",
  "actors",
  "zones",
  "objectives",
  "dossiers",
];

export function elementOrigin(
  scenario: Scenario,
  ref: ElementRef,
): GeneratedMeta | undefined {
  const parsed = parseElementRef(ref);
  if (!parsed) return undefined;
  if (parsed.kind === "entity") {
    const rows = scenario[parsed.collection] as { id: string; origin?: GeneratedMeta }[];
    return rows.find((row) => row.id === parsed.id)?.origin;
  }
  if (parsed.kind === "workflow")
    return scenario.workflows.find((row) => row.id === parsed.id)?.origin;
  if (parsed.kind === "node") {
    const node = scenario.workflows
      .find((row) => row.id === parsed.workflowId)
      ?.nodes.find((row) => row.id === parsed.nodeId);
    return node?.origin;
  }
  return scenario.injects.find((row) => row.id === parsed.id)?.origin;
}

// Marks an element as user-owned by reference. Used when the user decides to
// keep generated content that reconciliation proposed for removal.
export function markRefUserModified(
  scenario: Scenario,
  ref: ElementRef,
): Scenario {
  const parsed = parseElementRef(ref);
  if (!parsed) return scenario;
  if (parsed.kind === "workflow")
    return {
      ...scenario,
      workflows: scenario.workflows.map((row) =>
        row.id === parsed.id ? markGeneratedModified(row) : row,
      ),
    };
  if (parsed.kind === "node")
    return {
      ...scenario,
      workflows: scenario.workflows.map((row) =>
        row.id === parsed.workflowId
          ? {
              ...row,
              nodes: row.nodes.map((node) =>
                node.id === parsed.nodeId ? markGeneratedModified(node) : node,
              ),
            }
          : row,
      ),
    };
  if (parsed.kind === "event")
    return {
      ...scenario,
      injects: scenario.injects.map((row) =>
        row.id === parsed.id ? markGeneratedModified(row) : row,
      ),
    };
  switch (parsed.collection) {
    case "stations":
      return {
        ...scenario,
        stations: scenario.stations.map((row) =>
          row.id === parsed.id ? markGeneratedModified(row) : row,
        ),
      };
    case "patients":
      return {
        ...scenario,
        patients: scenario.patients.map((row) =>
          row.id === parsed.id ? markGeneratedModified(row) : row,
        ),
      };
    case "props":
      return {
        ...scenario,
        props: scenario.props.map((row) =>
          row.id === parsed.id ? markGeneratedModified(row) : row,
        ),
      };
    case "teams":
      return {
        ...scenario,
        teams: scenario.teams.map((row) =>
          row.id === parsed.id ? markGeneratedModified(row) : row,
        ),
      };
    case "actors":
      return {
        ...scenario,
        actors: scenario.actors.map((row) =>
          row.id === parsed.id ? markGeneratedModified(row) : row,
        ),
      };
    case "zones":
      return {
        ...scenario,
        zones: scenario.zones.map((row) =>
          row.id === parsed.id ? markGeneratedModified(row) : row,
        ),
      };
    case "objectives":
      return {
        ...scenario,
        objectives: scenario.objectives.map((row) =>
          row.id === parsed.id ? markGeneratedModified(row) : row,
        ),
      };
    case "dossiers":
      return {
        ...scenario,
        dossiers: scenario.dossiers.map((row) =>
          row.id === parsed.id ? markGeneratedModified(row) : row,
        ),
      };
  }
}

export function generatedElementRefs(
  scenario: Scenario,
): { ref: ElementRef; origin: GeneratedMeta }[] {
  const out: { ref: ElementRef; origin: GeneratedMeta }[] = [];
  for (const collection of entityCollections)
    for (const row of scenario[collection] as {
      id: string;
      origin?: GeneratedMeta;
    }[])
      if (row.origin) out.push({ ref: entityRef(collection, row.id), origin: row.origin });
  for (const workflow of scenario.workflows) {
    if (workflow.origin)
      out.push({ ref: workflowRef(workflow.id), origin: workflow.origin });
    for (const node of workflow.nodes)
      if (node.origin)
        out.push({
          ref: nodeRef(workflow.id, node.id),
          origin: node.origin,
        });
  }
  for (const inject of scenario.injects)
    if (inject.origin) out.push({ ref: eventRef(inject.id), origin: inject.origin });
  return out;
}

// The typed removal for a generated element. Reconciliation never invents a
// generic delete; this is the single mapping used everywhere.
export function removalOperationFor(
  ref: ElementRef,
): ScenarioOperation | undefined {
  const parsed = parseElementRef(ref);
  if (!parsed) return undefined;
  if (parsed.kind === "entity")
    return {
      op: "remove-generated-entity",
      collection: parsed.collection,
      id: parsed.id,
    };
  if (parsed.kind === "workflow")
    return { op: "remove-generated-workflow", workflowId: parsed.id };
  if (parsed.kind === "node")
    return {
      op: "remove-generated-node",
      workflowId: parsed.workflowId,
      nodeId: parsed.nodeId,
    };
  return { op: "remove-generated-event", injectId: parsed.id };
}
