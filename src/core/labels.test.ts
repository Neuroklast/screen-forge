import { describe, expect, it } from "vitest";
import { labelKeys } from "./labels";
import { de } from "../i18n/de";
import { en } from "../i18n/en";

describe("control label layer", () => {
  it("every labelFor key exists in both locales", () => {
    const missing = labelKeys().filter(
      (key) => !(key in en) || !(key in de),
    );
    expect(missing).toEqual([]);
  });
});
