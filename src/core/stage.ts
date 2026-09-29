export const stageFormatIds = [
  "16-9",
  "16-9p",
  "4-3",
  "4-3p",
  "3-2",
  "3-2p",
  "21-9",
  "1-1",
  "9-16",
  "4-5",
  "2.39-1",
  "5-4",
  "32-9",
] as const;
export type StageFormatId = (typeof stageFormatIds)[number];
export const stageFormats: {
  id: StageFormatId;
  name: string;
  width: number;
  height: number;
}[] = [
  { id: "16-9", name: "16:9 Quer", width: 1280, height: 720 },
  { id: "16-9p", name: "16:9 Hoch", width: 720, height: 1280 },
  { id: "4-3", name: "4:3 Quer", width: 1024, height: 768 },
  { id: "4-3p", name: "4:3 Hoch", width: 768, height: 1024 },
  { id: "3-2", name: "3:2 Quer", width: 1440, height: 960 },
  { id: "3-2p", name: "3:2 Hoch", width: 960, height: 1440 },
  { id: "21-9", name: "21:9 Ultrawide", width: 1680, height: 720 },
  { id: "1-1", name: "1:1 Quadrat", width: 1080, height: 1080 },
  { id: "9-16", name: "9:16 Mobil", width: 720, height: 1280 },
  { id: "4-5", name: "4:5 Hoch", width: 864, height: 1080 },
  { id: "2.39-1", name: "2.39:1 Scope", width: 1434, height: 600 },
  { id: "5-4", name: "5:4 Quer", width: 1280, height: 1024 },
  { id: "32-9", name: "32:9 Superwide", width: 1920, height: 540 },
];
export function stageOf(id: string) {
  return stageFormats.find((f) => f.id === id) ?? stageFormats[0];
}
export function stageOrient(id: string) {
  const s = stageOf(id);
  if (s.width === s.height) return "square";
  return s.width > s.height ? "landscape" : "portrait";
}
export function stageRecipe(id: string) {
  if (id === "21-9" || id === "32-9" || id === "2.39-1") return "ultrawide";
  return stageOrient(id);
}
