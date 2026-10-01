import { defaultCallsignScheme, type CallsignScheme } from "./callsigns";
import { t } from "../i18n";

// Team templates (docs/konzept/domain/16-team-templates.md). A template is a
// starting composition, not doctrine: sizes are "ScreenForge recommended", and
// a compact core plus optional attachments replaces dozens of fixed variants.
export type TeamRoleSlot = {
  roleId: string;
  min: number;
  recommended: number;
  max: number;
  required: boolean;
  capabilityTags: string[];
};

export const teamTemplateCategories = [
  "field",
  "special-operations",
  "recon",
  "search-rescue",
  "medical",
  "technical",
  "command",
  "exercise-control",
  "custom",
] as const;
export type TeamTemplateCategory = (typeof teamTemplateCategories)[number];

export type TeamTemplate = {
  id: string;
  label: string;
  category: TeamTemplateCategory;
  doctrineProfile: "generic" | "nato" | "bundeswehr" | "custom";
  size: { min: number; recommended: number; max: number };
  roles: TeamRoleSlot[];
  optionalAttachments: TeamRoleSlot[];
  callsignScheme?: CallsignScheme;
  equipmentPacks?: string[];
  tags: string[];
};

function slot(
  roleId: string,
  recommended = 1,
  required = true,
  capabilityTags: string[] = [],
): TeamRoleSlot {
  return {
    roleId,
    min: required ? 1 : 0,
    recommended,
    max: Math.max(recommended, 1) + 1,
    required,
    capabilityTags,
  };
}

// The shared optional-attachment list: a small core can be reinforced for the
// mission instead of forking a template.
export const standardAttachments: TeamRoleSlot[] = [
  slot("medical", 1, false, ["medical"]),
  slot("communications", 1, false, ["communications"]),
  slot("sensor_operator", 1, false, ["sensor"]),
  slot("interpreter", 1, false, ["language"]),
  slot("k9_handler", 1, false, ["search"]),
  slot("technical", 1, false, ["technical"]),
  slot("liaison", 1, false, ["liaison"]),
  slot("driver", 1, false, ["mobility"]),
];

