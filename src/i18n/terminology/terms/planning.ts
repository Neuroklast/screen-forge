import { buildTerm } from "../../../core/terminology/build";
import type { TacticalTerm } from "../../../core/terminology/types";

// Planning and orders.
export const planningTerms: TacticalTerm[] = [
  buildTerm({
    id: "plan",
    category: "planning",
    en: { general: "Plan", professional: "Plan" },
    de: { general: "Plan", professional: "Plan", military: "PLAN" },
  }),
  buildTerm({
    id: "order",
    category: "planning",
    en: { general: "Order", professional: "Order" },
    de: { general: "Befehl", professional: "Befehl", military: "BEFEHL" },
  }),
  buildTerm({
    id: "warning_order",
    category: "planning",
    en: {
      general: "Warning Order",
      professional: "Warning Order",
      military: "WARNORD",
      full: "Warning Order",
      acronym: "WARNORD",
    },
    de: { general: "Vorbefehl", professional: "Vorbefehl", military: "VORBEFEHL" },
  }),
  buildTerm({
    id: "operation_order",
    category: "planning",
    en: {
      general: "Operation Order",
      professional: "Operation Order",
      military: "OPORD",
      full: "Operation Order",
      acronym: "OPORD",
    },
    de: { general: "Operationsbefehl", professional: "Operationsbefehl", military: "OPERATIONSBEFEHL" },
  }),
  buildTerm({
    id: "fragmentary_order",
    category: "planning",
    en: {
      general: "Fragmentary Order",
      professional: "Fragmentary Order",
      military: "FRAGORD",
      full: "Fragmentary Order",
      acronym: "FRAGORD",
    },
    de: { general: "Ergänzungsbefehl", professional: "Ergänzungsbefehl", military: "ERGÄNZUNGSBEFEHL" },
  }),
  buildTerm({
    id: "course_of_action",
    category: "planning",
    en: {
      general: "Course of Action",
      professional: "Course of Action",
      military: "COA",
      full: "Course of Action",
      acronym: "COA",
    },
    de: { general: "Handlungsoption", professional: "Handlungsoption", military: "HANDLUNGSOPTION" },
  }),
  buildTerm({
    id: "constraint",
    category: "planning",
    en: { general: "Constraint", professional: "Constraint" },
    de: { general: "Nebenbedingung", professional: "Nebenbedingung", military: "NEBENBEDINGUNG" },
  }),
  buildTerm({
    id: "restriction",
    category: "planning",
    en: { general: "Restriction", professional: "Restriction" },
    de: { general: "Einschränkung", professional: "Einschränkung", military: "EINSCHRÄNKUNG" },
  }),
  buildTerm({
    id: "assumption",
    category: "planning",
    en: { general: "Assumption", professional: "Assumption" },
    de: { general: "Annahme", professional: "Annahme", military: "ANNAHME" },
  }),
  buildTerm({
    id: "risk",
    category: "planning",
    en: { general: "Risk", professional: "Risk" },
    de: { general: "Risiko", professional: "Risiko", military: "RISIKO" },
  }),
  buildTerm({
    id: "contingency",
    category: "planning",
    en: { general: "Contingency", professional: "Contingency" },
    de: { general: "Eventualfall", professional: "Eventualfall", military: "EVENTUALFALL" },
  }),
  buildTerm({
    id: "branch",
    category: "planning",
    en: { general: "Branch", professional: "Branch" },
    de: { general: "Alternative", professional: "Alternative", military: "ALTERNATIVE" },
  }),
  buildTerm({
    id: "sequel",
    category: "planning",
    en: { general: "Sequel", professional: "Sequel" },
    de: { general: "Folgeplan", professional: "Folgeplan", military: "FOLGEPLAN" },
  }),
  buildTerm({
    id: "fallback",
    category: "planning",
    en: { general: "Fallback", professional: "Fallback" },
    de: { general: "Rückfalllösung", professional: "Rückfalllösung", military: "RÜCKFALLLÖSUNG" },
  }),
  buildTerm({
    id: "reserve",
    category: "planning",
    en: { general: "Reserve", professional: "Reserve" },
    de: { general: "Reserve", professional: "Reserve", military: "RESERVE" },
  }),
];
