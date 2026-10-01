import { describe, expect, it } from "vitest";
import {
  contextFor,
  deepFreeze,
  detectSuggestionConflicts,
  evaluateSuggestions,
  missingGuidedInfo,
  nextQuestionCards,
  normalizeSuggestions,
} from "./engine";
import { blankScenario, sessionWith } from "./fixtures";
import type {
  DomainPack,
  GuidedQuestion,
  GuidedRule,
  Suggestion,
} from "./types";

const question = (id: string, group: string, priority: GuidedQuestion["priority"]): GuidedQuestion => ({
  id,
  domain: "free",
  group,
  labelKey: "guided.test.label",
  priority,
  dependsOn: [],
  appliesWhen: () => true,
  options: [
    {
      id: "yes",
      labelKey: "guided.test.yes",
      effects: [{ fact: id, value: true }],
    },
    {
      id: "no",
      labelKey: "guided.test.no",
      effects: [{ fact: id, value: false }],
    },
  ],
});

const qa = question("q.a", "g.a", "structural");
const qb = question("q.b", "g.b", "blocking");
const qc: GuidedQuestion = {
  ...question("q.c", "g.a", "useful"),
  appliesWhen: (facts) => facts["q.a"] === true,
};

const rule = (id: string, suggestion: (ctx: ReturnType<typeof contextFor>) => Suggestion): GuidedRule => ({
  id,
  domain: "free",
  dependsOn: [],
  evaluate: (ctx) => [suggestion(ctx)],
});

const setCapability = (
  id: string,
  value: boolean,
): Suggestion => ({
  id,
  ruleId: `free-${id}`,
  subjectKey: "main",
  reason: { key: "guided.test.reason" },
  operations: [{ op: "set-capability", key: "patients", value }],
});

const pack = (rules: GuidedRule[], questions: GuidedQuestion[] = [qa, qb, qc]): DomainPack => ({
  id: "free",
  token: "free",
  scenarioType: "custom",
  questions,
  rules,
});

const scenario = blankScenario("custom");
const empty = sessionWith("free", {});

describe("guided engine", () => {
  it("evaluates every rule against the same immutable snapshot", () => {
    let mutationRejected: boolean | undefined;
    const probe: GuidedRule = {
      id: "free-probe",
      domain: "free",
      dependsOn: [],
      evaluate: (ctx) => {
        mutationRejected = !Reflect.set(ctx.facts, "q.a", true);
        return [];
      },
    };
    const ctx = deepFreeze(contextFor(scenario, empty, [pack([probe])]));
    evaluateSuggestions(ctx);
    expect(mutationRejected).toBe(true);
  });

  it("is deterministic and independent of rule order", () => {
    const one = pack([rule("free-a", () => setCapability("s-a", true)), rule("free-b", () => setCapability("s-b", true))]);
    const two = pack([rule("free-b", () => setCapability("s-b", true)), rule("free-a", () => setCapability("s-a", true))]);
    const first = evaluateSuggestions(contextFor(scenario, empty, [one]));
    const second = evaluateSuggestions(contextFor(scenario, empty, [two]));
    expect(second).toEqual(first);
    expect(evaluateSuggestions(contextFor(scenario, empty, [one]))).toEqual(first);
  });

  it("detects conflicting writes and duplicate ids", () => {
    const a = rule("free-a", () => setCapability("s-a", true));
    const b = rule("free-b", () => setCapability("s-b", false));
    const suggestions = evaluateSuggestions(contextFor(scenario, empty, [pack([a, b])]));
    const conflicts = detectSuggestionConflicts(suggestions);
    expect(conflicts.map((row) => row.reason)).toContain(
      "conflicting-write:capability:patients",
    );
    const duplicate = normalizeSuggestions([setCapability("dup", true), { ...setCapability("dup", false) }]);
    expect(duplicate).toHaveLength(1);
    expect(detectSuggestionConflicts([setCapability("dup", true), { ...setCapability("dup", false) }]).map((row) => row.reason)).toContain("duplicate-suggestion-id");
  });

  it("returns one decision card per group in priority order", () => {
    const cards = nextQuestionCards(contextFor(scenario, empty, [pack([])]));
    expect(cards.map((card) => card.id)).toEqual(["g.b", "g.a"]);
    expect(cards[1].questions.map((q) => q.id)).toEqual(["q.a"]);
    const answered = sessionWith("free", { "q.a": ["yes"] });
    const next = nextQuestionCards(contextFor(scenario, answered, [pack([])]));
    expect(next.map((card) => card.id)).toEqual(["g.b", "g.a"]);
    expect(next[0].priority).toBe("blocking");
    expect(next[1].questions.map((q) => q.id)).toEqual(["q.c"]);
  });

  it("reports only missing guided information", () => {
    const missing = missingGuidedInfo(contextFor(scenario, empty, [pack([])]));
    expect(missing).toEqual([
      { questionId: "q.b", priority: "blocking" },
      { questionId: "q.a", priority: "structural" },
    ]);
  });
});
