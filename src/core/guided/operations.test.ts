import { describe, expect, it } from "vitest";
import { contextFor, evaluateSuggestions } from "./engine";
import { blankScenario, sessionWith } from "./fixtures";
import { applyOperations } from "./operations";
import { setNodePosition } from "../workflowEdit";
import { scenarioSchema, type Scenario } from "../training";
import type { ScenarioOperation, Suggestion } from "./types";

const idPattern = /^[a-zA-Z0-9_-]{1,40}$/;

function suggestionFor(
  ruleId: string,
  answers: Record<string, string[]>,
  domain: "search-rescue" | "medical" = "search-rescue",
): Suggestion {
  const scenario = blankScenario(domain === "medical" ? "medical" : "sar");
  const session = sessionWith(domain, answers);
  const found = evaluateSuggestions(contextFor(scenario, session)).find(
    (row) => row.ruleId === ruleId,
  );
  if (!found) throw new Error(`Missing suggestion ${ruleId}`);
  return found;
}

function apply(scenario: Scenario, operations: readonly ScenarioOperation[]): Scenario {
  const result = applyOperations(scenario, operations);
  if (!result.ok) throw new Error(result.error);
  return result.scenario;
}

const locateRetry = suggestionFor("sar-locate", {
  "q.sar.target": ["person"],
  "q.sar.location": ["unknown"],
  "q.sar.failure": ["retry"],
});

describe("guided operations", () => {
  it("generates stable, schema-valid ids", () => {
    const result = applyOperations(blankScenario("sar"), locateRetry.operations);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.refs.length).toBeGreaterThan(0);
    for (const ref of result.refs) {
      const id = ref.split(/[/:]/).pop() ?? "";
      expect(id).toMatch(idPattern);
    }
  });

  it("is idempotent when the same suggestion is applied twice", () => {
    const first = apply(blankScenario("sar"), locateRetry.operations);
    const second = apply(first, locateRetry.operations);
    expect(second).toEqual(first);
  });

  it("is atomic and never mutates its input on failure", () => {
    const before = apply(blankScenario("sar"), locateRetry.operations);
    const snapshot = structuredClone(before);
    const result = applyOperations(before, [
      {
        op: "add-objective",
        objective: { id: "g-extra-objective", name: "Extra" },
      },
      {
        op: "add-node",
        workflowId: "does-not-exist",
        node: { id: "n", type: "delay", seconds: 5 },
      },
    ]);
    expect(result.ok).toBe(false);
    expect(before).toEqual(snapshot);
  });

  it("removes a generated node with its edges", () => {
    const scenario = apply(blankScenario("sar"), locateRetry.operations);
    const workflowId = scenario.workflows[0].id;
    const next = apply(scenario, [
      { op: "remove-generated-node", workflowId, nodeId: "found" },
    ]);
    expect(next.workflows[0].nodes.some((node) => node.id === "found")).toBe(false);
    expect(
      next.workflows[0].edges.some(
        (edge) => edge.source === "found" || edge.target === "found",
      ),
    ).toBe(false);
    expect(scenarioSchema.safeParse(next).success).toBe(true);
  });

  it("refuses to remove user-created nodes", () => {
    const scenario = apply(blankScenario("sar"), locateRetry.operations);
    const workflowId = scenario.workflows[0].id;
    const withUserNode = apply(scenario, [
      {
        op: "add-node",
        workflowId,
        node: { id: "user-node", type: "delay", seconds: 5 },
      },
    ]);
    const result = applyOperations(withUserNode, [
      { op: "remove-generated-node", workflowId, nodeId: "user-node" },
    ]);
    expect(result.ok).toBe(false);
  });

  it("cleans references when a generated entity is removed", () => {
    const scenario = apply(blankScenario("sar"), locateRetry.operations);
    const objectiveId = scenario.objectives[0].id;
    const stationId = scenario.stations[0].id;
    const zoneId = scenario.zones[0].id;
    const withoutObjective = apply(scenario, [
      { op: "remove-generated-entity", collection: "objectives", id: objectiveId },
    ]);
    expect(withoutObjective.objectives).toHaveLength(0);
    expect(
      withoutObjective.workflows[0].nodes.some(
        (node) => node.type === "complete-objective",
      ),
    ).toBe(false);
    const withoutStation = apply(withoutObjective, [
      { op: "remove-generated-entity", collection: "stations", id: stationId },
    ]);
    expect(
      withoutStation.workflows[0].nodes.some(
        (node) => node.type === "show-surface",
      ),
    ).toBe(false);
    const withoutZone = apply(withoutStation, [
      { op: "remove-generated-entity", collection: "zones", id: zoneId },
    ]);
    expect(scenarioSchema.safeParse(withoutZone).success).toBe(true);
  });

  it("refuses to remove an entity referenced by user content", () => {
    const medical = suggestionFor(
      "med-patient",
      { "q.med.arrival": ["present"], "q.med.treatment": ["basic"] },
      "medical",
    );
    const scenario = apply(blankScenario("medical"), medical.operations);
    const patientId = scenario.patients[0].id;
    const withUserStation = apply(scenario, [
      {
        op: "add-station",
        station: {
          id: "user-medic",
          name: "User Medic",
          role: "element",
          module: "medical",
          bindings: { patient: patientId, prop: "", objective: "" },
        },
      },
    ]);
    const result = applyOperations(withUserStation, [
      { op: "remove-generated-entity", collection: "patients", id: patientId },
    ]);
    expect(result.ok).toBe(false);
  });

  it("regenerates untouched generated workflows when an answer changes", () => {
    const scenario = apply(blankScenario("sar"), locateRetry.operations);
    const locateEnd = suggestionFor("sar-locate", {
      "q.sar.target": ["person"],
      "q.sar.location": ["unknown"],
      "q.sar.failure": ["end"],
    });
    const regenerated = apply(scenario, locateEnd.operations);
    const flow = regenerated.workflows[0];
    expect(flow.nodes.some((node) => node.id === "end-fail")).toBe(true);
    expect(flow.nodes.some((node) => node.id === "retry")).toBe(false);
  });

  it("refuses regeneration once a generated node was edited", () => {
    const scenario = apply(blankScenario("sar"), locateRetry.operations);
    const workflow = scenario.workflows[0];
    const edited = setNodePosition(workflow, "found", { x: 5, y: 5 });
    const withEdit = {
      ...scenario,
      workflows: scenario.workflows.map((row) =>
        row.id === edited.id ? edited : row,
      ),
    };
    const locateEnd = suggestionFor("sar-locate", {
      "q.sar.target": ["person"],
      "q.sar.location": ["unknown"],
      "q.sar.failure": ["end"],
    });
    const result = applyOperations(withEdit, locateEnd.operations);
    expect(result.ok).toBe(false);
  });

  it("unassigns equipment when its generated person is removed", () => {
    const org = suggestionFor("org-team", {
      "q.org.team-kind": ["search-rescue"],
      "q.org.deviation": ["as-recommended"],
    });
    const withTeam = apply(blankScenario("sar"), org.operations);
    const person = withTeam.stations.find((row) => row.player);
    expect(person).toBeDefined();
    if (!person) return;
    const withEquipment = scenarioSchema.parse({
      ...withTeam,
      equipment: [
        {
          id: "equip-1",
          packId: "",
          name: "Radio",
          category: "comms",
          assignedTo: { teamId: person.team, personId: person.id },
        },
      ],
    });
    const result = applyOperations(withEquipment, [
      { op: "remove-generated-entity", collection: "stations", id: person.id },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.scenario.equipment[0].assignedTo.personId).toBe("");
  });
});
