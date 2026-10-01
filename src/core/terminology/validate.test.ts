import { describe, expect, it } from "vitest";
import { phrases, terms } from "../../i18n/terminology/registry";
import { validateTerminology } from "./validate";

describe("terminology validation", () => {
  it("reports no errors for the shipped dictionary", () => {
    const errors = validateTerminology().filter(
      (issue) => issue.level === "error",
    );
    expect(errors).toEqual([]);
  });

  it("covers the required semantic anchors", () => {
    const ids = new Set(terms.map((term) => term.id));
    for (const id of [
      "mission",
      "common_operational_picture",
      "exercise_control",
      "after_action_review",
      "master_scenario_events_list",
      "special_operations_forces",
      "nav.mission",
    ])
      expect(ids.has(id)).toBe(true);
    expect(phrases.length).toBeGreaterThan(0);
  });
});
