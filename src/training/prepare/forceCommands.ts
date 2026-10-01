import {
  actorSchema,
  equipmentItemSchema,
  patientSchema,
  stationSchema,
  teamSchema,
  type Scenario,
} from "../../core/training";
import { randomCallsignRoot, renderCallsign } from "../../core/callsigns";
import { equipmentItemsForPacks } from "../../core/equipment";
import { teamRoleLabel } from "../../core/roles";
import { teamTemplate } from "../../core/teamTemplates";
import { markGeneratedModified } from "../../core/guided/meta";
import type { GeneratedMeta } from "../../core/guided/types";
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

// Creates a team from a template: a fictional callsign, then one participant per
// recommended role slot with the primary role attached. Optional attachments
// stay suggestions (see the team inspector).
export function addTeamFromTemplate(
  scenario: Scenario,
  templateId: string,
  rng: () => number = Math.random,
): { scenario: Scenario; teamId: string } {
  const template = teamTemplate(templateId);
  if (!template) return { scenario, teamId: "" };
  const element =
    scenario.teams.filter((team) => team.templateId === templateId).length + 1;
  const scheme = template.callsignScheme
    ? { ...template.callsignScheme, root: randomCallsignRoot(rng) }
    : undefined;
  const callsign = scheme ? renderCallsign(scheme, element) : template.label;
  const team = teamSchema.parse({
    id: uid("team").toUpperCase().replace("-", ""),
    name: callsign,
    templateId: template.id,
    callsign,
  });
  const stations: Scenario["stations"] = [];
  let index = 0;
  for (const slot of template.roles) {
    for (let count = 0; count < slot.recommended; count++) {
      index += 1;
      stations.push(
        stationSchema.parse({
          id: uid("participant"),
          name: `${callsign} ${index} · ${teamRoleLabel(slot.roleId)}`,
          role: "element",
          module: "tracking",
          player: true,
          team: team.id,
          roleId: slot.roleId,
        }),
      );
    }
  }
  // The template's equipment packs become suggestions assigned to the team.
  const equipment = equipmentItemsForPacks(template.equipmentPacks ?? []).map(
    ({ packId, spec }) =>
      equipmentItemSchema.parse({
        id: uid("equip"),
        packId,
        name: t(spec.nameKey),
        category: t(spec.categoryKey),
        quantity: spec.quantity,
        required: spec.required,
        assignedTo: { teamId: team.id, personId: "" },
      }),
  );
  return {
    scenario: {
      ...scenario,
      teams: [...scenario.teams, team],
      stations: [...scenario.stations, ...stations],
      equipment: [...scenario.equipment, ...equipment],
    },
    teamId: team.id,
  };
}

// A manual edit of guided-generated content freezes it: reconciliation may
// then only report a conflict, never overwrite or delete it.
function edited<T extends { origin?: GeneratedMeta }>(row: T): T {
  return markGeneratedModified(row);
}

export function updateTeam(
  scenario: Scenario,
  id: string,
  patch: Partial<Team>,
): Scenario {
  return {
    ...scenario,
    teams: scenario.teams.map((team) =>
      team.id === id ? edited({ ...team, ...patch }) : team,
    ),
  };
}

export function removeTeam(scenario: Scenario, id: string): Scenario {
  return {
    ...scenario,
    teams: scenario.teams.filter((team) => team.id !== id),
    // Referential integrity: equipment assigned to the removed team is unassigned.
    equipment: scenario.equipment.map((item) =>
      item.assignedTo.teamId === id
        ? { ...item, assignedTo: { ...item.assignedTo, teamId: "" } }
        : item,
    ),
  };
}

export function updateEquipment(
  scenario: Scenario,
  id: string,
  patch: Partial<Scenario["equipment"][number]>,
): Scenario {
  return {
    ...scenario,
    equipment: scenario.equipment.map((item) =>
      item.id === id ? { ...item, ...patch } : item,
    ),
  };
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
  const next: Scenario = {
    ...scenario,
    stations: scenario.stations.map((station) =>
      station.id === id ? edited({ ...station, ...patch }) : station,
    ),
  };
  // Moving a person to another team unassigns equipment that stays behind, so
  // the item never points at someone who is no longer in its team.
  if (patch.team === undefined) return next;
  return {
    ...next,
    equipment: next.equipment.map((item) =>
      item.assignedTo.personId === id && item.assignedTo.teamId !== patch.team
        ? { ...item, assignedTo: { ...item.assignedTo, personId: "" } }
        : item,
    ),
  };
}

export function removeParticipant(scenario: Scenario, id: string): Scenario {
  return {
    ...scenario,
    stations: scenario.stations.filter((station) => station.id !== id),
    // Referential integrity: equipment assigned to the removed person is unassigned.
    equipment: scenario.equipment.map((item) =>
      item.assignedTo.personId === id
        ? { ...item, assignedTo: { ...item.assignedTo, personId: "" } }
        : item,
    ),
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
