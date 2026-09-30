import { describe, expect, it } from "vitest";
import {
  ignitionFailures,
  ordnanceType,
  ordnanceTypeSchema,
  ordnanceTypes,
  resolveOrdnanceType,
} from "./ordnance";

describe("ordnance catalogue", () => {
  it("exposes fictional entries with methods and failures", () => {
    const types = ordnanceTypes();
    expect(types.length).toBeGreaterThanOrEqual(3);
    for (const entry of types) {
      expect(entry.methods.length).toBeGreaterThan(0);
      expect(entry.stages.length).toBeGreaterThan(0);
    }
  });

  it("finds a type by id", () => {
    expect(ordnanceType("cb-09")?.designation).toContain("CB-09");
    expect(ordnanceType("nope")).toBeUndefined();
  });

  it("reports ignition failures", () => {
    const entry = ordnanceType("cb-09")!;
    expect(ignitionFailures(entry).length).toBeGreaterThan(0);
    for (const failure of ignitionFailures(entry))
      expect(failure.outcome).toBe("ignition");
  });

  it("lets a mission custom type override the catalogue", () => {
    const custom = ordnanceTypeSchema.parse({
      id: "cb-09",
      category: "custom",
      designation: "Custom CB-09",
      stages: ["Isolate"],
      methods: [{ id: "m1", name: "Method", steps: ["Step"] }],
    });
    expect(resolveOrdnanceType("cb-09", [custom])?.designation).toBe(
      "Custom CB-09",
    );
    expect(resolveOrdnanceType("cb-09")?.designation).toContain("CB-09");
  });

  it("rejects an entry without methods", () => {
    expect(
      ordnanceTypeSchema.safeParse({
        id: "x",
        category: "c",
        designation: "X",
        stages: ["s"],
        methods: [],
      }).success,
    ).toBe(false);
  });
});
