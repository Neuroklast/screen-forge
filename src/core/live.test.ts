import { describe, it, expect } from "vitest";
import { processState, type Job } from "../scenes/shared/Process";
import { project3D, trackTelemetry } from "../scenes/shared/spatial";
import { schema, defaults, withScene, applyIdentity } from "./config";
import { scriptedInput } from "./runtime";
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
  });
});
