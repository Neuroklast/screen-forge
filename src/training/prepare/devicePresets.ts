import type { ScenarioCapabilities } from "../../core/capabilities";
import type { Scenario } from "../../core/training";

// Human device presets: guided setup and the devices section never ask for a
// module. The module stays the storage format behind the preset.
// A preset is a device profile: it decides the module (capability), whether the
// device belongs to a participant, and the one-line description the catalog
// shows. The user picks a profile; ScreenForge resolves the rest
// (docs/architecture/devices.md).
export type DevicePreset = {
  id: string;
  labelKey: string;
  descriptionKey: string;
  module: Scenario["stations"][number]["module"];
  player?: boolean;
};

export const devicePresets: DevicePreset[] = [
  { id: "field", labelKey: "device.preset.field", descriptionKey: "device.desc.field", module: "tracking", player: true },
  { id: "radio", labelKey: "device.preset.radio", descriptionKey: "device.desc.radio", module: "comms" },
  { id: "medical", labelKey: "device.preset.medical", descriptionKey: "device.desc.medical", module: "medical" },
  { id: "camera", labelKey: "device.preset.camera", descriptionKey: "device.desc.camera", module: "camera" },
  { id: "terminal", labelKey: "device.preset.terminal", descriptionKey: "device.desc.terminal", module: "terminal" },
  { id: "access", labelKey: "device.preset.access", descriptionKey: "device.desc.access", module: "access" },
  { id: "lock", labelKey: "device.preset.lock", descriptionKey: "device.desc.lock", module: "lock" },
  { id: "countdown", labelKey: "device.preset.countdown", descriptionKey: "device.desc.countdown", module: "countdown" },
  { id: "ordnance", labelKey: "device.preset.ordnance", descriptionKey: "device.desc.ordnance", module: "ordnance" },
  { id: "beacon", labelKey: "device.preset.beacon", descriptionKey: "device.desc.beacon", module: "beacon" },
  { id: "dataSheet", labelKey: "device.preset.dataSheet", descriptionKey: "device.desc.dataSheet", module: "data-sheet" },
  { id: "codeTable", labelKey: "device.preset.codeTable", descriptionKey: "device.desc.codeTable", module: "code-table" },
  { id: "rotary", labelKey: "device.preset.rotary", descriptionKey: "device.desc.rotary", module: "rotary" },
  { id: "clock", labelKey: "device.preset.clock", descriptionKey: "device.desc.clock", module: "clock" },
  { id: "os", labelKey: "device.preset.os", descriptionKey: "device.desc.os", module: "os" },
  { id: "intranet", labelKey: "device.preset.intranet", descriptionKey: "device.desc.intranet", module: "intranet" },
  { id: "hologram", labelKey: "device.preset.hologram", descriptionKey: "device.desc.hologram", module: "hologram" },
  { id: "slide", labelKey: "device.preset.slide", descriptionKey: "device.desc.slide", module: "slide" },
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
