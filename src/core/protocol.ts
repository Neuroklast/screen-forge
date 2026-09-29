// Shared by the browser and Node 24. No browser-only imports in this module.
export const PROTOCOL = 2;

export type CommandResult = "applied" | "duplicate";

export type Ack = {
  type: "ack";
  command: string;
  eventId?: string;
  serverSeq?: number;
  result?: CommandResult;
};

export type Rejected = {
  type: "rejected";
  eventId: string;
  reason: string;
  serverSeq?: number;
};

// Mutating messages carry a stable idempotency key. Telemetry (`gps`), media
// signalling (`signal`) and read requests (`diagnostic`) are not commands.
export const commandTypes = new Set([
  "configure",
  "fire",
  "reschedule",
  "transport",
  "action",
  "patient",
  "message",
  "abort",
  "note",
  "provision",
  "revoke",
  "module-event",
  "intervention",
  "unlock",
  "prop",
]);

export function isCommandType(type: string): boolean {
  return commandTypes.has(type);
}

// `crypto.randomUUID` is secure-context only; fall back to raw random bytes so
// field devices on a plain-HTTP LAN still get unique ids.
export function newEventId(): string {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === "function") return c.randomUUID();
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
