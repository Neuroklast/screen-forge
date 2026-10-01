import { buildTerm } from "../../../core/terminology/build";
import type { TacticalTerm } from "../../../core/terminology/types";

// Command and control / situational picture.
export const situationTerms: TacticalTerm[] = [
  buildTerm({
    id: "command_control",
    category: "situation",
    en: {
      general: "Command and Control",
      professional: "Command and Control",
      military: "C2",
      full: "Command and Control",
      acronym: "C2",
    },
    de: { general: "Führung", professional: "Führung", military: "FÜHRUNG" },
  }),
  buildTerm({
    id: "command_post",
    category: "situation",
    en: {
      general: "Command Post",
      professional: "Command Post",
      military: "CP",
      full: "Command Post",
      acronym: "CP",
    },
    de: {
      general: "Gefechtsstand",
      professional: "Gefechtsstand",
      military: "GEFECHTSSTAND",
      full: "Gefechtsstand / Führungsstelle",
    },
  }),
  buildTerm({
    id: "commander",
    category: "situation",
    en: { general: "Commander", professional: "Commander" },
    de: { general: "Kommandeur", professional: "Kommandeur", military: "KOMMANDEUR" },
  }),
  buildTerm({
    id: "headquarters",
    category: "situation",
    en: {
      general: "Headquarters",
      professional: "Headquarters",
      military: "HQ",
      full: "Headquarters",
      acronym: "HQ",
    },
    de: { general: "Stab", professional: "Stab", military: "STAB", full: "Stab / Führung" },
  }),
  buildTerm({
    id: "common_operational_picture",
    category: "situation",
    en: {
      general: "Common Operational Picture",
      professional: "Common Operational Picture",
      military: "COP",
      full: "Common Operational Picture",
      acronym: "COP",
    },
    de: {
      general: "Gemeinsames Lagebild",
      professional: "Gemeinsames Lagebild",
      military: "Lagebild",
      full: "Gemeinsames Lagebild",
    },
  }),
  buildTerm({
    id: "common_tactical_picture",
    category: "situation",
    en: {
      general: "Common Tactical Picture",
      professional: "Common Tactical Picture",
      military: "CTP",
      full: "Common Tactical Picture",
      acronym: "CTP",
    },
    de: {
      general: "Taktisches Lagebild",
      professional: "Taktisches Lagebild",
      military: "Lagebild",
      full: "Taktisches Lagebild",
    },
  }),
  buildTerm({
    id: "situational_awareness",
    category: "situation",
    en: {
      general: "Situational Awareness",
      professional: "Situational Awareness",
      military: "SA",
      full: "Situational Awareness",
      acronym: "SA",
    },
    de: { general: "Lagebewusstsein", professional: "Lagebewusstsein", military: "LAGEBEWUSSTSEIN" },
  }),
  buildTerm({
    id: "situational_understanding",
    category: "situation",
    en: { general: "Situational Understanding", professional: "Situational Understanding" },
    de: { general: "Lageverständnis", professional: "Lageverständnis", military: "LAGEVERSTÄNDNIS" },
  }),
  buildTerm({
    id: "battle_tracking",
    category: "situation",
    en: { general: "Battle Tracking", professional: "Battle Tracking" },
    de: { general: "Lagefortschreibung", professional: "Lagefortschreibung", military: "LAGEFORTSCHREIBUNG" },
  }),
  buildTerm({
    id: "running_estimate",
    category: "situation",
    en: { general: "Running Estimate", professional: "Running Estimate" },
    de: {
      general: "fortlaufende Lagebeurteilung",
      professional: "fortlaufende Lagebeurteilung",
      military: "FORLAUFENDE LAGEBEURTEILUNG",
    },
  }),
  buildTerm({
    id: "decision_support",
    category: "situation",
    en: { general: "Decision Support", professional: "Decision Support" },
    de: {
      general: "Entscheidungsunterstützung",
      professional: "Entscheidungsunterstützung",
      military: "ENTSCHEIDUNGSUNTERSTÜTZUNG",
    },
  }),
  buildTerm({
    id: "information_requirement",
    category: "situation",
    en: { general: "Information Requirement", professional: "Information Requirement" },
    de: { general: "Informationsbedarf", professional: "Informationsbedarf", military: "INFORMATIONSBEDARF" },
  }),
  buildTerm({
    id: "ccir",
    category: "situation",
    en: {
      general: "Commander's Critical Information Requirement",
      professional: "Commander's Critical Information Requirement",
      military: "CCIR",
      full: "Commander's Critical Information Requirement",
      acronym: "CCIR",
    },
    de: {
      general: "kritischer Informationsbedarf der Führung",
      professional: "kritischer Informationsbedarf der Führung",
      military: "KRITISCHER INFORMATIONSBEDARF DER FÜHRUNG",
    },
  }),
];
