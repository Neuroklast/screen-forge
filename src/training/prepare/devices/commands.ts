import type { SceneId, ScenePreset } from "../../../core/config";
import {
  editPresentation,
  propSchema,
  type Scenario,
  type TrainingStation,
} from "../../../core/training";
import { t } from "../../../i18n";
import type { DevicePreset } from "../devicePresets";
import { buildDevice, uid } from "../shared";

// The only write path for device edits (docs/architecture/commands.md): pure
// Scenario -> Scenario functions. The shell applies the result through its
// undo/redo stack; no component mutates the model directly.

type Bindings = TrainingStation["bindings"];

function teamForOwner(scenario: Scenario, owner: string): string {
  if (owner.startsWith("participant:")) {
    const participant = scenario.stations.find(
      (row) => row.id === owner.slice("participant:".length),
    );
    return participant?.team ?? "";
  }
  return owner === "scenario" ? "" : owner;
}

export function addDevice(
  scenario: Scenario,
  preset: DevicePreset,
  owner: string,
): { scenario: Scenario; id: string } {
  const { station, props, patients } = buildDevice(scenario, preset);
  const next: TrainingStation = { ...station, team: teamForOwner(scenario, owner) };
  return {
    scenario: {
      ...scenario,
      stations: [...scenario.stations, next],
      props,
      patients,
    },
    id: next.id,
  };
}

export function removeDevice(scenario: Scenario, id: string): Scenario {
  return {
    ...scenario,
    stations: scenario.stations.filter((row) => row.id !== id),
  };
}

export function updateDevice(
  scenario: Scenario,
  id: string,
  patch: Partial<TrainingStation>,
): Scenario {
  return {
    ...scenario,
    stations: scenario.stations.map((row) =>
      row.id === id ? { ...row, ...patch } : row,
    ),
  };
}

export function setDeviceOwner(
  scenario: Scenario,
  id: string,
  owner: string,
): Scenario {
  return updateDevice(scenario, id, { team: teamForOwner(scenario, owner) });
}

export function setDeviceBinding(
  scenario: Scenario,
  id: string,
  binding: Partial<Bindings>,
): Scenario {
  return {
    ...scenario,
    stations: scenario.stations.map((row) =>
      row.id === id ? { ...row, bindings: { ...row.bindings, ...binding } } : row,
    ),
  };
}

export function setPresentation(
  scenario: Scenario,
  id: string,
  patch: { scene?: SceneId | null; config?: Partial<ScenePreset> | null },
): Scenario {
  return {
    ...scenario,
    stations: scenario.stations.map((row) =>
      row.id === id
        ? { ...row, presentation: editPresentation(row.presentation, patch) }
        : row,
    ),
  };
}

export function addProp(scenario: Scenario): {
  scenario: Scenario;
  id: string;
} {
  const prop = propSchema.parse({
    id: uid("prop"),
    kind: "custom",
    name: t("prep.devices.propName", { n: scenario.props.length + 1 }),
  });
  return { scenario: { ...scenario, props: [...scenario.props, prop] }, id: prop.id };
}

export function updateProp(
  scenario: Scenario,
  id: string,
  patch: Partial<Scenario["props"][number]>,
): Scenario {
  return {
    ...scenario,
    props: scenario.props.map((row) =>
      row.id === id ? { ...row, ...patch } : row,
    ),
  };
}

export function removeProp(scenario: Scenario, id: string): Scenario {
  return {
    ...scenario,
    props: scenario.props.filter((row) => row.id !== id),
    // Referential integrity: a device bound to the removed prop is unbound.
    stations: scenario.stations.map((row) =>
      row.bindings.prop === id
        ? { ...row, bindings: { ...row.bindings, prop: "" } }
        : row,
    ),
  };
}
