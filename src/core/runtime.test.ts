import { describe, it, expect } from "vitest";
import { countdown, formatTime, noise } from "./runtime";
import { defaults, schema, sceneIds } from "./config";
describe("scene time", () => {
  it("clamps a completed countdown and handles hours", () => {
    expect(countdown(60, 61)).toBe(0);
    expect(countdown(180, 30)).toBe(150);
    expect(formatTime(3599.1)).toBe("01:00:00");
    expect(formatTime(-1)).toBe("00:00:00");
  });
  it("reproduces synthetic readings by time index and seed", () => {
    expect(noise(5, 2048)).toBe(noise(5, 2048));
    expect(noise(5, 2048)).not.toBe(noise(5, 2049));
    for (let i = 0; i < 100; i++) {
      expect(noise(i, 1)).toBeGreaterThanOrEqual(0);
      expect(noise(i, 1)).toBeLessThan(1);
    }
  });
});
describe("preset import boundary", () => {
  it("round-trips every bundled scene", () => {
    for (const id of sceneIds) {
      expect(schema.parse(JSON.parse(JSON.stringify(defaults(id))))).toEqual(
        defaults(id),
      );
    }
  });
  it("rejects malformed presets before they reach rendering", () => {
    for (const change of [
      { scene: "missing" },
      { duration: -4 },
      { duration: Infinity },
      { accent: "url(evil)" },
      { effects: 8 },
      { version: 2 },
      { title: "" },
    ]) {
      expect(schema.safeParse({ ...defaults(), ...change }).success).toBe(
        false,
      );
    }
  });
});
