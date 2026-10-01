import { scenarioSchema, type Scenario } from "../training.ts";
import {
  guidedSessionSchema,
  type GuidedDomain,
  type GuidedSession,
} from "./types.ts";

// Test fixtures for the guided engine. Not used by production code.
export function blankScenario(type: Scenario["type"] = "sar"): Scenario {
  return scenarioSchema.parse({
    version: 2,
    type,
    name: "Guided test",
    mode: "LIVE",
    seed: 1,
    map: { lat: 51.23, lng: 6.78, zoom: 15, tiles: "", attribution: "" },
    stations: [],
  });
}

export function sessionWith(
  primaryDomain: GuidedDomain,
  answers: Record<string, string[]>,
  enabledDomains: GuidedDomain[] = [],
): GuidedSession {
  return guidedSessionSchema.parse({
    version: 1,
    intent: { primaryDomain, enabledDomains, goal: "" },
    answers,
  });
}
