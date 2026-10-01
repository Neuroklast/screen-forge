import {
  withCapability,
  type CapabilityKey,
} from "../../core/capabilities";
import type { Scenario } from "../../core/training";
import { t } from "../../i18n";
import { uid } from "./shared";

// The only write path for mission edits (docs/architecture/commands.md): pure
// Scenario -> Scenario functions the shell applies through its undo stack.
export function setMissionName(scenario: Scenario, name: string): Scenario {
  return { ...scenario, name };
}

export function setScenarioType(
  scenario: Scenario,
  type: Scenario["type"],
): Scenario {
  return { ...scenario, type, capabilities: {} };
}

export function setMode(scenario: Scenario, mode: Scenario["mode"]): Scenario {
  return { ...scenario, mode };
}

export function setMap(
  scenario: Scenario,
  patch: Partial<Scenario["map"]>,
): Scenario {
  return { ...scenario, map: { ...scenario.map, ...patch } };
}

export function setCapability(
  scenario: Scenario,
  key: CapabilityKey,
  value: boolean,
): Scenario {
  return {
    ...scenario,
    capabilities: withCapability(
      scenario.type,
      scenario.capabilities,
      key,
      value,
    ),
  };
}

export function addZone(scenario: Scenario): Scenario {
  return {
    ...scenario,
    zones: [
      ...scenario.zones,
      {
        id: uid("zone"),
        name: t("editor.newZone"),
        lat: scenario.map.lat,
        lng: scenario.map.lng,
        radius: 100,
      },
    ],
  };
}

export function updateZone(
  scenario: Scenario,
  id: string,
  patch: Partial<Scenario["zones"][number]>,
): Scenario {
  return {
    ...scenario,
    zones: scenario.zones.map((zone) =>
      zone.id === id ? { ...zone, ...patch } : zone,
    ),
  };
}

export function removeZone(scenario: Scenario, id: string): Scenario {
  return { ...scenario, zones: scenario.zones.filter((zone) => zone.id !== id) };
}

export function addObjective(scenario: Scenario): Scenario {
  return {
    ...scenario,
    objectives: [
      ...scenario.objectives,
      { id: uid("objective"), name: t("editor.newObjective") },
    ],
  };
}

export function updateObjective(
  scenario: Scenario,
  id: string,
  patch: Partial<Scenario["objectives"][number]>,
): Scenario {
  return {
    ...scenario,
    objectives: scenario.objectives.map((objective) =>
      objective.id === id ? { ...objective, ...patch } : objective,
    ),
  };
}

export function removeObjective(scenario: Scenario, id: string): Scenario {
  return {
    ...scenario,
    objectives: scenario.objectives.filter((objective) => objective.id !== id),
  };
}
