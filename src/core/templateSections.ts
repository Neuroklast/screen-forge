import type { MissionDefaults, MissionSections } from "./templates";

// Sectioned template descriptions (docs/konzept/domain/16-team-templates.md §7).
// Each entry explains what a preparation section starts with, so a template is
// transparent before it is loaded. Content only; no scenario payload lives here.
export type MissionTemplateMeta = {
  intent: string;
  sections: MissionSections;
  defaults?: MissionDefaults;
};

export const missionTemplateMeta: Record<string, MissionTemplateMeta> = {
  "eod-disposal": {
    intent: "Train cordon, diagnostics and a controlled disposal decision.",
    sections: {
      environment: "A cordon around a maintenance yard, one camera, one data sheet.",
      assets: "Ordnance console, maintenance terminal, data sheet, camera.",
      flow: "A timed window opens at T+10:00; the console drives the stages.",
      evaluation: "Report cordon, complete diagnostics, disarm the assembly.",
      control: "One timer inject; the assembly stages stay controller-driven.",
    },
    defaults: {
      teamTemplates: ["special-operations", "technical-response"],
      equipmentPacks: ["technical-pack", "protective-equipment", "field-comms"],
    },
  },
  "data-exfiltration": {
    intent: "Train access, controlled copying and a clean withdrawal.",
    sections: {
      environment: "A target area with a camera and one moving element.",
      assets: "Target system, archive terminal, camera, tracking element.",
      flow: "An alarm beat sequences access, copy and withdrawal.",
      evaluation: "Gain access, copy data, leave the area.",
      control: "Alarm and copy beats fire manually from the control cell.",
    },
    defaults: {
      teamTemplates: ["recon-observation", "compact-field"],
      equipmentPacks: ["sensor-pack", "field-comms", "navigation-basic"],
    },
  },
  "beacon-activation": {
    intent: "Train beacon handling and a single decisive objective.",
    sections: {
      environment: "A compact field with one beacon prop and one operator.",
      assets: "Beacon prop and a tracking console.",
      flow: "The beacon state is the whole flow; keep it short.",
      evaluation: "Activate and report the beacon.",
      control: "Manual fire only; the scenario is short by design.",
    },
    defaults: {
      teamTemplates: ["compact-field"],
      equipmentPacks: ["sensor-pack", "navigation-basic"],
    },
  },
  "search-rescue": {
    intent: "Find, stabilise and evacuate a casualty under time pressure.",
    sections: {
      environment: "A search sector with a moving element and one camera.",
      organization: "A compact team with a medic; add a sensor operator for wide areas.",
      assets: "Tracking, medical, camera and terminal consoles.",
      flow: "A deterioration rule fires at T+03:00 unless the casualty is treated.",
      evaluation: "Locate and report the casualty; treatment is the failure path.",
      control: "One conditional timer inject; the rule engine holds the rest.",
    },
    defaults: {
      teamTemplates: ["search-rescue", "compact-field", "medical-response"],
      equipmentPacks: ["search-pack", "medical-basic", "field-comms"],
    },
  },
  "medical-emergency": {
    intent: "Train patient assessment and a timed treatment decision.",
    sections: {
      environment: "A single treatment point with records and no props.",
      organization: "A medical response team; the leader also runs the handover.",
      assets: "Medical console and a records terminal.",
      flow: "The deterioration variant adds a timed worsening inject.",
      evaluation: "Treat the patient; the variant links the inject to that objective.",
    },
    // Medical scenarios do not surface teams, so only equipment is recommended.
    defaults: {
      equipmentPacks: ["medical-advanced", "field-comms"],
    },
  },
  "access-lockdown": {
    intent: "Train gaining access and then holding the area.",
    sections: {
      environment: "An interior zone with a second perimeter in the variant.",
      assets: "Access console, lockdown console and a terminal.",
      flow: "Access then lockdown; the variant adds an outer zone.",
      evaluation: "Gain access and secure the area.",
      control: "Manual transitions; no timing pressure by default.",
    },
    defaults: {
      teamTemplates: ["compact-field", "technical-response"],
      equipmentPacks: ["technical-pack", "field-comms"],
    },
  },
  "milsim-skirmish": {
    intent: "Run a two-sided field exercise around one shared objective.",
    sections: {
      environment: "An open field with both teams tracked live.",
      organization: "Two field teams of equal size keep the exercise balanced.",
      assets: "Tracking consoles only.",
      flow: "No timed injects; the controllers steer the exercise.",
      evaluation: "One shared objective, scored on reporting discipline.",
      control: "Fully manual: the control cell fires every event.",
    },
    defaults: {
      teamTemplates: ["compact-field", "special-operations"],
      equipmentPacks: ["field-comms", "navigation-basic"],
    },
  },
  "film-playback": {
    intent: "Build a repeatable screen sequence for a take.",
    sections: {
      environment: "Playback mode, one stage, no field movement.",
      assets: "The screens the take needs; add props for hand interaction.",
      flow: "A linear sequence with explicit failure beats.",
      evaluation: "Not scored; the goal is repeatability for the shot.",
      control: "The sequence is started manually and runs itself.",
    },
    // Film playback does not surface teams, so only equipment is recommended.
    defaults: {
      equipmentPacks: ["command-pack"],
    },
  },
  "relay-recovery": {
    intent: "Train restoring a degraded data link under time pressure.",
    sections: {
      environment: "A relay site with two operators and one terminal.",
      organization: "Two operators: one at the relay, one on the link.",
      assets: "Relay terminal and two tracking elements.",
      flow: "A link-degrade event, an extra release and a time window.",
      evaluation: "Restore the link and report the recovery.",
      control: "Three MEL events, all controller-fired.",
    },
    defaults: {
      teamTemplates: ["technical-response", "compact-field"],
      equipmentPacks: ["technical-pack", "field-comms"],
    },
  },
  "device-link": {
    intent: "Prove a device link end to end, including diagnostics.",
    sections: {
      environment: "A bench setup; no map movement.",
      assets: "Device console with a linked workflow.",
      flow: "A linear link sequence: link, code, limit, lockout, diagnostics.",
      evaluation: "One objective: the device reports ready.",
      control: "Manual only; this is a verification scenario.",
    },
    defaults: {
      teamTemplates: ["technical-response"],
      equipmentPacks: ["technical-pack"],
    },
  },
  "secure-transfer": {
    intent: "Run a controlled data transfer with integrity beats.",
    sections: {
      environment: "Playback-friendly setup with a single transfer console.",
      assets: "Transfer terminal and a command station.",
      flow: "Login, warning and transfer beats, all manual.",
      evaluation: "Transfer completes with integrity intact.",
      control: "Manual beats; no timing pressure.",
    },
    defaults: {
      teamTemplates: ["command-cell", "compact-field"],
      equipmentPacks: ["command-pack", "field-comms"],
    },
  },
  "distributed-command": {
    intent: "Train a multi-role incident with conflicting information.",
    sections: {
      environment: "A command cell, a hazard area and one moving element.",
      organization: "A command cell plus a medic and a comms operator.",
      assets: "Tracking, comms, medical and access consoles.",
      flow: "Five MEL events: source conflict, link degrade, casualty, hazard, handover.",
      evaluation: "Common picture confirmed, then a structured handover.",
      control: "Mixed triggers: timers, a zone, and manual releases.",
    },
    defaults: {
      teamTemplates: ["command-cell", "medical-response", "compact-field"],
      equipmentPacks: ["command-pack", "field-comms", "medical-basic"],
    },
  },
};
