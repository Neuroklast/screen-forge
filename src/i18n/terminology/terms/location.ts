import { buildTerm } from "../../../core/terminology/build";
import type { TacticalTerm } from "../../../core/terminology/types";

// Location and area.
export const locationTerms: TacticalTerm[] = [
  buildTerm({
    id: "area_of_operations",
    category: "location",
    en: {
      general: "Area of Operations",
      professional: "Area of Operations",
      military: "AO",
      full: "Area of Operations",
      acronym: "AO",
    },
    de: { general: "Einsatzraum", professional: "Einsatzraum", military: "EINSATZRAUM" },
  }),
  buildTerm({
    id: "area_of_responsibility",
    category: "location",
    en: {
      general: "Area of Responsibility",
      professional: "Area of Responsibility",
      military: "AOR",
      full: "Area of Responsibility",
      acronym: "AOR",
    },
    de: { general: "Verantwortungsbereich", professional: "Verantwortungsbereich", military: "VERANTWORTUNGSBEREICH" },
  }),
  buildTerm({
    id: "area_of_interest",
    category: "location",
    en: {
      general: "Area of Interest",
      professional: "Area of Interest",
      military: "AI",
      full: "Area of Interest",
      acronym: "AI",
    },
    de: { general: "Interessenbereich", professional: "Interessenbereich", military: "INTERESSENBEREICH" },
  }),
  buildTerm({
    id: "location",
    category: "location",
    en: { general: "Location", professional: "Location" },
    de: { general: "Ort", professional: "Ort", military: "ORT" },
  }),
  buildTerm({
    id: "position",
    category: "location",
    en: { general: "Position", professional: "Position" },
    de: { general: "Position", professional: "Position", military: "POSITION" },
  }),
  buildTerm({
    id: "last_known_position",
    category: "location",
    en: {
      general: "Last Known Position",
      professional: "Last Known Position",
      military: "LKP",
      full: "Last Known Position",
      acronym: "LKP",
    },
    de: {
      general: "letzte bekannte Position",
      professional: "letzte bekannte Position",
      military: "LETZTE BEKANNTE POSITION",
    },
  }),
  buildTerm({
    id: "route",
    category: "location",
    en: { general: "Route", professional: "Route" },
    de: { general: "Route", professional: "Route", military: "ROUTE" },
  }),
  buildTerm({
    id: "checkpoint",
    category: "location",
    en: { general: "Checkpoint", professional: "Checkpoint" },
    de: { general: "Kontrollpunkt", professional: "Kontrollpunkt", military: "KONTROLLPUNKT" },
  }),
  buildTerm({
    id: "reference_point",
    category: "location",
    en: {
      general: "Reference Point",
      professional: "Reference Point",
      military: "RP",
      full: "Reference Point",
      acronym: "RP",
    },
    de: { general: "Bezugspunkt", professional: "Bezugspunkt", military: "BEZUGSPUNKT" },
  }),
  buildTerm({
    id: "boundary",
    category: "location",
    en: { general: "Boundary", professional: "Boundary" },
    de: { general: "Grenze", professional: "Grenze", military: "GRENZE" },
  }),
  buildTerm({
    id: "sector",
    category: "location",
    en: { general: "Sector", professional: "Sector" },
    de: { general: "Sektor", professional: "Sektor", military: "SEKTOR" },
  }),
  buildTerm({
    id: "zone",
    category: "location",
    en: { general: "Zone", professional: "Zone" },
    de: { general: "Zone", professional: "Zone", military: "ZONE" },
  }),
  buildTerm({
    id: "assembly_area",
    category: "location",
    en: { general: "Assembly Area", professional: "Assembly Area" },
    de: { general: "Sammelraum", professional: "Sammelraum", military: "SAMMELRAUM" },
  }),
  buildTerm({
    id: "staging_area",
    category: "location",
    en: { general: "Staging Area", professional: "Staging Area" },
    de: { general: "Bereitstellungsraum", professional: "Bereitstellungsraum", military: "BEREITSTELLUNGSRAUM" },
  }),
  buildTerm({
    id: "objective_area",
    category: "location",
    en: { general: "Objective Area", professional: "Objective Area" },
    de: { general: "Zielraum", professional: "Zielraum", military: "ZIELRAUM" },
  }),
];
