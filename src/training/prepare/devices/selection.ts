// One explicit selection per workspace context (docs/architecture/editor-state.md).
// Devices and props are both first-class selectable entities in the same
// workspace; an anchor selection narrows to one element inside a device.
export type DeviceSelection =
  | { kind: "device"; id: string }
  | { kind: "element"; id: string; anchor: string }
  | { kind: "prop"; id: string }
  | null;
