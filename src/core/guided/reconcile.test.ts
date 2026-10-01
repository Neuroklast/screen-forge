import { describe, expect, it } from "vitest";
import { applySuggestion, contextFor, evaluateSuggestions } from "./engine";
import { blankScenario, sessionWith } from "./fixtures";
import { entityRef, nodeRef } from "./meta";
import { applyOperations } from "./operations";
import { reconcile } from "./reconcile";
import { setNodePosition } from "../workflowEdit";
import type { Scenario } from "../training";
import { guidedSessionSchema } from "./types";

function locateSetup(): { scenario: Scenario; session: ReturnType<typeof sessionWith> } {
  const session = sessionWith("search-rescue", {
    "q.sar.target": ["person"],
    "q.sar.location": ["unknown"],
    "q.sar.failure": ["retry"],
  });
  const scenario = blankScenario("sar");
  const locate = evaluateSuggestions(contextFor(scenario, session)).find(
    (row) => row.ruleId === "sar-locate",
  );
  if (!locate) throw new Error("Missing locate suggestion");
  const applied = applySuggestion(scenario, session, locate);
  if (!applied.ok) throw new Error(applied.error);
  return { scenario: applied.scenario, session: applied.session };
}

function changeToExact(session: ReturnType<typeof sessionWith>) {
  return guidedSessionSchema.parse({
    ...session,
    answers: { ...session.answers, "q.sar.location": ["exact"] },
  });
}

describe("guided reconciliation", () => {
  it("keeps generated content while the answers still produce it", () => {
    const { scenario, session } = locateSetup();
    const result = reconcile(scenario, session);
    expect(result.remove).toEqual([]);
    expect(result.conflicts).toEqual([]);
    expect(result.keep.length).toBeGreaterThan(0);
    expect(result.add.some((row) => row.ruleId === "sar-locate")).toBe(false);
  });

  it("marks generated content as removable after an earlier answer changes", () => {
    const { scenario, session } = locateSetup();
    const changed = changeToExact(session);
    const result = reconcile(scenario, changed);
    expect(result.remove.some((row) => row.ref.startsWith("workflows:"))).toBe(true);
    expect(result.remove.some((row) => row.ref.startsWith("stations:"))).toBe(true);
    expect(result.add.some((row) => row.ruleId === "sar-recover")).toBe(true);
  });

  it("never touches user-created content", () => {
    const { scenario, session } = locateSetup();
    const added = applyOperations(scenario, [
      {
        op: "add-station",
        station: { id: "user-terminal", name: "User Terminal", role: "element", module: "terminal" },
      },
    ]);
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    const result = reconcile(added.scenario, changeToExact(session));
    const refs = [
      ...result.keep,
      ...result.remove.map((row) => row.ref),
      ...result.conflicts.map((row) => row.ref),
    ];
    expect(refs).not.toContain(entityRef("stations", "user-terminal"));
  });

  it("reports edited generated content as a conflict instead of deleting it", () => {
    const { scenario, session } = locateSetup();
    const workflow = scenario.workflows[0];
    const edited = setNodePosition(workflow, "found", { x: 9, y: 9 });
    const withEdit = {
      ...scenario,
      workflows: scenario.workflows.map((row) =>
        row.id === edited.id ? edited : row,
      ),
    };
    const result = reconcile(withEdit, changeToExact(session));
    expect(
      result.conflicts.some(
        (row) => row.ref === nodeRef(workflow.id, "found") && row.reason === "modified",
      ),
    ).toBe(true);
    expect(result.remove.every((row) => row.ref !== nodeRef(workflow.id, "found"))).toBe(true);
  });

  it("produces no removals when nothing changed", () => {
    const { scenario, session } = locateSetup();
    const first = reconcile(scenario, session);
    const second = reconcile(scenario, session);
    expect(second.remove).toEqual(first.remove);
    expect(second.keep).toEqual(first.keep);
  });
});
