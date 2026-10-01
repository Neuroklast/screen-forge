import { describe, expect, it } from "vitest";
import { blankScenario } from "../../core/training";
import {
  addActor,
  addParticipant,
  addPatient,
  addTeam,
  addTeamFromTemplate,
  removeParticipant,
  removeTeam,
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

  it("creates a team from a template with role staffing and equipment", () => {
    const result = addTeamFromTemplate(blankScenario("custom"), "compact-field");
    const team = result.scenario.teams[0];
    expect(team.templateId).toBe("compact-field");
    expect(team.callsign).toBeTruthy();
    const staff = result.scenario.stations.filter(
      (station) => station.team === team.id && station.player,
    );
    expect(staff.length).toBeGreaterThanOrEqual(4);
    const equipment = result.scenario.equipment.filter(
      (item) => item.assignedTo.teamId === team.id,
    );
    expect(equipment.length).toBeGreaterThan(0);
    // Removing the team unassigns its equipment instead of orphaning it.
    const removed = removeTeam(result.scenario, team.id);
    expect(
      removed.equipment.every((item) => item.assignedTo.teamId === ""),
    ).toBe(true);
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
