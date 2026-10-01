import { buildTerm } from "../../../core/terminology/build";
import type { TacticalTerm } from "../../../core/terminology/types";

// Safety and hazard. Descriptive only: no real weapon or CBRN procedure content.
export const safetyTerms: TacticalTerm[] = [
  buildTerm({
    id: "hazard",
    category: "safety",
    en: { general: "Hazard", professional: "Hazard" },
    de: { general: "Gefahr", professional: "Gefahr", military: "GEFAHR" },
  }),
  buildTerm({
    id: "threat",
    category: "safety",
    en: { general: "Threat", professional: "Threat" },
    de: { general: "Bedrohung", professional: "Bedrohung", military: "BEDROHUNG" },
  }),
  buildTerm({
    id: "risk_level",
    category: "safety",
    en: { general: "Risk Level", professional: "Risk Level" },
    de: { general: "Risikostufe", professional: "Risikostufe", military: "RISIKOSTUFE" },
  }),
  buildTerm({
    id: "safe",
    category: "safety",
    en: { general: "Safe", professional: "SAFE", military: "SAFE" },
    de: { general: "sicher", professional: "SICHER", military: "SICHER" },
  }),
  buildTerm({
    id: "unsafe",
    category: "safety",
    en: { general: "Unsafe", professional: "UNSAFE", military: "UNSAFE" },
    de: { general: "unsicher", professional: "UNSICHER", military: "UNSICHER" },
  }),
  buildTerm({
    id: "clear",
    category: "safety",
    en: { general: "Clear", professional: "CLEAR", military: "CLEAR" },
    de: { general: "frei", professional: "FREI", military: "FREI" },
  }),
  buildTerm({
    id: "restricted",
    category: "safety",
    en: { general: "Restricted", professional: "RESTRICTED", military: "RESTRICTED" },
    de: { general: "gesperrt", professional: "GESPERRT", military: "GESPERRT" },
  }),
  buildTerm({
    id: "contaminated",
    category: "safety",
    en: { general: "Contaminated", professional: "CONTAMINATED", military: "CONTAMINATED" },
    de: { general: "kontaminiert", professional: "KONTAMINIERT", military: "KONTAMINIERT" },
  }),
  buildTerm({
    id: "cbrn",
    category: "safety",
    en: {
      general: "Chemical, Biological, Radiological, Nuclear",
      professional: "Chemical, Biological, Radiological, Nuclear",
      military: "CBRN",
      full: "Chemical, Biological, Radiological, Nuclear",
      acronym: "CBRN",
    },
    de: {
      general: "Atomar, Biologisch, Chemisch",
      professional: "Atomar, Biologisch, Chemisch",
      military: "ABC",
      full: "Atomar, Biologisch, Chemisch",
    },
  }),
  buildTerm({
    id: "warning",
    category: "safety",
    en: { general: "Warning", professional: "WARNING", military: "WARNING" },
    de: { general: "Warnung", professional: "WARNUNG", military: "WARNUNG" },
  }),
  buildTerm({
    id: "alarm",
    category: "safety",
    en: { general: "Alarm", professional: "ALARM", military: "ALARM" },
    de: { general: "Alarm", professional: "ALARM", military: "ALARM" },
  }),
  buildTerm({
    id: "incident",
    category: "safety",
    en: { general: "Incident", professional: "Incident" },
    de: { general: "Vorfall", professional: "Vorfall", military: "VORFALL" },
  }),
  buildTerm({
    id: "emergency",
    category: "safety",
    en: { general: "Emergency", professional: "Emergency" },
    de: { general: "Notfall", professional: "Notfall", military: "NOTFALL" },
  }),
  buildTerm({
    id: "evacuation",
    category: "safety",
    en: { general: "Evacuation", professional: "Evacuation" },
    de: { general: "Evakuierung", professional: "Evakuierung", military: "EVAKUIERUNG" },
  }),
];
