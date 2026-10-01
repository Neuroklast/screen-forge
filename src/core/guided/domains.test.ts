import { describe, expect, it } from "vitest";
import { contextFor, evaluateSuggestions } from "./engine";
import { blankScenario, sessionWith } from "./fixtures";
import { applyOperations } from "./operations";
import { domainPacks, packsForIntent } from "./domains/registry";
import { de } from "../../i18n/de";
import { en } from "../../i18n/en";
import { lintMission } from "../missionLint";
import { scenarioSchema, type Scenario } from "../training";
import { workflowSettles } from "../workflow";
import {
  guidedDomainScenarioType,
  type GuidedDomain,
  type GuidedSession,
  type Suggestion,
} from "./types";

const maximalAnswers: Record<GuidedDomain, Record<string, string[]>> = {
  "search-rescue": {
    "q.sar.target": ["person"],
    "q.sar.location": ["unknown"],
    "q.sar.sources": ["radio", "beacon", "map"],
    "q.sar.failure": ["retry"],
    "q.sar.condition": ["critical"],
  },
  medical: {
    "q.med.arrival": ["event"],
    "q.med.clarity": ["none"],
    "q.med.treatment": ["advanced"],
  },
  technical: {
    "q.tech.cause": ["yes"],
    "q.tech.access": ["locked"],
    "q.tech.failure": ["escalate"],
  },
  disposal: {
    "q.eod.assembly": ["armed"],
    "q.eod.access": ["no"],
    "q.eod.failure": ["consequence"],
  },
  film: {
    "q.film.action": ["reactions"],
  },
  free: {},
};

function applyAll(scenario: Scenario, suggestions: Suggestion[]): Scenario {
  let next = scenario;
  for (const suggestion of suggestions) {
    const result = applyOperations(next, suggestion.operations);
    expect(result.ok, result.ok ? "" : result.error).toBe(true);
    if (!result.ok) return next;
    next = result.scenario;
  }
  return next;
}

