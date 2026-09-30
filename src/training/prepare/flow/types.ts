export type FlowSelection =
  | { kind: "node"; id: string }
  | { kind: "event"; id: string }
  | null;
