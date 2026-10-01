// The visible surface of a device, resolved from its capability (module), the
// runtime state and the host. This is the single place that maps a device to a
// surface; the renderer switches on the result instead of cascading on `module`
// (docs/architecture/devices.md). It is the first step toward a profile+surface
// model where a logical device can offer several plausible surfaces.
export type DeviceSurfaceKind =
  | "workflow"
  | "connect"
  | "map"
  | "camera"
  | "console"
  | "ordnance"
  | "beacon"
  | "datasheet"
  | "scene";

const CONSOLE_MODULES = ["countdown", "access", "lock"];

export function deviceSurfaceKind(input: {
  module: string;
  host: "field" | "preview";
  hasInstance: boolean;
  hasConnect: boolean;
  hasPropBinding: boolean;
}): DeviceSurfaceKind {
  if (input.hasInstance) return "workflow";
  if (input.hasConnect) return "connect";
  const preview = input.host === "preview";
  // Side-effectful leaves stay field-only; the preview renders their scene.
  if (input.module === "tracking" && !preview) return "map";
  if (input.module === "camera" && !preview) return "camera";
  if (CONSOLE_MODULES.includes(input.module)) return "console";
  if (input.module === "ordnance") return "ordnance";
  if (input.module === "beacon") return "beacon";
  if (input.module === "data-sheet" && input.hasPropBinding) return "datasheet";
  return "scene";
}
