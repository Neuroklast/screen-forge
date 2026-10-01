import { describe, expect, it } from "vitest";
import {
  equipmentItemsForPacks,
  equipmentPack,
  equipmentPacks,
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
