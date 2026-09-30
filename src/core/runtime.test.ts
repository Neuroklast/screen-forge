import { describe, it, expect } from "vitest";
import { authoritativeCue, clockParts, countdown, formatTime, noise } from "./runtime";
import { contrastRatio, onAccent } from "./contrast";
import { defaults, schema, sceneIds } from "./config";
import { newState } from "./training";
describe("scene time", () => {
  it("clamps a completed countdown and handles hours", () => {
    expect(countdown(60, 61)).toBe(0);
    expect(countdown(180, 30)).toBe(150);
    expect(formatTime(3599.1)).toBe("01:00:00");
    expect(formatTime(-1)).toBe("00:00:00");
    expect(clockParts(24)).toEqual({ hh: "00", mm: "00", ss: "24" });
    expect(contrastRatio("#f5f5f5", "#000000")).toBeGreaterThan(4.5);
    expect(onAccent("#e10600")).toBe("#f5f5f5");
    expect(onAccent("#ffffff")).toBe("#111111");
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
describe("authoritative cue", () => {
  it("rebuilds block completion from recorded server signals", () => {
    const idle = newState("room");
    expect(authoritativeCue(idle, "term")).toBe("idle");
    const events = newState("room");
    events.moduleEvents["term"] = ["shell.success"];
    expect(authoritativeCue(events, "term")).toBe("complete");
    expect(authoritativeCue(events, "other")).toBe("idle");
    const grant = newState("room");
    grant.props["lock-1"] = true;
    expect(authoritativeCue(grant, "lock-1")).toBe("complete");
    const medical = newState("room");
    medical.interventions["med-1"] = ["treated"];
    expect(authoritativeCue(medical, "med-1")).toBe("complete");
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
      { version: 3 },
      { title: "" },
    ]) {
      expect(schema.safeParse({ ...defaults(), ...change }).success).toBe(
        false,
      );
    }
  });
});
