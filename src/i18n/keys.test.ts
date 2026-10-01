import { describe, expect, it } from "vitest";
import { de } from "./de";
import { en } from "./en";

// Guards against untranslated control chrome: every literal `t("key")` in the
// source must exist in both dictionaries. Dynamic keys (template literals) are
// covered by the enum-label registries instead.
const sources = import.meta.glob("/src/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function literalKeys(source: string): string[] {
  const keys = new Set<string>();
  const pattern = /\bt\(\s*"([^"\\]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) keys.add(match[1]);
  return [...keys];
}

describe("i18n key usage", () => {
  it("every literal t() key exists in both locales", () => {
    const missing = new Set<string>();
    for (const [path, source] of Object.entries(sources)) {
      if (path.startsWith("/src/i18n/") || path.includes(".test.")) continue;
      for (const key of literalKeys(source))
        if (!(key in en) || !(key in de)) missing.add(key);
    }
    expect([...missing]).toEqual([]);
  });
});
