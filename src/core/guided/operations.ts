import { z } from "zod";
import { withCapability } from "../capabilities.ts";
import type { CapabilityKey, ScenarioType } from "../capabilities.ts";
import {
  actorSchema,
  dossierSchema,
  injectSchema,
  objectiveSchema,
  patientSchema,
  propSchema,
  scenarioSchema,
  stationSchema,
  teamSchema,
  zoneSchema,
  type Scenario,
} from "../training.ts";
import * as graph from "../graphEdit.ts";
import {
  workflowEdgeSchema,
  workflowNodePorts,
  workflowNodeSchema,
  workflowSchema,
  workflowTriggerSchema,
  type Workflow,
  type WorkflowEdge,
  type WorkflowNode,
} from "../workflow.ts";
import {
  entityRef,
  nodeRef,
  ownershipOf,
  workflowRef,
  eventRef,
} from "./meta.ts";
import type {
  ApplyResult,
  EntityCollection,
  GeneratedMeta,
} from "./types.ts";

// Operation layer: the only place that turns a suggestion into scenario
// changes. Pure, atomic (all operations succeed or none) and idempotent
// (replaying the same suggestion never duplicates content). User-created or
// user-modified content is never touched.
//
// Add payloads use the schema input types (defaults not yet applied); the
// operation parses them before they enter the scenario.
export type StationInput = z.input<typeof stationSchema>;
export type PatientInput = z.input<typeof patientSchema>;
export type PropInput = z.input<typeof propSchema>;
export type TeamInput = z.input<typeof teamSchema>;
export type ActorInput = z.input<typeof actorSchema>;
export type ZoneInput = z.input<typeof zoneSchema>;
export type ObjectiveInput = z.input<typeof objectiveSchema>;
export type DossierInput = z.input<typeof dossierSchema>;
export type EventInput = z.input<typeof injectSchema>;
export type WorkflowNodeInput = z.input<typeof workflowNodeSchema>;

// Typed, reference-safe operations. There is deliberately no generic
// remove-element: removals name what they delete and clean references.
export type ScenarioOperation =
  | { op: "set-scenario-type"; type: ScenarioType }
  | { op: "set-capability"; key: CapabilityKey; value: boolean }
  | { op: "set-mode"; mode: Scenario["mode"] }
  | { op: "add-station"; station: StationInput }
  | { op: "add-patient"; patient: PatientInput }
  | { op: "add-prop"; prop: PropInput }
  | { op: "add-team"; team: TeamInput }
  | { op: "add-actor"; actor: ActorInput }
  | { op: "add-zone"; zone: ZoneInput }
  | { op: "add-objective"; objective: ObjectiveInput }
  | { op: "add-dossier"; dossier: DossierInput }
  | { op: "add-event"; inject: EventInput }
  | { op: "add-workflow"; workflow: Workflow }
  | { op: "add-node"; workflowId: string; node: WorkflowNodeInput }
  | { op: "connect"; workflowId: string; edge: WorkflowEdge }
  | {
      op: "set-workflow-trigger";
      workflowId: string;
      trigger: Workflow["trigger"];
    }
  | {
      op: "set-node-config";
      workflowId: string;
      nodeId: string;
      config: Record<string, unknown>;
    }
  | { op: "disconnect-edge"; workflowId: string; edgeId: string }
  | { op: "remove-generated-node"; workflowId: string; nodeId: string }
  | { op: "remove-generated-workflow"; workflowId: string }
  | { op: "remove-generated-event"; injectId: string }
  | { op: "remove-generated-entity"; collection: EntityCollection; id: string };

type OpResult =
  | { ok: true; scenario: Scenario; ref?: string }
  | { ok: false; error: string };

function parseValue<T>(
  schema: z.ZodType<T>,
  value: unknown,
  label: string,
): { ok: true; value: T } | { ok: false; error: string } {
  const parsed = schema.safeParse(value);
  if (!parsed.success)
    return {
      ok: false,
      error: `${label}: ${parsed.error.issues.map((issue) => issue.message).join(" · ")}`,
    };
  return { ok: true, value: parsed.data };
}

