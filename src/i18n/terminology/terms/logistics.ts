import { buildTerm } from "../../../core/terminology/build";
import type { TacticalTerm } from "../../../core/terminology/types";

// Logistics and availability.
export const logisticsTerms: TacticalTerm[] = [
  buildTerm({
    id: "logistics",
    category: "logistics",
    en: { general: "Logistics", professional: "Logistics" },
    de: { general: "Logistik", professional: "Logistik", military: "LOGISTIK" },
  }),
  buildTerm({
    id: "supply",
    category: "logistics",
    en: { general: "Supply", professional: "Supply" },
    de: { general: "Versorgung", professional: "Versorgung", military: "VERSORGUNG" },
  }),
  buildTerm({
    id: "equipment",
    category: "logistics",
    en: { general: "Equipment", professional: "Equipment" },
    de: { general: "Ausstattung", professional: "Ausstattung", military: "AUSSTATTUNG" },
  }),
  buildTerm({
    id: "asset",
    category: "logistics",
    en: { general: "Asset", professional: "Asset" },
    de: { general: "Mittel", professional: "Mittel", military: "MITTEL" },
  }),
  buildTerm({
    id: "resource",
    category: "logistics",
    en: { general: "Resource", professional: "Resource" },
    de: { general: "Ressource", professional: "Ressource", military: "RESSOURCE" },
  }),
  buildTerm({
    id: "availability",
    category: "logistics",
    en: { general: "Availability", professional: "Availability" },
    de: { general: "Verfügbarkeit", professional: "Verfügbarkeit", military: "VERFÜGBARKEIT" },
  }),
  buildTerm({
    id: "serviceable",
    category: "logistics",
    en: { general: "Serviceable", professional: "Serviceable" },
    de: { general: "einsatzbereit", professional: "einsatzbereit", military: "EINSATZBEREIT" },
  }),
  buildTerm({
    id: "unserviceable",
    category: "logistics",
    en: { general: "Unserviceable", professional: "Unserviceable" },
    de: { general: "nicht einsatzbereit", professional: "nicht einsatzbereit", military: "NICHT EINSATZBEREIT" },
  }),
  buildTerm({
    id: "maintenance",
    category: "logistics",
    en: { general: "Maintenance", professional: "Maintenance" },
    de: { general: "Instandhaltung", professional: "Instandhaltung", military: "INSTANDHALTUNG" },
  }),
  buildTerm({
    id: "replacement",
    category: "logistics",
    en: { general: "Replacement", professional: "Replacement" },
    de: { general: "Ersatz", professional: "Ersatz", military: "ERSATZ" },
  }),
  buildTerm({
    id: "support",
    category: "logistics",
    en: { general: "Support", professional: "Support" },
    de: { general: "Unterstützung", professional: "Unterstützung", military: "UNTERSTÜTZUNG" },
  }),
  buildTerm({
    id: "host_nation_support",
    category: "logistics",
    en: {
      general: "Host Nation Support",
      professional: "Host Nation Support",
      military: "HNS",
      full: "Host Nation Support",
      acronym: "HNS",
    },
    de: { general: "Gastlandunterstützung", professional: "Gastlandunterstützung", military: "GASTLANDUNTERSTÜTZUNG" },
  }),
];
