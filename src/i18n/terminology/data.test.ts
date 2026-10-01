import { describe, expect, it } from "vitest";
import { resolveTerm } from "../../core/terminology/resolve";
import { termById } from "./registry";

describe("terminology data anchors", () => {
  it("resolves the profile anchors from the acceptance criteria", () => {
    expect(resolveTerm("mission", "en-military")).toBe("MISSION");
    expect(resolveTerm("mission", "de-bundeswehr")).toBe("AUFTRAG");
    expect(
      resolveTerm("common_operational_picture", "en-military", "acronym"),
    ).toBe("COP");
    expect(resolveTerm("common_operational_picture", "de-bundeswehr")).toBe(
      "Lagebild",
    );
    expect(resolveTerm("exercise_control", "de-bundeswehr")).toBe(
      "ÜBUNGSLEITUNG",
    );
  });

  it("marks every de-spezkr entry with a public source", () => {
    const entries = [...termById.values()].filter(
      (term) => term.profiles["de-spezkr"],
    );
    expect(entries.length).toBeGreaterThan(0);
    for (const term of entries)
      expect(term.profiles["de-spezkr"]?.source).toBeTruthy();
  });

  it("keeps German navigation labels stable for the professional profile", () => {
    expect(resolveTerm("nav.overview", "de-professional")).toBe("Übersicht");
    expect(resolveTerm("nav.mission", "de-professional")).toBe("Szenario");
    expect(resolveTerm("nav.forces", "de-professional")).toBe("Teilnehmer");
    expect(resolveTerm("nav.assets", "de-professional")).toBe("Geräte");
    expect(resolveTerm("nav.flow", "de-professional")).toBe("Ablauf");
    expect(resolveTerm("nav.review", "de-professional")).toBe("Prüfen");
  });
});
