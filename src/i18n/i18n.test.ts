import { describe, expect, it } from "vitest";
import { de } from "./de";
import { en } from "./en";

// One language at a time, never mixed: every locale must define the same keys,
// otherwise `t()` silently falls back to German inside an English UI.
describe("i18n dictionaries", () => {
  it("define exactly the same keys in every locale", () => {
    const deKeys = new Set(Object.keys(de));
    const enKeys = new Set(Object.keys(en));
    const missingInEn = [...deKeys].filter((key) => !enKeys.has(key));
    const missingInDe = [...enKeys].filter((key) => !deKeys.has(key));
    expect({ missingInEn, missingInDe }).toEqual({
      missingInEn: [],
      missingInDe: [],
    });
  });
});
