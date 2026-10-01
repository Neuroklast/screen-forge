import { describe, expect, it } from "vitest";
import { stationSchema } from "../../core/training";
import { assetDetail, assetView } from "./assetView";

describe("assetView", () => {
  it("presents a player station as its asset, not as the person", () => {
    const player = stationSchema.parse({
      id: "p1",
      name: "Teilnehmer 1",
      role: "element",
      module: "tracking",
      player: true,
    });
    const view = assetView(player);
    expect(view.name).not.toBe("Teilnehmer 1");
    expect(view.assignedTo).toBe("Teilnehmer 1");
    expect(assetDetail(view)).toContain("Teilnehmer 1");
  });

  it("keeps the device name for a non-player station", () => {
    const device = stationSchema.parse({
      id: "d1",
      name: "Konsole 1",
      role: "element",
      module: "terminal",
    });
    const view = assetView(device);
    expect(view.name).toBe("Konsole 1");
    expect(view.assignedTo).toBeUndefined();
  });

  it("exposes the bound world object", () => {
    const device = stationSchema.parse({
      id: "d2",
      name: "Ordnance",
      role: "element",
      module: "ordnance",
      bindings: { prop: "prop-1" },
    });
    expect(assetView(device).boundProp).toBe("prop-1");
  });
});
