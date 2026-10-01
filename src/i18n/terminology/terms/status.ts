import { buildTerm } from "../../../core/terminology/build";
import type { TacticalTerm } from "../../../core/terminology/types";

// Status words. Uppercase in both languages for command-surface display.
export const statusTerms: TacticalTerm[] = [
  buildTerm({
    id: "ready",
    category: "status",
    en: { general: "Ready", professional: "READY", military: "READY" },
    de: { general: "einsatzbereit", professional: "EINSATZBEREIT", military: "EINSATZBEREIT" },
  }),
  buildTerm({
    id: "not_ready",
    category: "status",
    en: { general: "Not ready", professional: "NOT READY", military: "NOT READY" },
    de: { general: "nicht einsatzbereit", professional: "NICHT EINSATZBEREIT", military: "NICHT EINSATZBEREIT" },
  }),
  buildTerm({
    id: "active",
    category: "status",
    en: { general: "Active", professional: "ACTIVE", military: "ACTIVE" },
    de: { general: "aktiv", professional: "AKTIV", military: "AKTIV" },
  }),
  buildTerm({
    id: "inactive",
    category: "status",
    en: { general: "Inactive", professional: "INACTIVE", military: "INACTIVE" },
    de: { general: "inaktiv", professional: "INAKTIV", military: "INAKTIV" },
  }),
  buildTerm({
    id: "hold",
    category: "status",
    en: { general: "Hold", professional: "HOLD", military: "HOLD" },
    de: { general: "halten", professional: "HALTEN", military: "HALTEN" },
  }),
  buildTerm({
    id: "degraded",
    category: "status",
    en: { general: "Degraded", professional: "DEGRADED", military: "DEGRADED" },
    de: { general: "eingeschränkt", professional: "EINGESCHRÄNKT", military: "EINGESCHRÄNKT" },
  }),
  buildTerm({
    id: "offline",
    category: "status",
    en: { general: "Offline", professional: "OFFLINE", military: "OFFLINE" },
    de: { general: "nicht verfügbar", professional: "NICHT VERFÜGBAR", military: "NICHT VERFÜGBAR" },
  }),
  buildTerm({
    id: "online",
    category: "status",
    en: { general: "Online", professional: "ONLINE", military: "ONLINE" },
    de: { general: "verfügbar", professional: "VERFÜGBAR", military: "VERFÜGBAR" },
  }),
  buildTerm({
    id: "available",
    category: "status",
    en: { general: "Available", professional: "AVAILABLE", military: "AVAILABLE" },
    de: { general: "verfügbar", professional: "VERFÜGBAR", military: "VERFÜGBAR" },
  }),
  buildTerm({
    id: "unavailable",
    category: "status",
    en: { general: "Unavailable", professional: "UNAVAILABLE", military: "UNAVAILABLE" },
    de: { general: "nicht verfügbar", professional: "NICHT VERFÜGBAR", military: "NICHT VERFÜGBAR" },
  }),
  buildTerm({
    id: "unknown",
    category: "status",
    en: { general: "Unknown", professional: "UNKNOWN", military: "UNKNOWN" },
    de: { general: "unbekannt", professional: "UNBEKANNT", military: "UNBEKANNT" },
  }),
  buildTerm({
    id: "complete",
    category: "status",
    en: { general: "Complete", professional: "COMPLETE", military: "COMPLETE" },
    de: { general: "abgeschlossen", professional: "ABGESCHLOSSEN", military: "ABGESCHLOSSEN" },
  }),
  buildTerm({
    id: "aborted",
    category: "status",
    en: { general: "Aborted", professional: "ABORTED", military: "ABORTED" },
    de: { general: "abgebrochen", professional: "ABGEBROCHEN", military: "ABGEBROCHEN" },
  }),
  buildTerm({
    id: "pending",
    category: "status",
    en: { general: "Pending", professional: "PENDING", military: "PENDING" },
    de: { general: "ausstehend", professional: "AUSSTEHEND", military: "AUSSTEHEND" },
  }),
  buildTerm({
    id: "blocked",
    category: "status",
    en: { general: "Blocked", professional: "BLOCKED", military: "BLOCKED" },
    de: { general: "blockiert", professional: "BLOCKIERT", military: "BLOCKIERT" },
  }),
  buildTerm({
    id: "failed",
    category: "status",
    en: { general: "Failed", professional: "FAILED", military: "FAILED" },
    de: { general: "fehlgeschlagen", professional: "FEHLGESCHLAGEN", military: "FEHLGESCHLAGEN" },
  }),
  buildTerm({
    id: "confirmed",
    category: "status",
    en: { general: "Confirmed", professional: "CONFIRMED", military: "CONFIRMED" },
    de: { general: "bestätigt", professional: "BESTÄTIGT", military: "BESTÄTIGT" },
  }),
  buildTerm({
    id: "unconfirmed",
    category: "status",
    en: { general: "Unconfirmed", professional: "UNCONFIRMED", military: "UNCONFIRMED" },
    de: { general: "unbestätigt", professional: "UNBESTÄTIGT", military: "UNBESTÄTIGT" },
  }),
  buildTerm({
    id: "critical",
    category: "status",
    en: { general: "Critical", professional: "CRITICAL", military: "CRITICAL" },
    de: { general: "kritisch", professional: "KRITISCH", military: "KRITISCH" },
  }),
  // Connection status for control surfaces. Professional labels keep the existing
  // German/English chrome; military uses the operational short form.
  buildTerm({
    id: "connected",
    category: "status",
    en: { general: "Connected", professional: "Connected", military: "CONNECTED" },
    de: { general: "Verbunden", professional: "Verbunden", military: "VERBUNDEN" },
  }),
  buildTerm({
    id: "disconnected",
    category: "status",
    en: { general: "Offline", professional: "Offline", military: "OFFLINE" },
    de: { general: "Offline", professional: "Offline", military: "OFFLINE" },
  }),
  buildTerm({
    id: "running",
    category: "status",
    en: { general: "Running", professional: "RUNNING", military: "RUNNING" },
    de: { general: "läuft", professional: "LÄUFT", military: "LÄUFT" },
  }),
  buildTerm({
    id: "paused",
    category: "status",
    en: { general: "Paused", professional: "PAUSED", military: "PAUSED" },
    de: { general: "pausiert", professional: "PAUSIERT", military: "PAUSIERT" },
  }),
];
