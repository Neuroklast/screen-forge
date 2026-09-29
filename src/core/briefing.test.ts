import { describe, it, expect } from "vitest";
import { briefingFilename, missionBriefing } from "./briefing";
import { template } from "./training";

describe("mission briefing", () => {
  const text = missionBriefing(template("sar"), { date: "2026-09-30 08:00Z" });

  it("uses the operational-order structure", () => {
    for (const section of [
      "UNCLASSIFIED // EXERCISE",
      "1. SITUATION",
      "2. MISSION",
      "3. EXECUTION",
      "4. SUPPORT",
      "5. COMMAND & SIGNAL",
      "ANNEX A",
      "ANNEX B",
      "END OF BRIEFING // EXERCISE",
    ])
      expect(text).toContain(section);
  });

  it("lists objectives, stations and the timeline", () => {
    expect(text).toContain("Locate and report casualty");
    expect(text).toContain("Headquarters");
    expect(text).toContain("T+03:00");
    expect(text).toContain("Patient 01 (stable)");
  });

  it("is deterministic for the same mission", () => {
    expect(missionBriefing(template("sar"))).toBe(
      missionBriefing(template("sar")),
    );
  });

  it("derives a filename", () => {
    expect(briefingFilename(template("sar"))).toBe(
      "briefing-search-rescue.txt",
    );
  });
});
