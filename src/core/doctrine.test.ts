import { describe, expect, it } from "vitest";
import { assessMarch, doctrine, marchProgress } from "./doctrine";

describe("doctrine packs", () => {
  it("returns the latest pack by default and a pinned version on request", () => {
    expect(doctrine("medical").version).toBe(1);
    expect(doctrine("medical", 1).doctrineId).toBe("medical");
    expect(() => doctrine("medical", 99)).toThrow(/Unknown/);
    expect(() => doctrine("nope")).toThrow(/Unknown/);
  });

  it("records a MARCH assessment log", () => {
    let assessment = {};
    assessment = assessMarch(assessment, "M", "assessed");
    assessment = assessMarch(assessment, "A", "pending");
    expect(marchProgress(assessment)).toEqual({ assessed: 1, total: 5 });
  });
});
