import { describe, expect, it } from "vitest";
import { blankScenario, injectSchema } from "../../../core/training";
import { eventSummary } from "./eventSummary";

describe("eventSummary", () => {
  it("accepts MSEL metadata on an event", () => {
    const event = injectSchema.parse({
      id: "e1",
      name: "Communications degradation",
      trigger: "timer",
      at: 300,
      actions: [{ type: "message", text: "Radio degraded" }],
      purpose: "Test information handling",
      objective: "obj-1",
      expectedOutcome: ["report generated"],
      evidence: ["decision recorded"],
    });
    expect(event.purpose).toBe("Test information handling");
    expect(event.objective).toBe("obj-1");
    expect(event.expectedOutcome).toEqual(["report generated"]);
    expect(event.evidence).toEqual(["decision recorded"]);
  });

  it("names the linked training objective in the summary", () => {
    const scenario = {
      ...blankScenario("custom"),
      objectives: [{ id: "obj-1", name: "Locate the casualty" }],
    };
    const event = injectSchema.parse({
      id: "e1",
      name: "E",
      trigger: "timer",
      at: 60,
      actions: [{ type: "message", text: "X" }],
      objective: "obj-1",
    });
    expect(eventSummary(event, scenario)).toContain("Locate the casualty");
  });
});