describe("guided domain packs", () => {
  it("registers every domain under a unique id", () => {
    const ids = domainPacks.map((pack) => pack.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(new Set(Object.keys(maximalAnswers)));
  });

  it("resolves the primary domain before enabled domains without duplicates", () => {
    const packs = packsForIntent({
      primaryDomain: "search-rescue",
      enabledDomains: ["medical", "search-rescue"],
      goal: "",
    });
    expect(packs.map((pack) => pack.id)).toEqual(["search-rescue", "medical"]);
  });

  it("defines every question and reason label in both dictionaries", () => {
    for (const pack of domainPacks)
      for (const question of pack.questions) {
        expect(de[question.labelKey], question.labelKey).toBeTruthy();
        expect(en[question.labelKey], question.labelKey).toBeTruthy();
        for (const option of question.options) {
          expect(de[option.labelKey], option.labelKey).toBeTruthy();
          expect(en[option.labelKey], option.labelKey).toBeTruthy();
        }
      }
    for (const [domain, answers] of Object.entries(maximalAnswers) as [
      GuidedDomain,
      Record<string, string[]>,
    ][]) {
      const session = sessionWith(domain, answers);
      const scenario = blankScenario(guidedDomainScenarioType[domain]);
      for (const suggestion of evaluateSuggestions(contextFor(scenario, session))) {
        expect(de[suggestion.reason.key], suggestion.reason.key).toBeTruthy();
        expect(en[suggestion.reason.key], suggestion.reason.key).toBeTruthy();
      }
    }
  });

  it("produces a valid, deterministic, idempotent scenario for every domain", () => {
    for (const [domain, answers] of Object.entries(maximalAnswers) as [
      GuidedDomain,
      Record<string, string[]>,
    ][]) {
      const session = sessionWith(domain, answers);
      const type = guidedDomainScenarioType[domain];
      const ctx = contextFor(blankScenario(type), session);
      const first = evaluateSuggestions(ctx);
      expect(evaluateSuggestions(ctx)).toEqual(first);
      const applied = applyAll(blankScenario(type), first);
      expect(scenarioSchema.safeParse(applied).success).toBe(true);
      for (const workflow of applied.workflows)
        expect(workflowSettles(workflow)).toBe(true);
      if (first.length > 0)
        expect(
          lintMission(applied).filter((finding) => finding.severity === "error"),
        ).toEqual([]);
      expect(applyAll(applied, first)).toEqual(applied);
    }
  });

  it("proposes a search phase only when the location is not exact", () => {
    const unknown = sessionWith("search-rescue", { "q.sar.location": ["unknown"] });
    const unknownRules = evaluateSuggestions(
      contextFor(blankScenario("sar"), unknown),
    ).map((row) => row.ruleId);
    expect(unknownRules).toContain("sar-locate");
    const exact = sessionWith("search-rescue", { "q.sar.location": ["exact"] });
    const exactRules = evaluateSuggestions(
      contextFor(blankScenario("sar"), exact),
    ).map((row) => row.ruleId);
    expect(exactRules).not.toContain("sar-locate");
    expect(exactRules).toContain("sar-recover");
  });

  it("derives devices and events from the selected sources and condition", () => {
    const session = sessionWith("search-rescue", {
      "q.sar.location": ["unknown"],
      "q.sar.sources": ["beacon"],
      "q.sar.condition": ["critical"],
    });
    const suggestions = evaluateSuggestions(
      contextFor(blankScenario("sar"), session),
    );
    const sources = suggestions.find((row) => row.ruleId === "sar-sources");
    expect(
      sources?.operations.some(
        (op) => op.op === "add-prop" && op.prop.kind === "beacon",
      ),
    ).toBe(true);
    expect(
      suggestions.find((row) => row.ruleId === "sar-condition")?.operations.some(
        (op) => op.op === "add-event",
      ),
    ).toBe(true);
  });

  it("derives a locked-access module and an escalation event", () => {
    const session = sessionWith("technical", {
      "q.tech.cause": ["yes"],
      "q.tech.access": ["locked"],
      "q.tech.failure": ["escalate"],
    });
    const suggestions = evaluateSuggestions(
      contextFor(blankScenario("technical"), session),
    );
    const access = suggestions.find((row) => row.ruleId === "tech-access");
    expect(
      access?.operations.some(
        (op) => op.op === "add-prop" && op.prop.kind === "keycard",
      ),
    ).toBe(true);
    expect(
      suggestions.find((row) => row.ruleId === "tech-escalate")?.operations.some(
        (op) => op.op === "add-event",
      ),
    ).toBe(true);
  });

  it("builds branching outcomes for reaction sequences", () => {
    const session = sessionWith("film", { "q.film.action": ["reactions"] });
    const suggestions = evaluateSuggestions(
      contextFor(blankScenario("film"), session),
    );
    const sequence = suggestions.find((row) => row.ruleId === "film-sequence");
    const workflow = sequence?.operations.find(
      (op) => op.op === "add-workflow",
    );
    expect(
      workflow?.op === "add-workflow" &&
        workflow.workflow.nodes.some((node) => node.type === "task" && node.task === "choice"),
    ).toBe(true);
  });

  it("composes SAR and medical packs into one valid scenario", () => {
    const session = sessionWith("search-rescue", maximalAnswers["search-rescue"], [
      "medical",
    ]);
    const withMedical: GuidedSession = {
      ...session,
      answers: { ...session.answers, ...maximalAnswers.medical },
    };
    const packs = packsForIntent(withMedical.intent);
    const suggestions = evaluateSuggestions(
      contextFor(blankScenario("sar"), withMedical, packs),
    );
    const ruleIds = new Set(suggestions.map((row) => row.ruleId));
    expect(ruleIds.has("sar-locate")).toBe(true);
    expect(ruleIds.has("med-patient")).toBe(true);
    const scenario = applyAll(blankScenario("sar"), suggestions);
    expect(scenario.patients).toHaveLength(1);
    expect(lintMission(scenario).filter((row) => row.severity === "error")).toEqual(
      [],
    );
  });

  it("composes two structurally different packs (technical + disposal)", () => {
    const session = sessionWith("technical", maximalAnswers.technical, ["disposal"]);
    const withDisposal: GuidedSession = {
      ...session,
      answers: { ...session.answers, ...maximalAnswers.disposal },
    };
    const suggestions = evaluateSuggestions(
      contextFor(blankScenario("technical"), withDisposal),
    );
    const ruleIds = new Set(suggestions.map((row) => row.ruleId));
    expect(ruleIds.has("tech-diagnose")).toBe(true);
    expect(ruleIds.has("eod-setup")).toBe(true);
    const scenario = applyAll(blankScenario("technical"), suggestions);
    expect(lintMission(scenario).filter((row) => row.severity === "error")).toEqual(
      [],
    );
  });
});
