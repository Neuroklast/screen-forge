import { describe, expect, it } from "vitest";
import { applyEvent } from "./events";
import { dueAt, injectSchema, newState, template } from "./training";

describe("MEL v2", () => {
  it("fills additive fields with defaults for older injects", () => {
    const parsed = injectSchema.parse({
      id: "rule-1",
      name: "Old",
      trigger: "timer",
      actions: [{ type: "message", text: "hi" }],
    });
    expect(parsed.category).toBe("inject");
    expect(parsed.status).toBe("planned");
    expect(parsed.failurePolicy).toBe("continue");
    expect(parsed.plannedAtOriginal).toBeNull();
    expect(parsed.scheduledAt).toBeNull();
    expect(parsed.revision).toBe(0);
  });

  it("reschedules without losing the original planned time", () => {
    const state = newState("room", template("sar"));
    const inject = state.scenario.injects[0];
    const before = dueAt(inject, state.scenario.seed);
    applyEvent(state, {
      type: "msel.rescheduled",
      inject: inject.id,
      from: inject.at,
      to: 30,
      reason: "bring forward",
    });
    const updated = state.scenario.injects[0];
    expect(updated.plannedAtOriginal).toBe(inject.at);
    expect(updated.scheduledAt).toBe(30);
    expect(updated.revision).toBe(1);
    expect(dueAt(updated, state.scenario.seed)).not.toBe(before);
    expect(dueAt(updated, state.scenario.seed)).toBe(30);
  });
});
