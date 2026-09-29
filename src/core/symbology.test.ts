import { describe, expect, it } from "vitest";
import { renderSymbol, statusModifier, type SymbolDescriptor } from "./symbology";

const medic: SymbolDescriptor = {
  affiliation: "friend",
  status: "critical",
  dimension: "ground",
  type: "MED-02",
  modifiers: ["patient"],
};

describe("symbology", () => {
  it("renders the same entity differently per profile", () => {
    expect(renderSymbol(medic, { profile: "simple", standardVersion: "1" })).toBe(
      "MED-02",
    );
    expect(
      renderSymbol(medic, { profile: "mil2525", standardVersion: "1" }),
    ).toBe("FG-MED-02!");
  });

  it("pins the standard version in the authorized profile", () => {
    const a = renderSymbol(medic, {
      profile: "authorized-app6",
      standardVersion: "2525E",
    });
    const b = renderSymbol(medic, {
      profile: "authorized-app6",
      standardVersion: "2525F",
    });
    expect(a).not.toBe(b);
    expect(a).toContain("2525E");
  });

  it("keeps status readable without color", () => {
    expect(statusModifier("critical")).toBe("!");
    expect(statusModifier("present")).toBe("");
  });
});
