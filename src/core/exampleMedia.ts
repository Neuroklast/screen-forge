export type ExampleAsset = {
  id: string;
  name: string;
  folder: string;
  src: string;
};
export function mediaFolderFor(name: string) {
  const n = name.toLowerCase();
  if (/employee|biometric/.test(n)) return "/portraits/employees";
  if (/scientist/.test(n) && /portrait/.test(n)) return "/portraits/scientists";
  if (/schematic|antimatter|bomb/.test(n)) return "/devices/antimatter";
  if (/documentation|confidential/.test(n)) return "/documents";
  if (/killed|dead|covering|accident/.test(n)) return "/surveillance/incidents";
  if (/facility|laboratory|night/.test(n)) return "/surveillance/facility";
  return "/unsorted";
}
const files = [
  "Female_employee_portrait_photograph_2K_20260929112255.jpg",
  "Female_employee_portrait_photograph_2K_20260929112259.jpg",
  "Male_employee_biometric_portrait_2K_20260929113409.jpg",
  "Male_employee_portrait_photograph_2K_20260929113413.jpg",
  "Female_scientist_portrait_2K_20260929112407.jpg",
  "Female_scientist_portrait_2K_20260929112557.jpg",
  "Female_scientist_portrait_photo_2K_20260929112532.jpg",
  "Female_scientist_portrait_photo_2K_20260929112646.jpg",
  "Antimatter_bomb_digital_schematics_2K_20260929113835.jpg",
  "Antimatter_bomb_schematics_2K_20260929113827.jpg",
  "hgihly_authentic_antimatter_bomb._2K_20260929113611.jpg",
  "hgihly_authentic_antimatter_bomb._2K_20260929113615.jpg",
  "hgihly_authentic_antimatter_bomb._2K_20260929113617.jpg",
  "hgihly_authentic_antimatter_bomb._2K_20260929113620.jpg",
  "hgihly_authentic_antimatter_bomb._2K_20260929113826.jpg",
  "Secret_confidential_documentation_2K_20260929114004.jpg",
  "Covering_up_lab_virus_accident_2K_20260929114432.jpg",
  "Dead_scientist_in_laboratory_2K_20260929114425.jpg",
  "Dead_scientist_in_laboratory_2K_20260929122452.jpg",
  "Dead_scientist_in_laboratory_2K_20260929122455.jpg",
  "scientists killed in lab survbeillance.mp4",
  "High_security_facility_at_night_2K_20260929113601.jpg",
  "High_security_facility_night_vision_2K_20260929113554.jpg",
  "High_security_facility_night_vision_2K_20260929113556.jpg",
  "High_security_facility_night_vision_2K_20260929113601.jpg",
  "Secret_laboratory_night_vision_p._2K_20260929113605.jpg",
];
export const exampleMedia: ExampleAsset[] = files.map((name) => {
  const folder = mediaFolderFor(name);
  return {
    id: `ex-${name.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 70)}`,
    name,
    folder,
    src: `/media${folder}/${encodeURIComponent(name)}`,
  };
});
export const exampleCameraFeeds = [
  ...exampleMedia.filter((a) => a.folder === "/surveillance/facility").slice(0, 3),
  ...exampleMedia
    .filter(
      (a) => a.folder === "/surveillance/incidents" && !/\.mp4$/i.test(a.name),
    )
    .slice(0, 1),
];
