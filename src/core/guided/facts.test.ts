import { describe, expect, it } from "vitest";
import { packsForIntent } from "./domains/registry";
import { deriveFacts } from "./facts";
import { blankScenario, sessionWith } from "./fixtures";
import { contextFor, evaluateSuggestions } from "./engine";
import { guidedSessionSchema } from "./types";

const sarPacks = packsForIntent({
  primaryDomain: "search-rescue",
  enabledDomains: [],
  goal: "",
});

describe("guided facts", () => {
  it("folds option effects from all active packs", () => {
    const session = sessionWith(
      "search-rescue",
      {
        "q.sar.target": ["person"],
        "q.sar.location": ["unknown"],
        "q.sar.sources": ["beacon", "map"],
      },
      ["medical"],
    );
    const sessionWithMedical = guidedSessionSchema.parse({
      ...session,
      answers: { ...session.answers, "q.med.arrival": ["event"] },
    });
    const packs = packsForIntent(sessionWithMedical.intent);
    const facts = deriveFacts(sessionWithMedical, packs);
    expect(facts["sar.targetKind"]).toBe("person");
    expect(facts["sar.locationKnowledge"]).toBe("unknown");
    expect(facts["sar.source.beacon"]).toBe(true);
    expect(facts["sar.source.map"]).toBe(true);
    expect(facts["med.arrival"]).toBe("event");
  });

  it("lets explicit facts override derived ones", () => {
    const session = sessionWith("search-rescue", {
      "q.sar.location": ["unknown"],
    });
    const withOverride = guidedSessionSchema.parse({
      ...session,
      explicitFacts: { "sar.locationKnowledge": "exact" },
    });
    const facts = deriveFacts(withOverride, sarPacks);
    expect(facts["sar.locationKnowledge"]).toBe("exact");
  });

  it("reconstructs identical facts and suggestions after a reload", () => {
    const session = sessionWith("search-rescue", {
      "q.sar.target": ["group"],
      "q.sar.location": ["approximate"],
      "q.sar.sources": ["radio"],
      "q.sar.failure": ["alternative"],
    });
    const scenario = blankScenario("sar");
    const before = evaluateSuggestions(contextFor(scenario, session, sarPacks));
    const reloaded = guidedSessionSchema.parse(
      JSON.parse(JSON.stringify(session)),
    );
    const after = evaluateSuggestions(contextFor(scenario, reloaded, sarPacks));
    expect(after).toEqual(before);
    expect(deriveFacts(reloaded, sarPacks)).toEqual(
      deriveFacts(session, sarPacks),
    );
  });
});
