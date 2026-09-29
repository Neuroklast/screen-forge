import { describe, it, expect } from "vitest";
import { processState, type Job } from "../scenes/shared/Process";
import { project3D, trackTelemetry } from "../scenes/shared/spatial";
import {
  schema,
  defaults,
  withScene,
  applyIdentity,
  applyTheme,
  keepLook,
} from "./config";
import { mediaFolderFor } from "./exampleMedia";
import { boxesOverlap } from "./layout";
import { stageOf, stageOrient, stageFormatIds } from "./stage";
import { scriptedInput } from "./runtime";
import { contrastRatio } from "./contrast";
describe("live process and spatial contracts", () => {
  it("process phases, completion and rewind are driven by scene time", () => {
    const job: Job = {
      name: "TEST",
      phases: ["acquire", "verify", "commit"],
      duration: 9,
      startedAt: 5,
      result: "saved",
    };
    expect(processState(job, 0).progress).toBe(0);
    expect(processState(job, 8).phase).toBe("verify");
    expect(processState(job, 14).done).toBe(true);
    expect(processState(job, 6).phase).toBe("acquire");
  });
  it("perspective changes depth and scale rather than applying a flat rotation", () => {
    const a = project3D([95, 60, 80], 0),
      b = project3D([95, 60, 80], 3, [20, 10, 50]);
    expect(a.z).not.toBe(b.z);
    expect(a.scale).not.toBe(b.scale);
    expect(a.x).not.toBe(b.x);
    for (let t = 0; t < 300; t += 0.37) {
      const p = project3D([95, 60, 80], t, [32, 19, 65]);
      expect(Number.isFinite(p.scale)).toBe(true);
      expect(p.scale).toBeGreaterThan(0);
    }
  });
  it("tracking telemetry follows the same trajectory with finite physical derivatives", () => {
    for (let i = 0; i < 3; i++)
      for (let t = 0; t < 100; t += 0.2) {
        const p = trackTelemetry(t, i);
        expect(p.x).toBeGreaterThan(0);
        expect(p.x).toBeLessThan(800);
        expect(p.y).toBeGreaterThan(0);
        expect(p.y).toBeLessThan(500);
        expect(p.speed).toBeGreaterThanOrEqual(0);
        expect(p.heading).toBeGreaterThanOrEqual(0);
        expect(p.heading).toBeLessThan(360);
      }
  });
  it("profile schema accepts raster logos and rejects executable logo payloads", () => {
    const c = defaults();
    expect(
      schema.safeParse({
        ...c,
        brand: { logo: "data:image/svg+xml;base64,AAAA" },
      }).success,
    ).toBe(false);
    expect(
      schema.safeParse({
        ...c,
        brand: { mark: "atom", logo: "data:image/png;base64,AAAA" },
      }).success,
    ).toBe(true);
    expect(scriptedInput("inspect relay", "", "i")).toBe("i");
    expect(scriptedInput("inspect relay", "i", "x")).toBe("in");
    expect(scriptedInput("inspect relay", "in", "Backspace")).toBe("i");
    const branded = applyIdentity(defaults("countdown"), {
      title: "UMBRELLA",
      brand: { mark: "umbrella", logo: "" },
    });
    expect(withScene(branded, "terminal").title).toBe("UMBRELLA");
    expect(withScene(branded, "tracking").brand?.mark).toBe("umbrella");
    expect(withScene(branded, "hologram").scene).toBe("hologram");
    const themed = applyTheme(branded, {
      theme: "Carbon red",
      palette: {
        background: "#000000",
        surface: "#0a0a0a",
        text: "#f5f5f5",
        secondary: "#c8c8c8",
      },
      accent: "#e10600",
      mood: "clinical",
      effects: 0.35,
      overlays: defaults().overlays,
      font: "space",
      tokens: {},
    });
    const named = applyIdentity(themed, { company: "Umbrella Corporation" });
    expect(withScene(named, "lock").company).toBe("Umbrella Corporation");
    expect(withScene(named, "lock").theme).toBe("Carbon red");
    expect(keepLook(named, defaults("camera")).title).toBe("UMBRELLA");
    expect(keepLook(named, defaults("camera")).theme).toBe("Carbon red");
    expect(keepLook(named, defaults("camera")).scene).toBe("camera");
    expect(mediaFolderFor("Male_employee_portrait_photograph.jpg")).toBe(
      "/portraits/employees",
    );
    expect(mediaFolderFor("Dead_scientist_in_laboratory.jpg")).toBe(
      "/surveillance/incidents",
    );
    expect(mediaFolderFor("Antimatter_bomb_schematics.jpg")).toBe(
      "/devices/antimatter",
    );
    expect(stageOf("4-3").width / stageOf("4-3").height).toBeCloseTo(4 / 3, 5);
    expect(stageOrient("16-9p")).toBe("portrait");
    expect(stageOrient("1-1")).toBe("square");
    expect(keepLook({ ...named, format: "9-16" }, defaults("lock")).format).toBe(
      "9-16",
    );
    expect(defaults().sceneOptions.terminal.commandsUntilSuccess).toBe(4);
    expect(defaults().workspace).toBe("film");
    expect(
      keepLook({ ...named, workspace: "training" }, defaults("lock")).workspace,
    ).toBe("training");
    expect(defaults().frame.style).toBe("hud");
    expect(
      keepLook(
        {
          ...named,
          sceneOptions: {
            ...named.sceneOptions,
            terminal: {
              ...named.sceneOptions.terminal,
              commandsUntilSuccess: 6,
            },
          },
        },
        defaults("terminal"),
      ).sceneOptions.terminal.commandsUntilSuccess,
    ).toBe(6);
    expect(stageFormatIds.length).toBeGreaterThanOrEqual(10);
    expect(
      boxesOverlap(
        { x: 0, y: 0, width: 100, height: 100 },
        { x: 50, y: 50, width: 100, height: 100 },
      ),
    ).toBe(true);
    expect(
      boxesOverlap(
        { x: 0, y: 0, width: 40, height: 40 },
        { x: 50, y: 0, width: 40, height: 40 },
      ),
    ).toBe(false);
    expect(
      schema.safeParse({
        ...c,
        palette: {
          background: "url(https://bad)",
          surface: "#ffffff",
          text: "#111111",
          secondary: "#333333",
        },
      }).success,
    ).toBe(false);
    expect(keepLook({ ...named, density: "focused" }, defaults("lock")).density).toBe(
      "focused",
    );
    for (const [bg, text] of [
      ["#000000", "#f5f5f5"],
      ["#000000", "#f2f2f2"],
      ["#000000", "#b4ffb4"],
      ["#080d12", "#d6e2e5"],
      ["#f4f3f0", "#151515"],
      ["#100d05", "#f7df9c"],
      ["#07141c", "#d9f5ff"],
      ["#130609", "#f5cdd6"],
      ["#050f09", "#c1f2cf"],
      ["#0d0919", "#e9ddff"],
    ] as const)
      expect(contrastRatio(bg, text)).toBeGreaterThanOrEqual(4.5);
  });
});
