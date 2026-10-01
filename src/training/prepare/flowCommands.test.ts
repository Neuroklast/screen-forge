import { describe, expect, it } from "vitest";
import { blankScenario } from "../../core/training";
import {
  addEvent,
  addWorkflow,
  removeEvent,
  removeWorkflow,
  setInject,
  setWorkflow,
} from "./flowCommands";

describe("flowCommands", () => {
  it("adds and removes a workflow", () => {
    const result = addWorkflow(blankScenario("custom"));
    expect(result.scenario.workflows).toHaveLength(1);
    expect(
      removeWorkflow(result.scenario, result.id).workflows,
    ).toHaveLength(0);
  });

  it("adds, updates and removes an event", () => {
    const result = addEvent(blankScenario("custom"), "timer");
    expect(result.scenario.injects).toHaveLength(1);
    expect(setInject(result.scenario, result.id, { name: "X" }).injects[0].name).toBe(
      "X",
    );
    expect(removeEvent(result.scenario, result.id).injects).toHaveLength(0);
  });

  it("replaces a workflow by id", () => {
    const result = addWorkflow(blankScenario("custom"));
    const workflow = result.scenario.workflows[0];
    expect(
      setWorkflow(result.scenario, { ...workflow, name: "Renamed" }).workflows[0]
        .name,
    ).toBe("Renamed");
  });
});
