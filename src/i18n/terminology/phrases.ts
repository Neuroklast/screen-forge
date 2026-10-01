import { buildPhrase } from "../../core/terminology/build";
import type { TacticalPhrase } from "../../core/terminology/types";

// Phrase templates carry parameters and are resolved like terms, but return a
// composed sentence instead of a single label.
export const tacticalPhrases: TacticalPhrase[] = [
  buildPhrase({
    id: "force.ready",
    en: { "en-professional": "{callsign} / READY", "en-military": "{callsign} / READY" },
    de: {
      "de-professional": "{callsign} / EINSATZBEREIT",
      "de-bundeswehr": "{callsign} / EINSATZBEREIT",
    },
  }),
  buildPhrase({
    id: "force.awaitingTasking",
    en: { "en-professional": "Awaiting tasking", "en-military": "AWAITING TASKING" },
    de: { "de-professional": "Auftrag ausstehend", "de-bundeswehr": "Auftrag ausstehend" },
  }),
  buildPhrase({
    id: "comms.lost",
    en: { "en-professional": "CONTACT LOST", "en-military": "CONTACT LOST" },
    de: { "de-professional": "VERBINDUNG ABGERISSEN", "de-bundeswehr": "VERBINDUNG ABGERISSEN" },
  }),
  buildPhrase({
    id: "comms.lastReport",
    en: { "en-professional": "Last report {time}", "en-military": "LAST REPORT {time}" },
    de: { "de-professional": "Letzte Meldung {time}", "de-bundeswehr": "Letzte Meldung {time}" },
  }),
  buildPhrase({
    id: "decision.required",
    en: { "en-professional": "DECISION REQUIRED", "en-military": "DECISION REQUIRED" },
    de: { "de-professional": "ENTSCHEIDUNG ERFORDERLICH", "de-bundeswehr": "ENTSCHEIDUNG ERFORDERLICH" },
  }),
  buildPhrase({
    id: "situation.newInformation",
    en: { "en-professional": "NEW INFORMATION RECEIVED", "en-military": "NEW INFORMATION RECEIVED" },
    de: { "de-professional": "NEUE LAGEINFORMATION", "de-bundeswehr": "NEUE LAGEINFORMATION" },
  }),
];
