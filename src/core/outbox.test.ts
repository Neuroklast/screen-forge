import { beforeEach, describe, expect, it } from "vitest";
import {
  clearMemory,
  entries,
  pending,
  pruneAcked,
  put,
  update,
  type OutboxEntry,
} from "./outbox";

const entry = (
  eventId: string,
  deviceSeq: number,
  state: OutboxEntry["state"],
): OutboxEntry => ({
  eventId,
  room: "room",
  deviceId: "d1",
  deviceSeq,
  message: { type: "message", eventId },
  state,
  createdAt: 0,
});

describe("outbox", () => {
  beforeEach(() => clearMemory());

  it("orders pending commands by device sequence", () => {
    const list = [
      entry("b", 2, "queued"),
      entry("a", 1, "queued"),
      entry("c", 3, "acked"),
    ];
    expect(pending(list).map((e) => e.eventId)).toEqual(["a", "b"]);
  });

  it("persists state transitions", async () => {
    await put(entry("a", 1, "queued"));
    await update("a", "acked");
    const list = await entries();
    expect(list.find((e) => e.eventId === "a")?.state).toBe("acked");
  });

  it("prunes settled history beyond the keep limit", () => {
    const list = Array.from({ length: 25 }, (_, i) =>
      entry(`e${i}`, i, "acked"),
    );
    expect(pruneAcked(list, 20).length).toBe(5);
  });
});
