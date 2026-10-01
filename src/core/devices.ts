// Device surface registry (docs/architecture/devices.md). A device has a
// capability (module) and a visible surface; the surface can be chosen
// explicitly, otherwise it is derived from the module. Shared by the browser and
// Node 24; no browser-only imports.
export const deviceSurfaceIds = [
  "scene",
  "console",
  "map",
  "camera",
  "ordnance",
  "beacon",
  "datasheet",
] as const;

export type DeviceSurfaceId = (typeof deviceSurfaceIds)[number];

export function isDeviceSurfaceId(value: unknown): value is DeviceSurfaceId {
  return (
    typeof value === "string" &&
    (deviceSurfaceIds as readonly string[]).includes(value)
  );
}
