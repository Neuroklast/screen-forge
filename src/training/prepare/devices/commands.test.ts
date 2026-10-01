import { describe, expect, it } from "vitest";
import {
  blankScenario,
  stationSchema,
  type Scenario,
} from "../../../core/training";
import { devicePresets, type DevicePreset } from "../devicePresets";
import {
  addDevice,
  addProp,
  removeDevice,
  removeProp,
  setDeviceBinding,
  setDeviceOwner,
  setPresentation,
  updateDevice,
} from "./commands";

function preset(id: string): DevicePreset {
  const found = devicePresets.find((row) => row.id === id);
  if (!found) throw new Error(`unknown preset ${id}`);
  return found;
}

function withPlayer(scenario: Scenario): Scenario {
  const player = stationSchema.parse({
    id: "player-1",
    name: "Player 1",
    role: "element",
    module: "tracking",
    player: true,
    team: "team-1",
  });
  return {
    ...scenario,
    teams: [{ id: "team-1", name: "Team 1", color: "#80dce5" }],
    stations: [...scenario.stations, player],
  };
}

describe("device commands", () => {
  it("adds a device without mutating the input scenario", () => {
    const scenario = blankScenario("custom");
    const before = structuredClone(scenario);
    const { scenario: next, id } = addDevice(
      scenario,
      preset("terminal"),
      "scenario",
    );
    expect(scenario).toEqual(before);
    expect(next.stations).toHaveLength(1);
    expect(next.stations[0].id).toBe(id);
    expect(next.stations[0].module).toBe("terminal");
  });

  it("numbers repeated presets and provisions matching domain data", () => {
    const scenario = blankScenario("medical");
    const first = addDevice(scenario, preset("medical"), "scenario");
    const second = addDevice(first.scenario, preset("medical"), "scenario");
    expect(second.scenario.stations[0].name).not.toBe(
      second.scenario.stations[1].name,
    );
    // A medical device always arrives with a bound patient.
    expect(second.scenario.stations[1].bindings.patient).toBeTruthy();
    expect(second.scenario.patients.length).toBeGreaterThan(0);
  });

  it("maps a participant owner to that participant's team", () => {
    const scenario = withPlayer(blankScenario("custom"));
    const next = setDeviceOwner(scenario, "player-1", "participant:player-1");
    expect(next.stations.find((row) => row.id === "player-1")?.team).toBe(
      "team-1",
    );
  });

  it("updates and removes a device", () => {
    const scenario = blankScenario("custom");
    const { scenario: added, id } = addDevice(
      scenario,
      preset("terminal"),
      "scenario",
    );
    const renamed = updateDevice(added, id, { name: "Console 9" });
    expect(renamed.stations[0].name).toBe("Console 9");
    expect(removeDevice(renamed, id).stations).toHaveLength(0);
  });

  it("clears a station binding when its prop is removed", () => {
    const scenario = blankScenario("custom");
    const withDevice = addDevice(scenario, preset("ordnance"), "scenario");
    const propId = withDevice.scenario.stations[0].bindings.prop;
    expect(propId).toBeTruthy();
    const next = removeProp(withDevice.scenario, propId);
    expect(next.props).toHaveLength(0);
    expect(next.stations[0].bindings.prop).toBe("");
  });

  it("sets a binding and bumps the presentation revision", () => {
    const scenario = blankScenario("custom");
    const { scenario: added, id } = addDevice(
      scenario,
      preset("terminal"),
      "scenario",
    );
    const bound = setDeviceBinding(added, id, { objective: "obj-1" });
    expect(bound.stations[0].bindings.objective).toBe("obj-1");
    const presented = setPresentation(added, id, {
      config: { title: "RELAY-07" },
    });
    expect(presented.stations[0].presentation?.revision).toBe(1);
    expect(presented.stations[0].presentation?.config?.title).toBe("RELAY-07");
  });

  it("adds a prop", () => {
    const scenario = blankScenario("custom");
    expect(addProp(scenario).props).toHaveLength(1);
  });
});
