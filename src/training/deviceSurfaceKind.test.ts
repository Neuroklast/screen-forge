import { describe, expect, it } from "vitest";
import { deviceSurfaceKind } from "./deviceSurfaceKind";

const base = {
  module: "terminal",
  host: "field" as const,
  hasInstance: false,
  hasConnect: false,
  hasPropBinding: false,
};

describe("deviceSurfaceKind", () => {
  it("prefers runtime states over the surface", () => {
    expect(
      deviceSurfaceKind({ ...base, hasInstance: true }),
    ).toBe("workflow");
    expect(
      deviceSurfaceKind({ ...base, hasConnect: true }),
    ).toBe("connect");
  });

  it("derives the surface from the module", () => {
    expect(deviceSurfaceKind({ ...base, module: "tracking" })).toBe("map");
    expect(
      deviceSurfaceKind({ ...base, module: "tracking", host: "preview" }),
    ).toBe("scene");
    expect(deviceSurfaceKind({ ...base, module: "countdown" })).toBe("console");
    expect(deviceSurfaceKind({ ...base, module: "ordnance" })).toBe("ordnance");
  });

  it("honours an explicit surface", () => {
    expect(deviceSurfaceKind({ ...base, surface: "console" })).toBe("console");
    expect(deviceSurfaceKind({ ...base, surface: "datasheet" })).toBe(
      "datasheet",
    );
  });

  it("keeps side-effectful surfaces field-only", () => {
    expect(
      deviceSurfaceKind({ ...base, surface: "map", host: "preview" }),
    ).toBe("scene");
    expect(
      deviceSurfaceKind({ ...base, surface: "camera", host: "preview" }),
    ).toBe("scene");
  });

  it("ignores an unknown surface", () => {
    expect(deviceSurfaceKind({ ...base, surface: "bogus" })).toBe("scene");
  });
});
