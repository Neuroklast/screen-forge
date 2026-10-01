import type { ScenarioCapabilities } from "../../core/capabilities";
import type { Scenario } from "../../core/training";

// Human device presets: guided setup and the devices section never ask for a
// module. The module stays the storage format behind the preset.
export type DevicePreset = {
  id: string;
  labelKey: string;
  module: Scenario["stations"][number]["module"];
  player?: boolean;
};

export const devicePresets: DevicePreset[] = [
  { id: "field", labelKey: "device.preset.field", module: "tracking", player: true },
  { id: "radio", labelKey: "device.preset.radio", module: "comms" },
  { id: "medical", labelKey: "device.preset.medical", module: "medical" },
  { id: "camera", labelKey: "device.preset.camera", module: "camera" },
  { id: "terminal", labelKey: "device.preset.terminal", module: "terminal" },
  { id: "access", labelKey: "device.preset.access", module: "access" },
  { id: "lock", labelKey: "device.preset.lock", module: "lock" },
  { id: "countdown", labelKey: "device.preset.countdown", module: "countdown" },
  { id: "ordnance", labelKey: "device.preset.ordnance", module: "ordnance" },
  { id: "beacon", labelKey: "device.preset.beacon", module: "beacon" },
  { id: "dataSheet", labelKey: "device.preset.dataSheet", module: "data-sheet" },
  { id: "codeTable", labelKey: "device.preset.codeTable", module: "code-table" },
  { id: "rotary", labelKey: "device.preset.rotary", module: "rotary" },
  { id: "clock", labelKey: "device.preset.clock", module: "clock" },
  { id: "os", labelKey: "device.preset.os", module: "os" },
  { id: "intranet", labelKey: "device.preset.intranet", module: "intranet" },
  { id: "hologram", labelKey: "device.preset.hologram", module: "hologram" },
  { id: "slide", labelKey: "device.preset.slide", module: "slide" },
];

export function presetForModule(module: string): DevicePreset | undefined {
  return devicePresets.find((preset) => preset.module === module);
}

export function presetLabel(module: string): string {
  return presetForModule(module)?.labelKey ?? "device.preset.custom";
}

// Presets whose domain counterpart is hidden by the scenario capabilities are
// not offered: a medical setup without patients has no medical device, and a
// setup without props has no ordnance or beacon console.
const CAPABILITY_OF: Partial<
  Record<DevicePreset["module"], keyof ScenarioCapabilities>
> = {
  ordnance: "props",
  beacon: "props",
  medical: "patients",
};

export function devicePresetsFor(
  caps: ScenarioCapabilities,
): DevicePreset[] {
  return devicePresets.filter((preset) => {
    const capability = CAPABILITY_OF[preset.module];
    return !capability || caps[capability];
  });
}

// Scenario-relevant presets first, the rest behind "More…". This is a ranking,
// not a filter: nothing is removed.
const RECOMMENDED: Record<string, string[]> = {
  disposal: ["ordnance", "beacon", "camera", "terminal"],
  medical: ["medical", "field", "radio", "terminal"],
  sar: ["field", "radio", "camera", "terminal"],
  technical: ["terminal", "access", "lock", "dataSheet", "codeTable"],
  film: ["hologram", "terminal", "countdown", "intranet", "camera"],
  field: ["field", "radio", "camera", "terminal"],
  custom: ["field", "terminal", "camera", "medical"],
};

export function splitPresets(
  presets: DevicePreset[],
  type: string,
): { recommended: DevicePreset[]; more: DevicePreset[] } {
  const ranked = (RECOMMENDED[type] ?? [])
    .map((id) => presets.find((preset) => preset.id === id))
    .filter((preset): preset is DevicePreset => !!preset);
  const recommended = ranked.length ? ranked : presets.slice(0, 4);
  return {
    recommended,
    more: presets.filter((preset) => !recommended.includes(preset)),
  };
}
