import { describe, expect, it, vi } from "vitest";
import { phrases, terms } from "../../i18n/terminology/registry";
import { PROFILES } from "./profiles";
import { humanizeId, resolvePhrase, resolveTerm } from "./resolve";

describe("term resolution", () => {
  it("resolves profile-specific short and full labels", () => {
    expect(resolveTerm("mission", "en-military")).toBe("MISSION");
    expect(resolveTerm("mission", "de-bundeswehr")).toBe("AUFTRAG");
    expect(resolveTerm("mission", "de-bundeswehr", "full")).toBe("Auftrag");
    expect(resolveTerm("mission", "de-professional")).toBe("Auftrag");
  });

  it("resolves explicit acronyms", () => {
    expect(resolveTerm("common_operational_picture", "en-military", "acronym")).toBe(
      "COP",
    );
    expect(resolveTerm("common_operational_picture", "de-bundeswehr", "short")).toBe(
      "Lagebild",
    );
    expect(resolveTerm("exercise_control", "de-bundeswehr")).toBe("ÜBUNGSLEITUNG");
  });

  it("resolves acronyms in the default professional profile", () => {
    expect(resolveTerm("headquarters", "en-professional", "acronym")).toBe("HQ");
    expect(
      resolveTerm("common_operational_picture", "en-professional", "acronym"),
    ).toBe("COP");
  });

  it("falls back from de-spezkr to de-bundeswehr when no distinct entry exists", () => {
    expect(resolveTerm("mission", "de-spezkr")).toBe("AUFTRAG");
    expect(resolveTerm("exercise_control", "de-spezkr")).toBe("ÜBUNGSLEITUNG");
  });

  it("does not warn when de-spezkr falls back within German", () => {
    const onMissing = vi.fn();
    resolveTerm("exercise_control", "de-spezkr", "short", onMissing);
    expect(onMissing).not.toHaveBeenCalled();
  });

  it("uses an explicit de-spezkr entry when present", () => {
    expect(resolveTerm("special_operations_forces", "de-spezkr")).toBe("SpezKr");
  });

  it("never returns undefined and humanizes unknown ids", () => {
    expect(resolveTerm("no_such_term", "en-general")).toBe("No such term");
    expect(resolveTerm("no_such_term", "de-bundeswehr")).toBe("No such term");
  });

  it("reports a missing same-language entry", () => {
    const onMissing = vi.fn();
    resolveTerm("no_such_term", "de-bundeswehr", "short", onMissing);
    expect(onMissing).toHaveBeenCalledWith("no_such_term", "de-bundeswehr");
  });

  it("humanizes snake_case, dotted and camelCase ids", () => {
    expect(humanizeId("common_operational_picture")).toBe(
      "Common operational picture",
    );
    expect(humanizeId("comms.lastReport")).toBe("Comms last report");
    expect(humanizeId("")).toBe("");
  });

  // AC: an English default exists for every core term, and a missing specialized
  // entry never returns undefined, an empty string or a raw semantic id.
  it("resolves every term in every profile and form to a real label", () => {
    for (const term of terms) {
      expect(term.profiles["en-general"], `${term.id} lacks English`).toBeTruthy();
      for (const profile of PROFILES)
        for (const form of ["short", "full", "acronym"] as const) {
          const value = resolveTerm(term.id, profile, form);
          const at = `${term.id}/${profile}/${form}`;
          expect(typeof value, at).toBe("string");
          expect(value.length, at).toBeGreaterThan(0);
          expect(value, `${at} returned the raw id`).not.toBe(term.id);
        }
    }
  });

  it("resolves every phrase in every profile to a real template", () => {
    for (const phrase of phrases)
      for (const profile of PROFILES) {
        const value = resolvePhrase(phrase.id, profile);
        const at = `${phrase.id}/${profile}`;
        expect(value.length, at).toBeGreaterThan(0);
        expect(value, `${at} returned the raw id`).not.toBe(phrase.id);
      }
  });
});
