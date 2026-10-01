import { describe, expect, it } from "vitest";
import { phraseById, termById } from "./terminology/registry";

// Guards the terminology boundary: every literal semantic id used through the
// resolver or the React bindings must exist in the registry. Dynamic ids (for
// example `term(sectionTermId(id))`) are covered by the navigation map test.
const sources = import.meta.glob("/src/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

function collect(source: string, pattern: RegExp): string[] {
  const ids = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) ids.add(match[1]);
  return [...ids];
}

const TERM_CALL = /\bterm\(\s*"([^"\\]+)"/g;
const PHRASE_CALL = /\btermPhrase\(\s*"([^"\\]+)"/g;
const TERM_JSX = /<Term\s+id="([^"\\]+)"/g;
const PHRASE_JSX = /<Phrase\s+id="([^"\\]+)"/g;

describe("terminology id usage", () => {
  it("every literal term/phrase id exists in the registry", () => {
    const missing: string[] = [];
    for (const [path, source] of Object.entries(sources)) {
      if (path.startsWith("/src/i18n/terminology/") || path.includes(".test."))
        continue;
      for (const id of collect(source, TERM_CALL))
        if (!termById.has(id)) missing.push(`${path} → term ${id}`);
      for (const id of collect(source, TERM_JSX))
        if (!termById.has(id)) missing.push(`${path} → Term ${id}`);
      for (const id of collect(source, PHRASE_CALL))
        if (!phraseById.has(id)) missing.push(`${path} → termPhrase ${id}`);
      for (const id of collect(source, PHRASE_JSX))
        if (!phraseById.has(id)) missing.push(`${path} → Phrase ${id}`);
    }
    expect(missing).toEqual([]);
  });
});
