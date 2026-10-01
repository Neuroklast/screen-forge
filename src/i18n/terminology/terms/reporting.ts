import { buildTerm } from "../../../core/terminology/build";
import type { TacticalTerm } from "../../../core/terminology/types";

// Reporting and information.
export const reportingTerms: TacticalTerm[] = [
  buildTerm({
    id: "report",
    category: "reporting",
    en: { general: "Report", professional: "Report" },
    de: { general: "Meldung", professional: "Meldung", military: "MELDUNG" },
  }),
  buildTerm({
    id: "status_report",
    category: "reporting",
    en: { general: "Status Report", professional: "Status Report" },
    de: { general: "Statusmeldung", professional: "Statusmeldung", military: "STATUSMELDUNG" },
  }),
  buildTerm({
    id: "situation_report",
    category: "reporting",
    en: {
      general: "Situation Report",
      professional: "Situation Report",
      military: "SITREP",
      full: "Situation Report",
      acronym: "SITREP",
    },
    de: { general: "Lagemeldung", professional: "Lagemeldung", military: "LAGEMELDUNG" },
  }),
  buildTerm({
    id: "update",
    category: "reporting",
    en: { general: "Update", professional: "Update" },
    de: { general: "Lageaktualisierung", professional: "Lageaktualisierung", military: "LAGEAKTUALISIERUNG" },
  }),
  buildTerm({
    id: "observation",
    category: "reporting",
    en: { general: "Observation", professional: "Observation" },
    de: { general: "Beobachtung", professional: "Beobachtung", military: "BEOBACHTUNG" },
  }),
  buildTerm({
    id: "information",
    category: "reporting",
    en: { general: "Information", professional: "Information" },
    de: { general: "Information", professional: "Information", military: "INFORMATION" },
  }),
  buildTerm({
    id: "intelligence",
    category: "reporting",
    en: { general: "Intelligence", professional: "Intelligence" },
    de: { general: "Erkenntnisse", professional: "Erkenntnisse", military: "ERKENNTNISSE" },
  }),
  buildTerm({
    id: "source",
    category: "reporting",
    en: { general: "Source", professional: "Source" },
    de: { general: "Quelle", professional: "Quelle", military: "QUELLE" },
  }),
  buildTerm({
    id: "assessed",
    category: "reporting",
    en: { general: "Assessed", professional: "Assessed" },
    de: { general: "bewertet", professional: "bewertet", military: "BEWERTET" },
  }),
  buildTerm({
    id: "estimated",
    category: "reporting",
    en: { general: "Estimated", professional: "Estimated" },
    de: { general: "geschätzt", professional: "geschätzt", military: "GESCHÄTZT" },
  }),
  buildTerm({
    id: "reliable",
    category: "reporting",
    en: { general: "Reliable", professional: "Reliable" },
    de: { general: "zuverlässig", professional: "zuverlässig", military: "ZUVERLÄSSIG" },
  }),
  buildTerm({
    id: "unknown_source",
    category: "reporting",
    en: { general: "Unknown Source", professional: "Unknown Source" },
    de: { general: "unbekannte Quelle", professional: "unbekannte Quelle", military: "UNBEKANNTE QUELLE" },
  }),
  buildTerm({
    id: "request_information",
    category: "reporting",
    en: {
      general: "Request for Information",
      professional: "Request for Information",
      military: "RFI",
      full: "Request for Information",
      acronym: "RFI",
    },
    de: { general: "Informationsanforderung", professional: "Informationsanforderung", military: "INFORMATIONSANFORDERUNG" },
  }),
  buildTerm({
    id: "evidence",
    category: "reporting",
    en: { general: "Evidence", professional: "Evidence" },
    de: { general: "Beleg", professional: "Beleg", military: "BELEG" },
  }),
  buildTerm({
    id: "finding",
    category: "reporting",
    en: { general: "Finding", professional: "Finding" },
    de: { general: "Befund", professional: "Befund", military: "BEFUND" },
  }),
  buildTerm({
    id: "assessment",
    category: "reporting",
    en: { general: "Assessment", professional: "Assessment" },
    de: { general: "Bewertung", professional: "Bewertung", military: "BEWERTUNG" },
  }),
];
