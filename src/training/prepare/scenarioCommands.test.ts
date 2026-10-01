import { describe, expect, it } from "vitest";
import { blankScenario } from "../../core/training";
import {
  addObjective,
  addZone,
  removeZone,
  setCapability,
  setMap,
  setMissionName,
  setScenarioType,
  updateObjective,
} from "./scenarioCommands";

describe("scenarioCommands", () => {
  it("does not mutate the input scenario", () => {
    const scenario = blankScenario("custom");
    const before = structuredClone(scenario);
    setMissionName(scenario, "Relay");
    setScenarioType(scenario, "medical");
    setMap(scenario, { lat: 1, lng: 2 });
    addZone(scenario);
    addObjective(scenario);
    expect(scenario).toEqual(before);
  });

  it("sets name, type and map fields", () => {
    const scenario = blankScenario("custom");
    expect(setMissionName(scenario, "Relay").name).toBe("Relay");
    const medical = setScenarioType(scenario, "medical");
    expect(medical.type).toBe("medical");
    expect(medical.capabilities).toEqual({});
    expect(setMap(scenario, { lat: 12, lng: 34 }).map.lat).toBe(12);
  });

  it("adds and removes zones and objectives", () => {
    const scenario = blankScenario("custom");
    const withZone = addZone(scenario);
    expect(withZone.zones).toHaveLength(1);
    expect(removeZone(withZone, withZone.zones[0].id).zones).toHaveLength(0);

    const withObjective = addObjective(scenario);
    expect(withObjective.objectives).toHaveLength(1);
    expect(
      updateObjective(withObjective, withObjective.objectives[0].id, {
        name: "Y",
      }).objectives[0].name,
    ).toBe("Y");
  });

  it("sets a capability override only when it differs from the type preset", () => {
    const scenario = blankScenario("custom");
    // `custom` already has patients enabled, so disabling stores the override.
    expect(
      setCapability(scenario, "patients", false).capabilities.patients,
    ).toBe(false);
    // Re-enabling matches the preset again and clears the override.
    const disabled = setCapability(scenario, "patients", false);
    expect(
      setCapability(disabled, "patients", true).capabilities.patients,
    ).toBeUndefined();
  });
});
