import { buildTerm } from "../../../core/terminology/build";
import type { TacticalTerm } from "../../../core/terminology/types";

// Time.
export const timeTerms: TacticalTerm[] = [
  buildTerm({
    id: "time",
    category: "time",
    en: { general: "Time", professional: "Time" },
    de: { general: "Zeit", professional: "Zeit", military: "ZEIT" },
  }),
  buildTerm({
    id: "start_time",
    category: "time",
    en: { general: "Start Time", professional: "Start Time" },
    de: { general: "Startzeit", professional: "Startzeit", military: "STARTZEIT" },
  }),
  buildTerm({
    id: "execution_time",
    category: "time",
    en: { general: "Execution Time", professional: "Execution Time" },
    de: { general: "Durchführungszeit", professional: "Durchführungszeit", military: "DURCHFÜHRUNGSZEIT" },
  }),
  buildTerm({
    id: "eta",
    category: "time",
    en: {
      general: "Estimated Time of Arrival",
      professional: "Estimated Time of Arrival",
      military: "ETA",
      full: "Estimated Time of Arrival",
      acronym: "ETA",
    },
    de: { general: "voraussichtliche Ankunft", professional: "voraussichtliche Ankunft", military: "VORAUSSICHTLICHE ANKUNFT" },
  }),
  buildTerm({
    id: "etd",
    category: "time",
    en: {
      general: "Estimated Time of Departure",
      professional: "Estimated Time of Departure",
      military: "ETD",
      full: "Estimated Time of Departure",
      acronym: "ETD",
    },
    de: { general: "voraussichtlicher Abmarsch", professional: "voraussichtlicher Abmarsch", military: "VORAUSSICHTLICHER ABMARSCH" },
  }),
  buildTerm({
    id: "window",
    category: "time",
    en: { general: "Window", professional: "Window" },
    de: { general: "Zeitfenster", professional: "Zeitfenster", military: "ZEITFENSTER" },
  }),
  buildTerm({
    id: "deadline",
    category: "time",
    en: { general: "Deadline", professional: "Deadline" },
    de: { general: "spätester Zeitpunkt", professional: "spätester Zeitpunkt", military: "SPÄTESTER ZEITPUNKT" },
  }),
  buildTerm({
    id: "delay",
    category: "time",
    en: { general: "Delay", professional: "Delay" },
    de: { general: "Verzögerung", professional: "Verzögerung", military: "VERZÖGERUNG" },
  }),
  buildTerm({
    id: "on_schedule",
    category: "time",
    en: { general: "On Schedule", professional: "On Schedule", military: "ON SCHEDULE" },
    de: { general: "im Plan", professional: "im Plan", military: "IM PLAN" },
  }),
  buildTerm({
    id: "overdue",
    category: "time",
    en: { general: "Overdue", professional: "Overdue", military: "OVERDUE" },
    de: { general: "überfällig", professional: "überfällig", military: "ÜBERFÄLLIG" },
  }),
  buildTerm({
    id: "synchronize",
    category: "time",
    en: { general: "Synchronize", professional: "Synchronize", military: "SYNCHRONIZE" },
    de: { general: "synchronisieren", professional: "synchronisieren", military: "SYNCHRONISIEREN" },
  }),
  buildTerm({
    id: "sequence",
    category: "time",
    en: { general: "Sequence", professional: "Sequence" },
    de: { general: "Ablauf", professional: "Ablauf", military: "ABLAUF" },
  }),
];
