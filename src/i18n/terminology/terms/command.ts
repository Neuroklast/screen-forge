import { buildTerm } from "../../../core/terminology/build";
import type { TacticalTerm } from "../../../core/terminology/types";

// Command / mission language. Semantic ids are stable; labels are profile data.
export const commandTerms: TacticalTerm[] = [
  buildTerm({
    id: "situation",
    category: "command",
    en: { general: "Situation", professional: "Situation", military: "SITUATION" },
    de: { general: "Lage", professional: "Lage", military: "LAGE" },
  }),
  buildTerm({
    id: "mission",
    category: "command",
    en: { general: "Mission", professional: "MISSION", full: "Mission" },
    de: {
      general: "Aufgabe",
      professional: "Auftrag",
      military: "AUFTRAG",
      full: "Auftrag",
    },
    spezkr: { short: "AUFTRAG", full: "Auftrag", source: "Bundeswehr terminology" },
  }),
  buildTerm({
    id: "task",
    category: "command",
    en: { general: "Task", professional: "Task" },
    de: { general: "Aufgabe", professional: "Teilauftrag", military: "TEILAUFTRAG" },
  }),
  buildTerm({
    id: "purpose",
    category: "command",
    en: { general: "Purpose", professional: "Purpose" },
    de: { general: "Zweck", professional: "Zweck", military: "ZWECK" },
  }),
  buildTerm({
    id: "intent",
    category: "command",
    en: { general: "Intent", professional: "Intent" },
    de: { general: "Absicht", professional: "Absicht", military: "ABSICHT" },
  }),
  buildTerm({
    id: "commanders_intent",
    category: "command",
    en: {
      general: "Commander's Intent",
      professional: "Commander's Intent",
      military: "COMMANDER'S INTENT",
    },
    de: {
      general: "Absicht der Führung",
      professional: "Absicht der Führung",
      military: "ABSICHT DER FÜHRUNG",
    },
  }),
  buildTerm({
    id: "end_state",
    category: "command",
    en: { general: "End State", professional: "End State", military: "END STATE" },
    de: { general: "Endzustand", professional: "Endzustand", military: "ENDZUSTAND" },
  }),
  buildTerm({
    id: "execution",
    category: "command",
    en: { general: "Execution", professional: "Execution" },
    de: { general: "Durchführung", professional: "Durchführung", military: "DURCHFÜHRUNG" },
  }),
  buildTerm({
    id: "concept_of_operations",
    category: "command",
    en: {
      general: "Concept of Operations",
      professional: "Concept of Operations",
      military: "CONOPS",
      full: "Concept of Operations",
      acronym: "CONOPS",
    },
    de: {
      general: "Operationskonzept",
      professional: "Operationskonzept",
      military: "OPERATIONSKONZEPT",
    },
  }),
  buildTerm({
    id: "operation",
    category: "command",
    en: { general: "Operation", professional: "Operation" },
    de: { general: "Operation", professional: "Operation", military: "OPERATION" },
  }),
  buildTerm({
    id: "phase",
    category: "command",
    en: { general: "Phase", professional: "Phase" },
    de: { general: "Phase", professional: "Phase", military: "PHASE" },
  }),
  buildTerm({
    id: "objective",
    category: "command",
    en: { general: "Objective", professional: "Objective" },
    de: { general: "Ziel", professional: "Ziel", full: "Auftragsziel", military: "ZIEL" },
  }),
  buildTerm({
    id: "decision",
    category: "command",
    en: { general: "Decision", professional: "Decision" },
    de: { general: "Entscheidung", professional: "Entscheidung", military: "ENTSCHEIDUNG" },
  }),
  buildTerm({
    id: "decision_point",
    category: "command",
    en: { general: "Decision Point", professional: "Decision Point", military: "DECISION POINT" },
    de: {
      general: "Entscheidungspunkt",
      professional: "Entscheidungspunkt",
      military: "ENTSCHEIDUNGSPUNKT",
    },
  }),
  buildTerm({
    id: "condition",
    category: "command",
    en: { general: "Condition", professional: "Condition" },
    de: { general: "Bedingung", professional: "Bedingung", military: "BEDINGUNG" },
  }),
  buildTerm({
    id: "trigger",
    category: "command",
    en: { general: "Trigger", professional: "Trigger" },
    de: { general: "Auslöser", professional: "Auslöser", military: "AUSLÖSER" },
  }),
  buildTerm({
    id: "event",
    category: "command",
    en: { general: "Event", professional: "Event" },
    de: { general: "Ereignis", professional: "Ereignis", military: "EREIGNIS" },
  }),
  buildTerm({
    id: "action",
    category: "command",
    en: { general: "Action", professional: "Action" },
    de: { general: "Handlung", professional: "Handlung", military: "HANDLUNG" },
  }),
  buildTerm({
    id: "effect",
    category: "command",
    en: { general: "Effect", professional: "Effect" },
    de: { general: "Wirkung", professional: "Wirkung", military: "WIRKUNG" },
  }),
  buildTerm({
    id: "outcome",
    category: "command",
    en: { general: "Outcome", professional: "Outcome" },
    de: { general: "Ergebnis", professional: "Ergebnis", military: "ERGEBNIS" },
  }),
  buildTerm({
    id: "success",
    category: "command",
    en: { general: "Success", professional: "Success" },
    de: { general: "Erfolg", professional: "Erfolg", military: "ERFOLG" },
  }),
  buildTerm({
    id: "failure",
    category: "command",
    en: { general: "Failure", professional: "Failure" },
    de: { general: "Fehlschlag", professional: "Fehlschlag", military: "FEHLSCHLAG" },
  }),
  buildTerm({
    id: "abort",
    category: "command",
    en: { general: "Abort", professional: "ABORT", military: "ABORT" },
    de: { general: "Abbruch", professional: "ABBRUCH", military: "ABBRUCH" },
  }),
  buildTerm({
    id: "continue",
    category: "command",
    en: { general: "Continue", professional: "CONTINUE", military: "CONTINUE" },
    de: { general: "Fortsetzen", professional: "FORTSETZEN", military: "FORTSETZEN" },
  }),
  buildTerm({
    id: "priority",
    category: "command",
    en: { general: "Priority", professional: "Priority" },
    de: { general: "Priorität", professional: "Priorität", military: "PRIORITÄT" },
  }),
];
