// One explicit selection per workspace context (docs/architecture/editor-state.md).
export type DeviceSelection =
  | { kind: "device"; id: string }
  | { kind: "element"; id: string; anchor: string }
  | null;
