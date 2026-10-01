import { describe, expect, it } from "vitest";
import {
  nextIncomplete,
  prepareReadiness,
  type PrepSection,
  type Readiness,
} from "./readiness";
import { scenarioSchema } from "./training";

const empty = scenarioSchema.parse({
  version: 2,
  name: "Readiness",
  mode: "LIVE",
  seed: 1,
  map: { lat: 0, lng: 0, zoom: 5, tiles: "", attribution: "" },
  stations: [],
});

const all = (status: Readiness): Record<PrepSection, Readiness> => ({
  overview: status,
  scenario: status,
  participants: status,
  devices: status,
  flow: status,
  review: status,
});

describe("preparation readiness", () => {
  it("flags an empty scenario and recommends the first incomplete section", () => {
    const readiness = prepareReadiness(empty);
    expect(readiness.devices).toBe("blocking");
    const next = nextIncomplete(readiness);
    expect(next).not.toBe("overview");
    expect(next).not.toBe("review");
  });

  it("skips complete sections and falls back to review", () => {
    expect(nextIncomplete(all("complete"))).toBe("review");
    expect(nextIncomplete({ ...all("complete"), flow: "warning" })).toBe("flow");
    expect(
      nextIncomplete({ ...all("complete"), participants: "blocking" }),
    ).toBe("participants");
  });
});