function isReconcilable(origin?: GeneratedMeta): boolean {
  return ownershipOf(origin) === "generated-unmodified";
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function replaceWorkflow(
  scenario: Scenario,
  next: Workflow,
): Scenario {
  return {
    ...scenario,
    workflows: scenario.workflows.map((row) =>
      row.id === next.id ? next : row,
    ),
  };
}

function findInCollection(
  scenario: Scenario,
  collection: EntityCollection,
  id: string,
): { id: string; origin?: GeneratedMeta } | undefined {
  switch (collection) {
    case "stations":
      return scenario.stations.find((row) => row.id === id);
    case "patients":
      return scenario.patients.find((row) => row.id === id);
    case "props":
      return scenario.props.find((row) => row.id === id);
    case "teams":
      return scenario.teams.find((row) => row.id === id);
    case "actors":
      return scenario.actors.find((row) => row.id === id);
    case "zones":
      return scenario.zones.find((row) => row.id === id);
    case "objectives":
      return scenario.objectives.find((row) => row.id === id);
    case "dossiers":
      return scenario.dossiers.find((row) => row.id === id);
  }
}

function removeFromCollection(
  scenario: Scenario,
  collection: EntityCollection,
  id: string,
): Scenario {
  switch (collection) {
    case "stations":
      return { ...scenario, stations: scenario.stations.filter((row) => row.id !== id) };
    case "patients":
      return { ...scenario, patients: scenario.patients.filter((row) => row.id !== id) };
    case "props":
      return { ...scenario, props: scenario.props.filter((row) => row.id !== id) };
    case "teams":
      return { ...scenario, teams: scenario.teams.filter((row) => row.id !== id) };
    case "actors":
      return { ...scenario, actors: scenario.actors.filter((row) => row.id !== id) };
    case "zones":
      return { ...scenario, zones: scenario.zones.filter((row) => row.id !== id) };
    case "objectives":
      return {
        ...scenario,
        objectives: scenario.objectives.filter((row) => row.id !== id),
      };
    case "dossiers":
      return { ...scenario, dossiers: scenario.dossiers.filter((row) => row.id !== id) };
  }
}

function addRow<T extends { id: string; origin?: GeneratedMeta }>(
  rows: T[],
  schema: z.ZodType<T>,
  row: unknown,
  label: string,
  canRegenerate?: (existing: T, next: T) => boolean,
): { ok: true; rows: T[] } | { ok: false; error: string } {
  const parsed = parseValue(schema, row, label);
  if (!parsed.ok) return parsed;
  const existing = rows.find((candidate) => candidate.id === parsed.value.id);
  if (existing) {
    if (same(existing, parsed.value)) return { ok: true, rows };
    // Regeneration is allowed only for untouched content of the same rule;
    // everything else is a conflict the user has to resolve.
    const regenerable =
      existing.origin &&
      !existing.origin.userModified &&
      parsed.value.origin?.ruleId === existing.origin.ruleId &&
      (canRegenerate ? canRegenerate(existing, parsed.value) : true);
    if (!regenerable)
      return { ok: false, error: `${label} id collision: ${parsed.value.id}` };
    return {
      ok: true,
      rows: rows.map((candidate) =>
        candidate.id === parsed.value.id ? parsed.value : candidate,
      ),
    };
  }
  return { ok: true, rows: [...rows, parsed.value] };
}

// Reference cleanup for entity removal. A reference may only be cleaned when
// the referencing element is itself generated-unmodified; otherwise the whole
// removal fails and reconciliation reports a conflict instead of leaving a
// dangling binding, node or event.
function cleanReferences(
  scenario: Scenario,
  collection: EntityCollection,
  id: string,
): { ok: true; scenario: Scenario } | { ok: false; error: string } {
  let workflows = scenario.workflows;
  let injects = scenario.injects;
  let stations = scenario.stations;
  let actors = scenario.actors;
  let equipment = scenario.equipment;

  const failReferenced = (what: string): { ok: false; error: string } => ({
    ok: false,
    error: `Referenced by ${what}`,
  });

  // Workflows are re-read per step so several cleaned nodes in the same graph
  // never overwrite each other.
  for (let index = 0; index < workflows.length; index++) {
    let current = workflows[index];
    let changed = false;
    for (const node of [...current.nodes]) {
      const removeFor =
        (collection === "stations" &&
          node.type === "show-surface" &&
          node.station === id) ||
        (collection === "objectives" &&
          node.type === "complete-objective" &&
          node.objective === id) ||
        (collection === "props" &&
          node.type === "set-prop-state" &&
          node.prop === id) ||
        (collection === "props" &&
          node.type === "task" &&
          (node.task === "wait-for-event" || node.task === "connect") &&
          node.config.prop === id);
      if (removeFor) {
        if (!isReconcilable(node.origin))
          return failReferenced("a user workflow step");
        current = graph.removeNode(current, node.id);
        changed = true;
        continue;
      }
      if (
        collection === "patients" &&
        node.type === "task" &&
        node.config.patientId === id
      ) {
        if (!isReconcilable(node.origin))
          return failReferenced("a user medical step");
        const next: WorkflowNode = {
          ...node,
          config: { ...node.config, patientId: "" },
        };
        current = graph.replaceNode(current, next, workflowNodePorts);
        changed = true;
      }
    }
    if (
      collection === "props" &&
      current.trigger.type === "prop" &&
      current.trigger.prop === id
    )
      return failReferenced("a workflow trigger");
    if (changed) workflows = workflows.map((row) => (row.id === current.id ? current : row));
  }

  // Events are re-read per step for the same reason.
  for (const injectId of injects.map((row) => row.id)) {
    const inject = injects.find((row) => row.id === injectId);
    if (!inject) continue;
    const relevant =
      (collection === "stations" &&
        (inject.station === id ||
          inject.actions.some(
            (action) => action.type === "camera" && action.target === id,
          ))) ||
      (collection === "zones" &&
        inject.trigger === "zone" &&
        inject.zone === id);
    if (relevant) {
      if (!isReconcilable(inject.origin)) return failReferenced("a user event");
      injects = injects.filter((row) => row.id !== injectId);
      continue;
    }
    const actionTarget =
      collection === "patients"
        ? "patient"
        : collection === "props"
          ? "prop"
          : collection === "objectives"
            ? "objective"
            : undefined;
    if (!actionTarget) continue;
    const remaining = inject.actions.filter(
      (action) => !(action.type === actionTarget && action.target === id),
    );
    if (remaining.length === inject.actions.length) continue;
    if (!isReconcilable(inject.origin)) return failReferenced("a user event");
    if (remaining.length === 0) {
      injects = injects.filter((row) => row.id !== injectId);
      continue;
    }
    const parsed = parseValue(
      injectSchema,
      { ...inject, actions: remaining },
      "Event",
    );
    if (!parsed.ok) return parsed;
    injects = injects.map((row) => (row.id === injectId ? parsed.value : row));
  }

  if (collection === "teams") {
    for (const station of stations)
      if (station.team === id) return failReferenced("a participant team");
  }

  if (collection === "patients" || collection === "props") {
    const binding = collection === "patients" ? "patient" : "prop";
    for (const stationId of stations.map((row) => row.id)) {
      const station = stations.find((row) => row.id === stationId);
      if (!station || station.bindings[binding] !== id) continue;
      if (!isReconcilable(station.origin)) return failReferenced("a user device");
      const parsed = parseValue(
        stationSchema,
        { ...station, bindings: { ...station.bindings, [binding]: "" } },
        "Device",
      );
      if (!parsed.ok) return parsed;
      stations = stations.map((row) => (row.id === stationId ? parsed.value : row));
    }
  }

  if (collection === "dossiers") {
    for (const actorId of actors.map((row) => row.id)) {
      const actor = actors.find((row) => row.id === actorId);
      if (!actor || actor.dossierId !== id) continue;
      if (!isReconcilable(actor.origin)) return failReferenced("a user actor");
      const parsed = parseValue(actorSchema, { ...actor, dossierId: "" }, "Actor");
      if (!parsed.ok) return parsed;
      actors = actors.map((row) => (row.id === actorId ? parsed.value : row));
    }
  }

  // Deliberate exception to the "generated-unmodified only" rule: clearing a
  // now-invalid assignment is not a content edit, it is the same referential
  // cleanup `removeTeam` already performs unconditionally. Equipment created by
  // `addTeamFromTemplate` is user-owned, so failing here would block removing a
  // participant. Only the pointer is cleared; the item itself is never deleted.
  if (collection === "stations")
    equipment = equipment.map((item) =>
      item.assignedTo.personId === id
        ? { ...item, assignedTo: { ...item.assignedTo, personId: "" } }
        : item,
    );
  if (collection === "teams")
    equipment = equipment.map((item) =>
      item.assignedTo.teamId === id
        ? {
            ...item,
            assignedTo: { ...item.assignedTo, teamId: "", personId: "" },
          }
        : item,
    );

  return {
    ok: true,
    scenario: { ...scenario, workflows, injects, stations, actors, equipment },
  };
}

function applyOperation(scenario: Scenario, operation: ScenarioOperation): OpResult {
  switch (operation.op) {
    case "set-scenario-type":
      return {
        ok: true,
        scenario: { ...scenario, type: operation.type, capabilities: {} },
      };
    case "set-capability":
      return {
        ok: true,
        scenario: {
          ...scenario,
          capabilities: withCapability(
            scenario.type,
            scenario.capabilities,
            operation.key,
            operation.value,
          ),
        },
      };
    case "set-mode":
      return { ok: true, scenario: { ...scenario, mode: operation.mode } };
    case "add-station": {
      const result = addRow(scenario.stations, stationSchema, operation.station, "Device");
      if (!result.ok) return result;
      return {
        ok: true,
        scenario: { ...scenario, stations: result.rows },
        ref: entityRef("stations", operation.station.id),
      };
    }
    case "add-patient": {
      const result = addRow(scenario.patients, patientSchema, operation.patient, "Patient");
      if (!result.ok) return result;
      return {
        ok: true,
        scenario: { ...scenario, patients: result.rows },
        ref: entityRef("patients", operation.patient.id),
      };
    }
    case "add-prop": {
      const result = addRow(scenario.props, propSchema, operation.prop, "Prop");
      if (!result.ok) return result;
      return {
        ok: true,
        scenario: { ...scenario, props: result.rows },
        ref: entityRef("props", operation.prop.id),
      };
    }
    case "add-team": {
      const result = addRow(scenario.teams, teamSchema, operation.team, "Team");
      if (!result.ok) return result;
      return {
        ok: true,
        scenario: { ...scenario, teams: result.rows },
        ref: entityRef("teams", operation.team.id),
      };
    }
    case "add-actor": {
      const result = addRow(scenario.actors, actorSchema, operation.actor, "Actor");
      if (!result.ok) return result;
      return {
        ok: true,
        scenario: { ...scenario, actors: result.rows },
        ref: entityRef("actors", operation.actor.id),
      };
    }
    case "add-zone": {
      const result = addRow(scenario.zones, zoneSchema, operation.zone, "Zone");
      if (!result.ok) return result;
      return {
        ok: true,
        scenario: { ...scenario, zones: result.rows },
        ref: entityRef("zones", operation.zone.id),
      };
    }
    case "add-objective": {
      const result = addRow(
        scenario.objectives,
        objectiveSchema,
        operation.objective,
        "Objective",
      );
      if (!result.ok) return result;
      return {
        ok: true,
        scenario: { ...scenario, objectives: result.rows },
        ref: entityRef("objectives", operation.objective.id),
      };
    }
    case "add-dossier": {
      const result = addRow(scenario.dossiers, dossierSchema, operation.dossier, "Dossier");
      if (!result.ok) return result;
      return {
        ok: true,
        scenario: { ...scenario, dossiers: result.rows },
        ref: entityRef("dossiers", operation.dossier.id),
      };
    }
    case "add-event": {
      const result = addRow(scenario.injects, injectSchema, operation.inject, "Event");
      if (!result.ok) return result;
      return {
        ok: true,
        scenario: { ...scenario, injects: result.rows },
        ref: eventRef(operation.inject.id),
      };
    }
    case "add-workflow": {
      const result = addRow(
        scenario.workflows,
        workflowSchema,
        operation.workflow,
        "Workflow",
        (existing, next) =>
          existing.nodes.every(
            (node) => node.origin !== undefined && !node.origin.userModified,
          ) &&
          next.nodes.every(
            (node) => node.origin !== undefined && !node.origin.userModified,
          ),
      );
      if (!result.ok) return result;
      return {
        ok: true,
        scenario: { ...scenario, workflows: result.rows },
        ref: workflowRef(operation.workflow.id),
      };
    }
    case "add-node": {
      const workflow = scenario.workflows.find((row) => row.id === operation.workflowId);
      if (!workflow)
        return { ok: false, error: `Unknown workflow: ${operation.workflowId}` };
      const parsed = parseValue(workflowNodeSchema, operation.node, "Node");
      if (!parsed.ok) return parsed;
      const existing = workflow.nodes.find((row) => row.id === parsed.value.id);
      if (existing) {
        if (same(existing, parsed.value))
          return {
            ok: true,
            scenario,
            ref: nodeRef(workflow.id, parsed.value.id),
          };
        return { ok: false, error: `Node id collision: ${parsed.value.id}` };
      }
      const next = graph.addNode(workflow, parsed.value);
      return {
        ok: true,
        scenario: replaceWorkflow(scenario, next),
        ref: nodeRef(workflow.id, parsed.value.id),
      };
    }
    case "connect": {
      const workflow = scenario.workflows.find((row) => row.id === operation.workflowId);
      if (!workflow)
        return { ok: false, error: `Unknown workflow: ${operation.workflowId}` };
      const parsed = parseValue(workflowEdgeSchema, operation.edge, "Edge");
      if (!parsed.ok) return parsed;
      const existing = workflow.edges.find(
        (edge) =>
          edge.source === parsed.value.source &&
          edge.output === parsed.value.output,
      );
      if (existing) {
        if (same(existing, parsed.value)) return { ok: true, scenario };
        return {
          ok: false,
          error: `Output already connected: ${parsed.value.source}.${parsed.value.output}`,
        };
      }
      return { ok: true, scenario: replaceWorkflow(scenario, graph.connect(workflow, parsed.value)) };
    }
    case "set-workflow-trigger": {
      const workflow = scenario.workflows.find((row) => row.id === operation.workflowId);
      if (!workflow)
        return { ok: false, error: `Unknown workflow: ${operation.workflowId}` };
      const parsed = parseValue(workflowTriggerSchema, operation.trigger, "Trigger");
      if (!parsed.ok) return parsed;
      if (same(workflow.trigger, parsed.value)) return { ok: true, scenario };
      return {
        ok: true,
        scenario: replaceWorkflow(scenario, { ...workflow, trigger: parsed.value }),
      };
    }
    case "set-node-config": {
      const workflow = scenario.workflows.find((row) => row.id === operation.workflowId);
      if (!workflow)
        return { ok: false, error: `Unknown workflow: ${operation.workflowId}` };
      const node = workflow.nodes.find((row) => row.id === operation.nodeId);
      if (!node) return { ok: false, error: `Unknown node: ${operation.nodeId}` };
      if (node.type !== "task")
        return { ok: false, error: `Node has no task config: ${operation.nodeId}` };
      if (!isReconcilable(node.origin))
        return { ok: false, error: `Node is not generated-unmodified: ${operation.nodeId}` };
      const parsed = parseValue(
        workflowNodeSchema,
        { ...node, config: { ...node.config, ...operation.config } },
        "Node",
      );
      if (!parsed.ok) return parsed;
      if (same(node, parsed.value)) return { ok: true, scenario };
      return {
        ok: true,
        scenario: replaceWorkflow(
          scenario,
          graph.replaceNode(workflow, parsed.value, workflowNodePorts),
        ),
        ref: nodeRef(workflow.id, node.id),
      };
    }
    case "disconnect-edge": {
      const workflow = scenario.workflows.find((row) => row.id === operation.workflowId);
      if (!workflow)
        return { ok: false, error: `Unknown workflow: ${operation.workflowId}` };
      if (!workflow.edges.some((edge) => edge.id === operation.edgeId))
        return { ok: true, scenario };
      return {
        ok: true,
        scenario: replaceWorkflow(scenario, graph.disconnect(workflow, operation.edgeId)),
      };
    }
    case "remove-generated-node": {
      const workflow = scenario.workflows.find((row) => row.id === operation.workflowId);
      if (!workflow)
        return { ok: false, error: `Unknown workflow: ${operation.workflowId}` };
      const node = workflow.nodes.find((row) => row.id === operation.nodeId);
      if (!node) return { ok: true, scenario };
      if (!isReconcilable(node.origin))
        return { ok: false, error: `Node is not generated-unmodified: ${operation.nodeId}` };
      if (node.id === workflow.entry)
        return { ok: false, error: "The start node cannot be removed" };
      return {
        ok: true,
        scenario: replaceWorkflow(scenario, graph.removeNode(workflow, node.id)),
      };
    }
    case "remove-generated-workflow": {
      const workflow = scenario.workflows.find((row) => row.id === operation.workflowId);
      if (!workflow) return { ok: true, scenario };
      if (!isReconcilable(workflow.origin))
        return { ok: false, error: `Workflow is not generated-unmodified: ${operation.workflowId}` };
      if (
        workflow.nodes.some(
          (node) => !node.origin || node.origin.userModified,
        )
      )
        return {
          ok: false,
          error: `Workflow contains user content: ${operation.workflowId}`,
        };
      return {
        ok: true,
        scenario: {
          ...scenario,
          workflows: scenario.workflows.filter((row) => row.id !== workflow.id),
        },
      };
    }
    case "remove-generated-event": {
      const inject = scenario.injects.find((row) => row.id === operation.injectId);
      if (!inject) return { ok: true, scenario };
      if (!isReconcilable(inject.origin))
        return { ok: false, error: `Event is not generated-unmodified: ${operation.injectId}` };
      return {
        ok: true,
        scenario: {
          ...scenario,
          injects: scenario.injects.filter((row) => row.id !== inject.id),
        },
      };
    }
    case "remove-generated-entity": {
      const existing = findInCollection(
        scenario,
        operation.collection,
        operation.id,
      );
      if (!existing) return { ok: true, scenario };
      if (!isReconcilable(existing.origin))
        return {
          ok: false,
          error: `Entity is not generated-unmodified: ${operation.collection}:${operation.id}`,
        };
      const cleaned = cleanReferences(scenario, operation.collection, operation.id);
      if (!cleaned.ok) return cleaned;
      return {
        ok: true,
        scenario: removeFromCollection(
          cleaned.scenario,
          operation.collection,
          operation.id,
        ),
      };
    }
  }
}

// Applies a whole suggestion atomically. The returned scenario is re-parsed so
// no operation can leave the mission in an invalid state.
export function applyOperations(
  scenario: Scenario,
  operations: readonly ScenarioOperation[],
): ApplyResult {
  let next = structuredClone(scenario);
  const refs: string[] = [];
  for (const operation of operations) {
    const result = applyOperation(next, operation);
    if (!result.ok) return { ok: false, error: result.error };
    next = result.scenario;
    if (result.ref) refs.push(result.ref);
  }
  const parsed = scenarioSchema.safeParse(next);
  if (!parsed.success)
    return {
      ok: false,
      error: parsed.error.issues.map((issue) => issue.message).join(" · "),
    };
  return { ok: true, scenario: parsed.data, refs };
}

// Dry-run for reconciliation: which refs would this suggestion own after it is
// applied? Never touches the caller's scenario.
export function previewSuggestion(
  scenario: Scenario,
  operations: readonly ScenarioOperation[],
): string[] {
  const result = applyOperations(scenario, operations);
  return result.ok ? result.refs : [];
}
