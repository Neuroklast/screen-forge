import { describe, expect, it } from "vitest";
import { contextFor, evaluateSuggestions } from "./engine";
import { blankScenario, sessionWith } from "./fixtures";
import { applyOperations } from "./operations";
import { lintMission } from "../missionLint";
import { scenarioSchema, type Scenario } from "../training";
import { workflowSettles } from "../workflow";
import { guidedSessionSchema } from "./types";

const knowledges = ["exact", "approximate", "unknown"] as const;
const failures = ["retry", "consequence", "alternative", "end"] as const;
const sourceFlags = ["radio", "gps", "map", "witness", "beacon"] as const;

function subsets<T>(values: readonly T[]): T[][] {
  return values.reduce<T[][]>(
    (acc, value) => [...acc, ...acc.map((set) => [...set, value])],
    [[]],
  );
}

function applyAll(scenario: Scenario, suggestions: ReturnType<typeof evaluateSuggestions>): Scenario {
  let next = scenario;
  for (const suggestion of suggestions) {
    const result = applyOperations(next, suggestion.operations);
    expect(result.ok, result.ok ? "" : result.error).toBe(true);
    if (!result.ok) return next;
    next = result.scenario;
  }
  return next;
}

describe("guided invariants", () => {
  it("keeps the scenario valid for every bounded SAR fact combination", () => {
    for (const knowledge of knowledges)
      for (const failure of failures)
        for (const sources of subsets(sourceFlags)) {
          const answers: Record<string, string[]> = {
            "q.sar.target": ["person"],
            "q.sar.location": [knowledge],
            "q.sar.failure": [failure],
            "q.sar.condition": ["critical"],
            ...(sources.length ? { "q.sar.sources": sources } : {}),
          };
          const session = sessionWith("search-rescue", answers);
          const ctx = contextFor(blankScenario("sar"), session);
          const first = evaluateSuggestions(ctx);
          const second = evaluateSuggestions(ctx);
          expect(second).toEqual(first);

          const applied = applyAll(blankScenario("sar"), first);
          expect(scenarioSchema.safeParse(applied).success).toBe(true);
          for (const workflow of applied.workflows)
            expect(workflowSettles(workflow)).toBe(true);
          expect(
            lintMission(applied).filter((finding) => finding.severity === "error"),
          ).toEqual([]);

          const replay = applyAll(applied, first);
          expect(replay).toEqual(applied);
        }
  });

  it("handles boundary fact values deterministically", () => {
    const session = guidedSessionSchema.parse({
      version: 1,
      intent: { primaryDomain: "search-rescue", enabledDomains: [], goal: "" },
      explicitFacts: {
        "sar.locationKnowledge": "x".repeat(120),
        "sar.failureMode": 0,
      },
    });
    const scenario = blankScenario("sar");
    const first = evaluateSuggestions(contextFor(scenario, session));
    const second = evaluateSuggestions(contextFor(scenario, session));
    expect(second).toEqual(first);
  });
});
