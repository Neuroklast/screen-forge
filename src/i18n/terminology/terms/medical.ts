import { buildTerm } from "../../../core/terminology/build";
import type { TacticalTerm } from "../../../core/terminology/types";

// Search, rescue and medical. Descriptive terms only; no medical procedure content.
export const medicalTerms: TacticalTerm[] = [
  buildTerm({
    id: "search",
    category: "medical",
    en: { general: "Search", professional: "Search" },
    de: { general: "Suche", professional: "Suche", military: "SUCHE" },
  }),
  buildTerm({
    id: "locate",
    category: "medical",
    en: { general: "Locate", professional: "Locate" },
    de: { general: "lokalisieren", professional: "lokalisieren", military: "LOKALISIEREN" },
  }),
  buildTerm({
    id: "missing_person",
    category: "medical",
    en: { general: "Missing Person", professional: "Missing Person" },
    de: { general: "vermisste Person", professional: "vermisste Person", military: "VERMISSTE PERSON" },
  }),
  buildTerm({
    id: "casualty",
    category: "medical",
    en: { general: "Casualty", professional: "Casualty" },
    de: { general: "Verwundeter", professional: "Verwundeter", military: "VERWUNDETER", full: "Verwundeter / Ausfall" },
  }),
  buildTerm({
    id: "patient",
    category: "medical",
    en: { general: "Patient", professional: "Patient" },
    de: { general: "Patient", professional: "Patient", military: "PATIENT" },
  }),
  buildTerm({
    id: "casualty_collection_point",
    category: "medical",
    en: {
      general: "Casualty Collection Point",
      professional: "Casualty Collection Point",
      military: "CCP",
      full: "Casualty Collection Point",
      acronym: "CCP",
    },
    de: {
      general: "Verwundetensammelstelle",
      professional: "Verwundetensammelstelle",
      military: "VERWUNDETENSAMMELSTELLE",
    },
  }),
  buildTerm({
    id: "casevac",
    category: "medical",
    en: {
      general: "Casualty Evacuation",
      professional: "Casualty Evacuation",
      military: "CASEVAC",
      full: "Casualty Evacuation",
      acronym: "CASEVAC",
    },
    de: { general: "Verwundetentransport", professional: "Verwundetentransport", military: "VERWUNDETENTRANSPORT" },
  }),
  buildTerm({
    id: "medevac",
    category: "medical",
    en: {
      general: "Medical Evacuation",
      professional: "Medical Evacuation",
      military: "MEDEVAC",
      full: "Medical Evacuation",
      acronym: "MEDEVAC",
    },
    de: { general: "medizinische Evakuierung", professional: "medizinische Evakuierung", military: "MEDIZINISCHE EVAKUIERUNG" },
  }),
  buildTerm({
    id: "triage",
    category: "medical",
    en: { general: "Triage", professional: "Triage" },
    de: { general: "Sichtung", professional: "Sichtung", military: "SICHTUNG" },
  }),
  buildTerm({
    id: "stable",
    category: "medical",
    en: { general: "Stable", professional: "STABLE", military: "STABLE" },
    de: { general: "stabil", professional: "STABIL", military: "STABIL" },
  }),
  buildTerm({
    id: "recovered",
    category: "medical",
    en: { general: "Recovered", professional: "RECOVERED", military: "RECOVERED" },
    de: { general: "geborgen", professional: "GEBORGEN", military: "GEBORGEN", full: "Stabilisiert / Geborgen" },
  }),
];
