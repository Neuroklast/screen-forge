import { exampleMedia } from "./exampleMedia";
export type Dossier = {
  id: string;
  name: string;
  role: string;
  blood: string;
  allergies: string;
  clearance: string;
  status: string;
  facility: string;
  notes: string;
  events: string[];
  photo: string;
};
const KEY = "screenforge.dossiers.v1";
const portraits = exampleMedia.filter((a) => a.folder.includes("portraits"));
export function defaultDossiers(): Dossier[] {
  return [
    {
      id: "MV-0041",
      name: "Mara Vale",
      role: "RESEARCH DIRECTOR",
      blood: "O+",
      allergies: "None recorded",
      clearance: "04",
      status: "ACTIVE",
      facility: "SECTOR 07 / LAB 3",
      notes: "Leads reconstruction. Archive access authorized.",
      events: ["Identity chain renewed", "Archive access recorded"],
      photo: portraits[0]?.src ?? "",
    },
    {
      id: "EW-0093",
      name: "Elias Ward",
      role: "FIELD SYSTEMS ANALYST",
      blood: "A-",
      allergies: "Penicillin",
      clearance: "03",
      status: "REMOTE",
      facility: "RELAY 12 / FIELD",
      notes: "Maintains relay maps. Temporary field access.",
      events: ["Relay 12 inspection", "Remote session registered"],
      photo: portraits[2]?.src ?? "",
    },
    {
      id: "NM-0108",
      name: "N. Mercer",
      role: "ARCHIVE ADMINISTRATOR",
      blood: "B+",
      allergies: "None recorded",
      clearance: "05",
      status: "REVIEW",
      facility: "ARCHIVE 04 / VAULT",
      notes: "Timestamp discrepancy under review.",
      events: ["Timestamp discrepancy found", "Archive session isolated"],
      photo: portraits[4]?.src ?? "",
    },
  ];
}
export function loadDossiers(): Dossier[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (Array.isArray(raw) && raw[0]?.id) return raw as Dossier[];
  } catch {
    /* empty */
  }
  return defaultDossiers();
}
export function saveDossiers(rows: Dossier[]) {
  localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 40)));
}
