import { describe, expect, it } from "vitest";
import { defaults, presentationConfig } from "./config";
import {
  editPresentation,
  presentationSchema,
  scenarioSchema,
  template,
} from "./training";

describe("station presentation", () => {
  it("returns scene defaults when no preset is bound", () => {
    expect(presentationConfig("terminal")).toEqual(defaults("terminal"));
  });

  it("overlays the preset and deep-merges nested options", () => {
    const base = defaults("terminal");
    const config = presentationConfig("terminal", {
      config: {
        title: "RELAY",
        accent: "#ff0000",
        overlays: { ...base.overlays, glow: 0.9 },
        sceneOptions: {
          terminal: { ...base.sceneOptions.terminal, script: "relay" },
        },
      },
    });
    expect(config.title).toBe("RELAY");
    expect(config.accent).toBe("#ff0000");
    expect(config.overlays.glow).toBe(0.9);
    expect(config.overlays.scanlines).toBe(base.overlays.scanlines);
    expect(config.sceneOptions.terminal.script).toBe("relay");
    expect(config.sceneOptions.os).toEqual(base.sceneOptions.os);
  });

  it("validates the scene override and rejects unknown ids", () => {
    expect(presentationSchema.safeParse({ scene: "os", revision: 1 }).success).toBe(
      true,
    );
    expect(presentationSchema.safeParse({ scene: "nope" }).success).toBe(false);
  });

  it("round-trips a station presentation through the scenario schema", () => {
    const s = template("sar");
    const parsed = scenarioSchema.parse({
      ...s,
      stations: s.stations.map((station, i) =>
        i === 0
          ? {
              ...station,
              presentation: {
                scene: "intranet",
                config: { title: "RECORDS" },
                revision: 2,
              },
            }
          : station,
      ),
    });
    expect(parsed.stations[0].presentation?.scene).toBe("intranet");
    expect(parsed.stations[0].presentation?.revision).toBe(2);
  });

  it("bumps revision, merges config and clears overrides", () => {
    const first = editPresentation(undefined, {
      scene: "os",
      config: { title: "A" },
    });
    expect(first.revision).toBe(1);
    expect(first.scene).toBe("os");
    const second = editPresentation(first, { config: { accent: "#00ff00" } });
    expect(second.revision).toBe(2);
    expect(second.config?.title).toBe("A");
    expect(second.config?.accent).toBe("#00ff00");
    const cleared = editPresentation(second, { scene: null, config: null });
    expect(cleared.scene).toBeUndefined();
    expect(cleared.config).toBeUndefined();
    expect(cleared.revision).toBe(3);
  });
});
