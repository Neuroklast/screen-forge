// Equipment capability packs (docs/konzept/domain/17-equipment.md). Equipment is
// stored capability-based, not as a per-person item list: a pack declares the
// capabilities it provides and the items it suggests. A team template references
// packs; creating the team turns them into suggestions, never rigid objects.
export type EquipmentStatus = "ready" | "limited" | "unavailable";

export type EquipmentItemSpec = {
  nameKey: string;
  categoryKey: string;
  quantity: number;
  required: boolean;
};

export type EquipmentPack = {
  id: string;
  labelKey: string;
  capabilityTags: string[];
  items: EquipmentItemSpec[];
};

export const equipmentPacks: EquipmentPack[] = [
  {
    id: "field-comms",
    labelKey: "equipment.pack.fieldComms",
    capabilityTags: ["communications", "navigation"],
    items: [
      { nameKey: "equipment.item.radio", categoryKey: "equipment.category.comms", quantity: 1, required: true },
      { nameKey: "equipment.item.antenna", categoryKey: "equipment.category.comms", quantity: 1, required: false },
    ],
  },
  {
    id: "navigation-basic",
    labelKey: "equipment.pack.navigation",
    capabilityTags: ["navigation"],
    items: [
      { nameKey: "equipment.item.navUnit", categoryKey: "equipment.category.navigation", quantity: 1, required: true },
      { nameKey: "equipment.item.mapSet", categoryKey: "equipment.category.navigation", quantity: 1, required: false },
    ],
  },
  {
    id: "medical-basic",
    labelKey: "equipment.pack.medicalBasic",
    capabilityTags: ["medical"],
    items: [
      { nameKey: "equipment.item.medicalPack", categoryKey: "equipment.category.medical", quantity: 1, required: true },
    ],
  },
  {
    id: "medical-advanced",
    labelKey: "equipment.pack.medicalAdvanced",
    capabilityTags: ["medical"],
    items: [
      { nameKey: "equipment.item.medicalPack", categoryKey: "equipment.category.medical", quantity: 1, required: true },
      { nameKey: "equipment.item.monitor", categoryKey: "equipment.category.medical", quantity: 1, required: false },
    ],
  },
  {
    id: "sensor-pack",
    labelKey: "equipment.pack.sensor",
    capabilityTags: ["sensor"],
    items: [
      { nameKey: "equipment.item.sensor", categoryKey: "equipment.category.sensor", quantity: 1, required: true },
      { nameKey: "equipment.item.tablet", categoryKey: "equipment.category.sensor", quantity: 1, required: false },
    ],
  },
  {
    id: "observation-pack",
    labelKey: "equipment.pack.observation",
    capabilityTags: ["observation"],
    items: [
      { nameKey: "equipment.item.optics", categoryKey: "equipment.category.observation", quantity: 1, required: true },
      { nameKey: "equipment.item.log", categoryKey: "equipment.category.observation", quantity: 1, required: false },
    ],
  },
  {
    id: "mobility-pack",
    labelKey: "equipment.pack.mobility",
    capabilityTags: ["mobility"],
    items: [
      { nameKey: "equipment.item.vehicle", categoryKey: "equipment.category.mobility", quantity: 1, required: false },
    ],
  },
  {
    id: "protective-equipment",
    labelKey: "equipment.pack.protective",
    capabilityTags: ["protection"],
    items: [
      { nameKey: "equipment.item.protection", categoryKey: "equipment.category.protection", quantity: 1, required: true },
    ],
  },
  {
    id: "technical-pack",
    labelKey: "equipment.pack.technical",
    capabilityTags: ["technical"],
    items: [
      { nameKey: "equipment.item.toolkit", categoryKey: "equipment.category.technical", quantity: 1, required: true },
      { nameKey: "equipment.item.testSet", categoryKey: "equipment.category.technical", quantity: 1, required: false },
    ],
  },
  {
    id: "command-pack",
    labelKey: "equipment.pack.command",
    capabilityTags: ["command", "planning"],
    items: [
      { nameKey: "equipment.item.commandTerminal", categoryKey: "equipment.category.command", quantity: 1, required: true },
    ],
  },
  {
    id: "search-pack",
    labelKey: "equipment.pack.search",
    capabilityTags: ["search"],
    items: [
      { nameKey: "equipment.item.searchKit", categoryKey: "equipment.category.search", quantity: 1, required: true },
    ],
  },
  {
    id: "excon-pack",
    labelKey: "equipment.pack.excon",
    capabilityTags: ["control", "evaluation"],
    items: [
      { nameKey: "equipment.item.controlSet", categoryKey: "equipment.category.control", quantity: 1, required: true },
      { nameKey: "equipment.item.observerSet", categoryKey: "equipment.category.control", quantity: 1, required: false },
    ],
  },
];

export function equipmentPack(id: string): EquipmentPack | undefined {
  return equipmentPacks.find((pack) => pack.id === id);
}

export function equipmentItemsForPacks(packIds: string[]): {
  packId: string;
  spec: EquipmentItemSpec;
}[] {
  const out: { packId: string; spec: EquipmentItemSpec }[] = [];
  for (const packId of packIds) {
    const pack = equipmentPack(packId);
    if (!pack) continue;
    for (const spec of pack.items) out.push({ packId, spec });
  }
  return out;
}
