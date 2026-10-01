import { describe, expect, it } from "vitest";
import { de } from "../../../i18n/de";
import { en } from "../../../i18n/en";
import { anchorRegistry, anchorSpec } from "./anchors";

describe("anchor registry", () => {
  it("resolves every registered anchor", () => {
    expect(anchorSpec("station.name")).toBeDefined();
    expect(anchorSpec("unknown.anchor")).toBeUndefined();
  });

  it("has a label key in both dictionaries for every anchor", () => {
    for (const spec of Object.values(anchorRegistry)) {
      expect(de[spec.labelKey], `de: ${spec.labelKey}`).toBeTruthy();
      expect(en[spec.labelKey], `en: ${spec.labelKey}`).toBeTruthy();
    }
  });
});
