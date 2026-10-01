import { describe, expect, it } from "vitest";
import { blankScenario } from "../../core/training";
import {
  addActor,
  addParticipant,
  addPatient,
  addTeam,
  removeParticipant,
  updateActor,
  updateTeam,
} from "./forceCommands";

describe("forceCommands", () => {
  it("adds teams, participants, actors and patients", () => {
    let scenario = blankScenario("custom");
    scenario = addTeam(scenario);
    expect(scenario.teams).toHaveLength(1);
    scenario = addParticipant(scenario);
    expect(scenario.stations.filter((station) => station.player)).toHaveLength(1);
    scenario = addActor(scenario);
    expect(scenario.actors).toHaveLength(1);
    scenario = addPatient(scenario);
    expect(scenario.patients).toHaveLength(1);
  });

  it("does not mutate the input", () => {
    const scenario = blankScenario("custom");
    const before = structuredClone(scenario);
    addTeam(scenario);
    addParticipant(scenario);
    addActor(scenario);
    addPatient(scenario);
    expect(scenario).toEqual(before);
  });

  it("updates and removes entities", () => {
    const withTeam = addTeam(blankScenario("custom"));
    const teamId = withTeam.teams[0].id;
    expect(updateTeam(withTeam, teamId, { name: "Alpha" }).teams[0].name).toBe(
      "Alpha",
    );

    const withActor = addActor(blankScenario("custom"));
    const actorId = withActor.actors[0].id;
    expect(
      updateActor(withActor, actorId, { character: "Pilot" }).actors[0]
        .character,
    ).toBe("Pilot");

    const withParticipant = addParticipant(blankScenario("custom"));
    const stationId = withParticipant.stations[0].id;
    expect(removeParticipant(withParticipant, stationId).stations).toHaveLength(
      0,
    );
  });
});
