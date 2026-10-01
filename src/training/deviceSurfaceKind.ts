import { isDeviceSurfaceId, type DeviceSurfaceId } from "../core/devices";

// The visible surface of a device. A device has a capability (module) and a
// surface; the surface can be chosen explicitly (`station.surface`), otherwise
// it is derived from the module. This is the single place that resolves it; the
// renderer switches on the result instead of cascading on `module`
// (docs/architecture/devices.md). "workflow" and "connect" are runtime states,
// not authoring choices.
export type DeviceSurfaceKind = DeviceSurfaceId | "workflow" | "connect";

const CONSOLE_MODULES = ["countdown", "access", "lock"];

export function deviceSurfaceKind(input: {
  module: string;
  surface?: string;
  host: "field" | "preview";
  hasInstance: boolean;
  hasConnect: boolean;
  hasPropBinding: boolean;
}): DeviceSurfaceKind {
  if (input.hasInstance) return "workflow";
  if (input.hasConnect) return "connect";
  const preview = input.host === "preview";
  if (isDeviceSurfaceId(input.surface)) {
    // Side-effectful leaves stay field-only; the preview renders their scene.
    if (preview && (input.surface === "map" || input.surface === "camera"))
      return "scene";
    return input.surface;
  }
  if (input.module === "tracking" && !preview) return "map";
  if (input.module === "camera" && !preview) return "camera";
  if (CONSOLE_MODULES.includes(input.module)) return "console";
  if (input.module === "ordnance") return "ordnance";
  if (input.module === "beacon") return "beacon";
  if (input.module === "data-sheet" && input.hasPropBinding) return "datasheet";
  return "scene";
}