export const teamTemplates: TeamTemplate[] = [
  {
    id: "compact-field",
    label: "Compact Field Team",
    category: "field",
    doctrineProfile: "generic",
    size: { min: 3, recommended: 4, max: 8 },
    roles: [
      slot("team_leader", 1, true, ["command"]),
      slot("communications", 1, true, ["communications", "navigation"]),
      slot("medical", 1, true, ["medical"]),
      slot("technical", 1, true, ["technical"]),
    ],
    optionalAttachments: standardAttachments,
    callsignScheme: defaultCallsignScheme,
    equipmentPacks: ["field-comms", "navigation-basic", "medical-basic"],
    tags: ["field", "balanced"],
  },
  {
    id: "special-operations",
    label: "Special Operations Team",
    category: "special-operations",
    doctrineProfile: "generic",
    size: { min: 4, recommended: 4, max: 8 },
    roles: [
      slot("team_leader", 1, true, ["command"]),
      slot("communications", 1, true, ["communications"]),
      slot("medical", 1, true, ["medical"]),
      slot("sensor_operator", 1, true, ["sensor"]),
    ],
    optionalAttachments: standardAttachments,
    callsignScheme: defaultCallsignScheme,
    equipmentPacks: ["field-comms", "medical-advanced", "sensor-pack"],
    tags: ["special-operations", "compact-core"],
  },
  {
    id: "sf-detachment",
    label: "SF Detachment Style",
    category: "special-operations",
    doctrineProfile: "nato",
    size: { min: 8, recommended: 12, max: 16 },
    roles: [
      slot("team_leader", 1, true, ["command"]),
      slot("deputy_leader", 1, true, ["command"]),
      slot("operations", 1, true, ["planning"]),
      slot("intelligence", 1, true, ["information"]),
      slot("communications", 2, true, ["communications"]),
      slot("medical", 2, true, ["medical"]),
      slot("technical", 2, true, ["technical"]),
      slot("observer", 2, true, ["observation"]),
    ],
    optionalAttachments: standardAttachments,
    callsignScheme: defaultCallsignScheme,
    equipmentPacks: ["field-comms", "medical-advanced", "sensor-pack", "mobility-pack"],
    tags: ["special-operations", "large"],
  },
  {
    id: "recon-observation",
    label: "Recon / Observation Team",
    category: "recon",
    doctrineProfile: "generic",
    size: { min: 4, recommended: 5, max: 6 },
    roles: [
      slot("team_leader", 1, true, ["command"]),
      slot("observer", 1, true, ["observation"]),
      slot("communications", 1, true, ["communications"]),
      slot("sensor_operator", 1, true, ["sensor"]),
      slot("medical", 1, false, ["medical"]),
    ],
    optionalAttachments: standardAttachments,
    callsignScheme: defaultCallsignScheme,
    equipmentPacks: ["observation-pack", "field-comms", "sensor-pack"],
    tags: ["recon", "observation"],
  },
  {
    id: "search-rescue",
    label: "Search & Rescue Team",
    category: "search-rescue",
    doctrineProfile: "generic",
    size: { min: 4, recommended: 5, max: 6 },
    roles: [
      slot("team_leader", 1, true, ["command"]),
      slot("observer", 1, true, ["search", "observation"]),
      slot("medical", 1, true, ["medical"]),
      slot("communications", 1, true, ["communications"]),
      slot("technical", 1, false, ["technical"]),
    ],
    optionalAttachments: standardAttachments,
    callsignScheme: defaultCallsignScheme,
    equipmentPacks: ["search-pack", "medical-basic", "field-comms"],
    tags: ["search-rescue"],
  },
  {
    id: "medical-response",
    label: "Medical Response Team",
    category: "medical",
    doctrineProfile: "generic",
    size: { min: 3, recommended: 4, max: 6 },
    roles: [
      slot("team_leader", 1, true, ["command"]),
      slot("medical", 2, true, ["medical"]),
      slot("communications", 1, true, ["communications"]),
      slot("logistics", 1, false, ["logistics"]),
    ],
    optionalAttachments: standardAttachments,
    callsignScheme: defaultCallsignScheme,
    equipmentPacks: ["medical-advanced", "field-comms"],
    tags: ["medical"],
  },
  {
    id: "technical-response",
    label: "Technical Response Team",
    category: "technical",
    doctrineProfile: "generic",
    size: { min: 3, recommended: 4, max: 5 },
    roles: [
      slot("team_leader", 1, true, ["command"]),
      slot("technical", 1, true, ["technical"]),
      slot("sensor_operator", 1, true, ["sensor"]),
      slot("safety", 1, true, ["safety"]),
      slot("communications", 1, false, ["communications"]),
    ],
    optionalAttachments: standardAttachments,
    callsignScheme: defaultCallsignScheme,
    equipmentPacks: ["technical-pack", "sensor-pack", "protective-equipment"],
    tags: ["technical"],
  },
  {
    id: "command-cell",
    label: "Command / HQ Cell",
    category: "command",
    doctrineProfile: "generic",
    size: { min: 4, recommended: 6, max: 8 },
    roles: [
      slot("team_leader", 1, true, ["command"]),
      slot("operations", 1, true, ["planning"]),
      slot("intelligence", 1, true, ["information"]),
      slot("communications", 1, true, ["communications"]),
      slot("logistics", 1, false, ["logistics"]),
      slot("liaison", 1, false, ["liaison"]),
    ],
    optionalAttachments: standardAttachments,
    callsignScheme: defaultCallsignScheme,
    equipmentPacks: ["command-pack", "field-comms"],
    tags: ["command", "hq"],
  },
  {
    id: "exercise-control",
    label: "Exercise Control Cell",
    category: "exercise-control",
    doctrineProfile: "generic",
    size: { min: 4, recommended: 6, max: 8 },
    roles: [
      slot("controller", 1, true, ["control"]),
      slot("observer_controller", 1, true, ["evaluation"]),
      slot("simulation_operator", 1, true, ["simulation"]),
      slot("safety", 1, true, ["safety"]),
      slot("operations", 1, true, ["planning"]),
      slot("technical", 1, false, ["technical"]),
    ],
    optionalAttachments: standardAttachments,
    callsignScheme: { ...defaultCallsignScheme, root: "ATLAS" },
    equipmentPacks: ["excon-pack", "field-comms"],
    tags: ["exercise-control", "excon"],
  },
];

export function teamTemplate(id: string): TeamTemplate | undefined {
  return teamTemplates.find((template) => template.id === id);
}

// Resolves through the i18n layer (German labels live in the dictionaries).
export function teamTemplateLabel(id: string): string {
  return teamTemplate(id) ? t(`teamTemplate.${id}`) : id;
}

// Total recommended staffing of a template (the "core" the user sees).
export function recommendedStaffing(template: TeamTemplate): number {
  return template.roles.reduce((sum, role) => sum + role.recommended, 0);
}

const RECOMMENDED: Record<string, string[]> = {
  disposal: ["special-operations", "technical-response", "command-cell"],
  medical: ["medical-response", "search-rescue", "command-cell"],
  sar: ["search-rescue", "compact-field", "recon-observation"],
  technical: ["technical-response", "compact-field", "command-cell"],
  film: ["compact-field", "command-cell", "recon-observation"],
  field: ["compact-field", "recon-observation", "command-cell"],
  custom: ["compact-field", "command-cell", "medical-response"],
};

export function splitTeamTemplates(
  scenarioType: string,
): { recommended: TeamTemplate[]; more: TeamTemplate[] } {
  const ranked = (RECOMMENDED[scenarioType] ?? [])
    .map((id) => teamTemplate(id))
    .filter((template): template is TeamTemplate => !!template);
  const recommended = ranked.length ? ranked : teamTemplates.slice(0, 3);
  return {
    recommended,
    more: teamTemplates.filter((template) => !recommended.includes(template)),
  };
}
