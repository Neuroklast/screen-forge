import { describe, expect, it } from "vitest";
import { formatAge, profile, profiles, provenanceAge } from "./profiles";

describe("experience profiles", () => {
  it("exposes the three profiles", () => {
    expect(Object.keys(profiles).sort()).toEqual([
      "advanced",
      "easy",
      "professional",
    ]);
    expect(profile("professional").showProvenance).toBe(true);
    expect(profile("easy").showProvenance).toBe(false);
  });

  it("falls back to easy for an unknown profile", () => {
    expect(profile("nope").id).toBe("easy");
  });

  it("flags stale provenance against server time", () => {
    const value = { source: "GPS", observedAt: 1000, receivedAt: 1100 };
    expect(provenanceAge(value, 2000).stale).toBe(false);
    expect(provenanceAge(value, 1000 + 60000).stale).toBe(true);
    expect(formatAge(18000)).toBe("00:18");
  });
});
