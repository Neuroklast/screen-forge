import {
  actorSchema,
  patientSchema,
  stationSchema,
  teamSchema,
  type Scenario,
} from "../../core/training";
import { t } from "../../i18n";
import { uid } from "./shared";

// The only write path for force edits (docs/architecture/commands.md): pure
// Scenario -> Scenario functions. People concepts only; devices live elsewhere.
type Team = Scenario["teams"][number];
type Station = Scenario["stations"][number];
type Actor = Scenario["actors"][number];
type Patient = Scenario["patients"][number];

export function addTeam(scenario: Scenario): Scenario {
  return {
    ...scenario,
    teams: [
      ...scenario.teams,
      teamSchema.parse({
        id: uid("team").toUpperCase().replace("-", ""),
        name: t("prep.people.teamName", { n: scenario.teams.length + 1 }),
      }),
    ],
  };
}

export function updateTeam(
  scenario: Scenario,
  id: string,
  patch: Partial<Team>,
): Scenario {
  return {
    ...scenario,
    teams: scenario.teams.map((team) =>
      team.id === id ? { ...team, ...patch } : team,
    ),
  };
}

export function removeTeam(scenario: Scenario, id: string): Scenario {
  return { ...scenario, teams: scenario.teams.filter((team) => team.id !== id) };
}

export function addParticipant(scenario: Scenario): Scenario {
  const count = scenario.stations.filter((station) => station.player).length;
  return {
    ...scenario,
    stations: [
      ...scenario.stations,
      stationSchema.parse({
        id: uid("participant"),
        name: t("prep.people.participantName", { n: count + 1 }),
        role: "element",
        module: "tracking",
        player: true,
        team: scenario.teams[0]?.id ?? "",
      }),
    ],
  };
}

export function updateParticipant(
  scenario: Scenario,
  id: string,
  patch: Partial<Station>,
): Scenario {
  return {
    ...scenario,
    stations: scenario.stations.map((station) =>
      station.id === id ? { ...station, ...patch } : station,
    ),
  };
}

export function removeParticipant(scenario: Scenario, id: string): Scenario {
  return {
    ...scenario,
    stations: scenario.stations.filter((station) => station.id !== id),
  };
}

export function addActor(scenario: Scenario): Scenario {
  return {
    ...scenario,
    actors: [
      ...scenario.actors,
      actorSchema.parse({
        id: uid("actor"),
        name: t("prep.people.actorName", { n: scenario.actors.length + 1 }),
      }),
    ],
  };
}

export function updateActor(
  scenario: Scenario,
  id: string,
  patch: Partial<Actor>,
): Scenario {
  return {
    ...scenario,
    actors: scenario.actors.map((actor) =>
      actor.id === id ? { ...actor, ...patch } : actor,
    ),
  };
}

export function removeActor(scenario: Scenario, id: string): Scenario {
  return {
    ...scenario,
    actors: scenario.actors.filter((actor) => actor.id !== id),
  };
}

export function addPatient(scenario: Scenario): Scenario {
  return {
    ...scenario,
    patients: [
      ...scenario.patients,
      patientSchema.parse({
        id: uid("patient"),
        name: t("prep.people.patientName", { n: scenario.patients.length + 1 }),
        kind: "stable",
        since: 0,
      }),
    ],
  };
}

export function updatePatient(
  scenario: Scenario,
  id: string,
  patch: Partial<Patient>,
): Scenario {
  return {
    ...scenario,
    patients: scenario.patients.map((patient) =>
      patient.id === id ? { ...patient, ...patch } : patient,
    ),
  };
}

export function removePatient(scenario: Scenario, id: string): Scenario {
  return {
    ...scenario,
    patients: scenario.patients.filter((patient) => patient.id !== id),
  };
}
