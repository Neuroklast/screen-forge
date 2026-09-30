import type { ScenarioCapabilities } from "../../core/capabilities";
import {
  patientSchema,
  propSchema,
  stationSchema,
  type Scenario,
  type TrainingStation,
} from "../../core/training";
import { t } from "../../i18n";
import type { DevicePreset } from "./devicePresets";

// Shared contract for the six preparation sections. Sections derive their
// blocks from `caps`; `change` commits a new draft like any other mission edit.
export type PrepareSectionProps = {
  draft: Scenario;
  change: (s: Scenario) => void;
  readOnly: boolean;
  caps: ScenarioCapabilities;
};

export const uid = (prefix: string) =>
  `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

const ORDNANCE_STATES = ["armed", "bypassed", "disarmed", "tampered"];
const BEACON_STATES = ["off", "active", "interference"];

// Creates a device from a human preset, including the matching domain data:
// ordnance/beacon consoles get their prop, medical devices get a patient.
// Guided setup never asks for bindings.
export function buildDevice(
  scenario: Scenario,
  preset: DevicePreset,
): {
  station: TrainingStation;
  props: Scenario["props"];
  patients: Scenario["patients"];
} {
  const same = scenario.stations.filter(
    (st) => st.module === preset.module,
  ).length;
  const station = stationSchema.parse({
    id: uid("device"),
    name: `${t(preset.labelKey)} ${same + 1}`,
    role: "element",
    module: preset.module,
    player: preset.player ?? false,
    team: "",
  });
  if (preset.module === "medical") {
    const bound = new Set(scenario.stations.map((st) => st.bindings.patient));
    let patients = scenario.patients;
    let patient = patients.find((row) => !bound.has(row.id));
    if (!patient) {
      patient = patientSchema.parse({
        id: uid("patient"),
        name: t("prep.people.patientName", { n: patients.length + 1 }),
        kind: "stable",
        since: 0,
      });
      patients = [...patients, patient];
    }
    return {
      station: {
        ...station,
        bindings: { ...station.bindings, patient: patient.id },
      },
      props: scenario.props,
      patients,
    };
  }
  if (preset.module !== "ordnance" && preset.module !== "beacon")
    return { station, props: scenario.props, patients: scenario.patients };
  const kind = preset.module;
  const bound = new Set(scenario.stations.map((st) => st.bindings.prop));
  const existing = scenario.props.find(
    (prop) => prop.kind === kind && !bound.has(prop.id),
  );
  if (existing)
    return {
      station: {
        ...station,
        bindings: { ...station.bindings, prop: existing.id },
      },
      props: scenario.props,
      patients: scenario.patients,
    };
  const prop = propSchema.parse({
    id: uid("prop"),
    kind,
    name: `${t(`module.${kind}`)} ${scenario.props.length + 1}`,
    states: kind === "ordnance" ? ORDNANCE_STATES : BEACON_STATES,
    initial: kind === "ordnance" ? "armed" : "off",
  });
  return {
    station: { ...station, bindings: { ...station.bindings, prop: prop.id } },
    props: [...scenario.props, prop],
    patients: scenario.patients,
  };
}
