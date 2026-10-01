import { buildTerm } from "../../../core/terminology/build";
import type { TacticalTerm } from "../../../core/terminology/types";

// Communications.
export const communicationsTerms: TacticalTerm[] = [
  buildTerm({
    id: "communications",
    category: "communications",
    en: {
      general: "Communications",
      professional: "Communications",
      military: "COMMS",
      full: "Communications",
      acronym: "COMMS",
    },
    de: { general: "Verbindung", professional: "Verbindung", military: "VERBINDUNG" },
  }),
  buildTerm({
    id: "network",
    category: "communications",
    en: { general: "Net", professional: "Net" },
    de: { general: "Funkkreis", professional: "Funkkreis", military: "FUNKKREIS", full: "Funkkreis / Netz" },
  }),
  buildTerm({
    id: "channel",
    category: "communications",
    en: { general: "Channel", professional: "Channel" },
    de: { general: "Kanal", professional: "Kanal", military: "KANAL" },
  }),
  buildTerm({
    id: "callsign",
    category: "communications",
    en: { general: "Callsign", professional: "Callsign" },
    de: { general: "Rufname", professional: "Rufname", military: "RUFNAME" },
  }),
  buildTerm({
    id: "connection",
    category: "communications",
    en: { general: "Link", professional: "Link" },
    de: { general: "Verbindung", professional: "Verbindung", military: "VERBINDUNG" },
  }),
  buildTerm({
    id: "relay",
    category: "communications",
    en: { general: "Relay", professional: "Relay" },
    de: { general: "Relais", professional: "Relais", military: "RELAIS" },
  }),
  buildTerm({
    id: "message",
    category: "communications",
    en: { general: "Message", professional: "Message" },
    de: { general: "Nachricht", professional: "Nachricht", military: "NACHRICHT" },
  }),
  buildTerm({
    id: "acknowledged",
    category: "communications",
    en: {
      general: "Acknowledged",
      professional: "Acknowledged",
      military: "ACK",
      full: "Acknowledged",
      acronym: "ACK",
    },
    de: { general: "bestätigt", professional: "bestätigt", military: "BESTÄTIGT", full: "bestätigt / verstanden" },
  }),
  buildTerm({
    id: "no_ack",
    category: "communications",
    en: { general: "No ACK", professional: "No ACK", military: "NO ACK" },
    de: { general: "keine Bestätigung", professional: "keine Bestätigung", military: "KEINE BESTÄTIGUNG" },
  }),
  buildTerm({
    id: "contact_established",
    category: "communications",
    en: { general: "Contact Established", professional: "Contact Established", military: "CONTACT ESTABLISHED" },
    de: { general: "Verbindung hergestellt", professional: "Verbindung hergestellt", military: "VERBINDUNG HERGESTELLT" },
  }),
  buildTerm({
    id: "no_contact",
    category: "communications",
    en: { general: "No Contact", professional: "No Contact", military: "NO CONTACT" },
    de: { general: "keine Verbindung", professional: "keine Verbindung", military: "KEINE VERBINDUNG" },
  }),
  buildTerm({
    id: "link_up",
    category: "communications",
    en: { general: "Link Up", professional: "Link Up", military: "LINK UP" },
    de: { general: "Verbindung steht", professional: "Verbindung steht", military: "VERBINDUNG STEHT" },
  }),
  buildTerm({
    id: "link_down",
    category: "communications",
    en: { general: "Link Down", professional: "Link Down", military: "LINK DOWN" },
    de: { general: "Verbindung ausgefallen", professional: "Verbindung ausgefallen", military: "VERBINDUNG AUSGEFALLEN" },
  }),
  buildTerm({
    id: "lost_comms",
    category: "communications",
    en: { general: "Lost Comms", professional: "Lost Comms", military: "LOST COMMS" },
    de: { general: "Verbindung abgerissen", professional: "Verbindung abgerissen", military: "VERBINDUNG ABGERISSEN" },
  }),
  buildTerm({
    id: "radio_check",
    category: "communications",
    en: { general: "Radio Check", professional: "Radio Check", military: "RADIO CHECK" },
    de: { general: "Verbindungsprüfung", professional: "Verbindungsprüfung", military: "VERBINDUNGSPRÜFUNG" },
  }),
];
