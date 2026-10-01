import { describe, expect, it } from "vitest";
import {
  equipmentItemsForPacks,
  equipmentPack,
  equipmentPacks,
  equipmentReadiness,
} from "./equipment";
import { teamTemplates } from "./teamTemplates";

describe("equipment packs", () => {
  it("have unique ids, capabilities and items", () => {
    const ids = new Set(equipmentPacks.map((pack) => pack.id));
    expect(ids.size).toBe(equipmentPacks.length);
    for (const pack of equipmentPacks) {
      expect(pack.items.length, pack.id).toBeGreaterThan(0);
      expect(pack.capabilityTags.length, pack.id).toBeGreaterThan(0);
    }
  });

  it("resolves items for known packs and ignores unknown ones", () => {
    expect(equipmentItemsForPacks(["field-comms"]).length).toBeGreaterThan(0);
    expect(equipmentItemsForPacks(["does-not-exist"])).toEqual([]);
    expect(equipmentPack("field-comms")?.capabilityTags).toContain(
      "communications",
    );
  });

  it("is referenced by every team template that declares packs", () => {
    const missing: string[] = [];
    for (const template of teamTemplates)
      for (const packId of template.equipmentPacks ?? [])
        if (!equipmentPack(packId)) missing.push(`${template.id}.${packId}`);
    expect(missing).toEqual([]);
  });
});

describe("equipmentReadiness", () => {
  it("counts only required non-ready items as missing", () => {
    const summary = equipmentReadiness([
      { required: true, status: "ready" },
      { required: true, status: "limited" },
      { required: true, status: "unavailable" },
      { required: false, status: "unavailable" },
    ]);
    expect(summary).toEqual({
      total: 4,
      required: 3,
      ready: 1,
      limited: 1,
      unavailable: 2,
      missing: 2,
    });
  });

  it("is empty-safe", () => {
    expect(equipmentReadiness([])).toEqual({
      total: 0,
      required: 0,
      ready: 0,
      limited: 0,
      unavailable: 0,
      missing: 0,
    });
  });
});
