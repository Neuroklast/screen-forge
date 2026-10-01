import { buildTerm } from "../../../core/terminology/build";
import type { TacticalTerm } from "../../../core/terminology/types";

// Navigation labels for the fixed preparation information architecture. These
// are display-only: section ids stay `overview | scenario | participants |
// devices | flow | review` and are never replaced by translated text.
export const navTerms: TacticalTerm[] = [
  buildTerm({
    id: "nav.overview",
    category: "command",
    en: { general: "Overview", professional: "Overview", military: "OVERVIEW" },
    de: { general: "Übersicht", professional: "Übersicht", military: "ÜBERSICHT" },
  }),
  buildTerm({
    id: "nav.mission",
    category: "command",
    en: { general: "Scenario", professional: "Scenario", military: "MISSION" },
    de: { general: "Szenario", professional: "Szenario", military: "AUFTRAG" },
  }),
  buildTerm({
    id: "nav.forces",
    category: "command",
    en: { general: "Participants", professional: "Participants", military: "FORCES" },
    de: { general: "Teilnehmer", professional: "Teilnehmer", military: "KRÄFTE" },
  }),
  buildTerm({
    id: "nav.assets",
    category: "command",
    en: { general: "Devices", professional: "Devices", military: "ASSETS" },
    de: { general: "Geräte", professional: "Geräte", military: "MITTEL" },
  }),
  buildTerm({
    id: "nav.flow",
    category: "command",
    en: { general: "Flow", professional: "Flow", military: "FLOW" },
    de: { general: "Ablauf", professional: "Ablauf", military: "ABLAUF" },
  }),
  buildTerm({
    id: "nav.review",
    category: "command",
    en: { general: "Review", professional: "Review", military: "REVIEW" },
    de: { general: "Prüfen", professional: "Prüfen", military: "PRÜFUNG" },
  }),
  buildTerm({
    id: "nav.live",
    category: "command",
    en: { general: "Live Control", professional: "Live Control", military: "LIVE" },
    de: { general: "Live-Steuerung", professional: "Live-Steuerung", military: "LIVE" },
  }),
  buildTerm({
    id: "nav.events",
    category: "command",
    en: { general: "Events", professional: "Events", military: "EVENTS" },
    de: { general: "Ereignisse", professional: "Ereignisse", military: "EREIGNISSE" },
  }),
  buildTerm({
    id: "nav.reports",
    category: "command",
    en: { general: "Reports", professional: "Reports", military: "REPORTS" },
    de: { general: "Meldungen", professional: "Meldungen", military: "MELDUNGEN" },
  }),
  buildTerm({
    id: "nav.assessment",
    category: "command",
    en: { general: "Assessment", professional: "Assessment", military: "ASSESSMENT" },
    de: { general: "Auswertung", professional: "Auswertung", military: "AUSWERTUNG" },
  }),
];
