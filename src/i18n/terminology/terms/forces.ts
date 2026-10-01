import { buildTerm } from "../../../core/terminology/build";
import type { TacticalTerm } from "../../../core/terminology/types";

// Forces and organization.
export const forcesTerms: TacticalTerm[] = [
  buildTerm({
    id: "forces",
    category: "forces",
    en: { general: "Forces", professional: "Forces" },
    de: { general: "Kräfte", professional: "Kräfte", military: "KRÄFTE" },
  }),
  buildTerm({
    id: "unit",
    category: "forces",
    en: { general: "Unit", professional: "Unit" },
    de: { general: "Einheit", professional: "Einheit", military: "EINHEIT" },
  }),
  buildTerm({
    id: "subunit",
    category: "forces",
    en: { general: "Subunit", professional: "Subunit" },
    de: { general: "Teileinheit", professional: "Teileinheit", military: "TEILEINHEIT" },
  }),
  buildTerm({
    id: "element",
    category: "forces",
    en: { general: "Element", professional: "Element" },
    de: {
      general: "Element",
      professional: "Element",
      military: "ELEMENT",
      full: "Element / Teileinheit",
    },
  }),
  buildTerm({
    id: "team",
    category: "forces",
    en: { general: "Team", professional: "Team" },
    de: { general: "Trupp", professional: "Trupp", military: "TRUPP", full: "Trupp / Team" },
  }),
  buildTerm({
    id: "task_force",
    category: "forces",
    en: { general: "Task Force", professional: "Task Force" },
    de: { general: "Einsatzverband", professional: "Einsatzverband", military: "EINSATZVERBAND" },
  }),
  buildTerm({
    id: "task_organization",
    category: "forces",
    en: {
      general: "Task Organization",
      professional: "Task Organization",
      military: "Task Org",
      full: "Task Organization",
    },
    de: { general: "Kräftegliederung", professional: "Kräftegliederung", military: "KRÄFTEGLIEDERUNG" },
  }),
  buildTerm({
    id: "assigned",
    category: "forces",
    en: { general: "Assigned", professional: "Assigned" },
    de: { general: "unterstellt", professional: "unterstellt", military: "UNTERSTELLT" },
  }),
  buildTerm({
    id: "attached",
    category: "forces",
    en: { general: "Attached", professional: "Attached" },
    de: { general: "zugeteilt", professional: "zugeteilt", military: "ZUGETEILT" },
  }),
  buildTerm({
    id: "supporting",
    category: "forces",
    en: { general: "Supporting", professional: "Supporting" },
    de: { general: "unterstützend", professional: "unterstützend", military: "UNTERSTÜTZEND" },
  }),
  buildTerm({
    id: "supported",
    category: "forces",
    en: { general: "Supported", professional: "Supported" },
    de: { general: "unterstützt", professional: "unterstützt", military: "UNTERSTÜTZT" },
  }),
  buildTerm({
    id: "personnel",
    category: "forces",
    en: { general: "Personnel", professional: "Personnel" },
    de: { general: "Personal", professional: "Personal", military: "PERSONAL", full: "Personal / Kräfte" },
  }),
  buildTerm({
    id: "special_operations_forces",
    category: "forces",
    en: {
      general: "Special Operations Forces",
      professional: "Special Operations Forces",
      military: "SOF",
      full: "Special Operations Forces",
      acronym: "SOF",
    },
    de: {
      general: "Spezialkräfte",
      professional: "Spezialkräfte",
      military: "SPEZIALKRÄFTE",
    },
    spezkr: {
      short: "SpezKr",
      full: "Spezialkräfte",
      source: "Bundeswehr abbreviation SpezKr",
    },
  }),
  buildTerm({
    id: "special_operations",
    category: "forces",
    en: { general: "Special Operations", professional: "Special Operations" },
    de: { general: "Spezialoperationen", professional: "Spezialoperationen", military: "SPEZIALOPERATIONEN" },
  }),
  buildTerm({
    id: "leader",
    category: "forces",
    en: { general: "Leader", professional: "Leader" },
    de: { general: "Truppführer", professional: "Truppführer", military: "TRUPPFÜHRER" },
  }),
  buildTerm({
    id: "commander_element",
    category: "forces",
    en: { general: "Commander's Element", professional: "Commander's Element" },
    de: { general: "Führungselement", professional: "Führungselement", military: "FÜHRUNGSELEMENT" },
  }),
];
