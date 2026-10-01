import { describe, expect, it } from "vitest";

// Guards the localization boundary: control surfaces must never render a raw
// enum value or domain id as visible text. In-world fictional stage art
// (src/scenes, CodePad, …) is intentional English and out of scope.
const sources = import.meta.glob("/src/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const RAW = [
  "overview",
  "files",
  "personnel",
  "clusters",
  "dimension",
  "messages",
  "idle",
  "active",
  "warning",
  "complete",
  "LIVE",
  "PLAYBACK",
  "tracking",
  "hologram",
  "lock",
  "access",
  "rotary",
  "code-table",
  "data-sheet",
  "intranet",
  "comms",
  "slide",
  "ready",
  "running",
  "aborted",
];

const CONTROL = /^\/src\/(views|training)\//;

describe("control surface labels", () => {
  it("never renders a raw enum or domain id as text", () => {
    const offenders: string[] = [];
    for (const [path, source] of Object.entries(sources)) {
      if (!CONTROL.test(path) || path.includes(".test.")) continue;
      source.split("\n").forEach((line, index) => {
        for (const token of RAW)
          if (
            new RegExp(`>\\s*${token}\\s*<`).test(line) ||
            line.includes(`{"${token}"}`)
          )
            offenders.push(`${path}:${index + 1} → ${token}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});
