import { describe, expect, it } from "vitest";
import { isCommandType, newEventId, PROTOCOL } from "./protocol";

describe("protocol v2", () => {
  it("declares the current version", () => {
    expect(PROTOCOL).toBe(2);
  });

  it("classifies mutating commands", () => {
    expect(isCommandType("transport")).toBe(true);
    expect(isCommandType("message")).toBe(true);
    expect(isCommandType("unlock")).toBe(true);
    expect(isCommandType("gps")).toBe(false);
    expect(isCommandType("signal")).toBe(false);
    expect(isCommandType("diagnostic")).toBe(false);
  });

  it("generates unique event ids", () => {
    const ids = new Set(Array.from({ length: 50 }, () => newEventId()));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id.length).toBeGreaterThanOrEqual(16);
  });
});
