import { describe, expect, it } from "vitest";

// Guards the migration: migrated control surfaces must not hardcode tactical
// labels and must resolve them through the terminology layer instead.
const sources = import.meta.glob("/src/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const MIGRATED = [
  "/src/views/TrainerView.tsx",
  "/src/training/prepare/OverviewSection.tsx",
  "/src/training/prepare/ScenarioSection.tsx",
  "/src/training/prepare/ParticipantsSection.tsx",
  "/src/training/prepare/DevicesSection.tsx",
  "/src/training/prepare/FlowSection.tsx",
  "/src/training/prepare/ReviewSection.tsx",
];

// Labels that must only ever come from the terminology registry.
const BANNED = [
  "EXCON",
  "MISSION",
  "AUFTRAG",
  "ÜBUNGSLEITUNG",
  "Übungsleitung",
  "Lagebild",
  "KRÄFTE",
  "MITTEL",
  "ÜBERSICHT",
  "PRÜFUNG",
];

// Unicode-aware label boundary. `\b` is ASCII-only, so `\bÜBUNGSLEITUNG\b`
// never matches an umlaut-initial German label; property escapes fix that while
// still refusing matches embedded in longer words (`MISSIONARY`).
function containsLabel(line: string, label: string): boolean {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(
    `(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`,
    "u",
  ).test(line);
}

describe("migrated terminology surfaces", () => {
  it("detects every banned label including umlaut-initial German terms", () => {
    for (const label of BANNED)
      expect(containsLabel(`<h2>${label}</h2>`, label), label).toBe(true);
    // A banned label embedded in a longer word is not a hardcoded label.
    expect(containsLabel("<h2>MISSIONARY</h2>", "MISSION")).toBe(false);
  });

  it("contain no hardcoded tactical labels", () => {
    const offenders: string[] = [];
    for (const path of MIGRATED) {
      const source = sources[path];
      if (!source) {
        offenders.push(`${path} → file missing`);
        continue;
      }
      source.split("\n").forEach((line, index) => {
        for (const label of BANNED)
          if (containsLabel(line, label))
            offenders.push(`${path}:${index + 1} → ${label}`);
      });
    }
    expect(offenders).toEqual([]);
  });

  it("resolve labels through the terminology layer", () => {
    for (const path of MIGRATED) {
      const source = sources[path] ?? "";
      const wired =
        source.includes("ui/terminology") ||
        source.includes("core/terminology");
      expect(wired, `${path} is not wired to terminology`).toBe(true);
    }
  });
});

// Fictional in-world stage content (terminal, intranet, OS surfaces) is art
// direction and scenario-authored text; it must never be auto-translated.
const scenes = import.meta.glob("/src/scenes/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

describe("fictional in-world scenes", () => {
  it("are not translated through the terminology layer", () => {
    // Guard against a vacuous pass if the glob stops matching.
    expect(Object.keys(scenes).length).toBeGreaterThan(0);
    const offenders: string[] = [];
    for (const [path, source] of Object.entries(scenes)) {
      if (
        /(?:core|ui)\/terminology|termPhrase\s*\(|<Term[\s>]|\bterm\s*\(/.test(
          source,
        )
      )
        offenders.push(path);
    }
    expect(offenders).toEqual([]);
  });
});
