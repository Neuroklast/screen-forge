// Team role catalog (docs/konzept/domain/16-team-templates.md). Roles are defined
// once and reused by every team template — a template never invents its own
// roles. A role is not a person and not a qualification: a person has a primary
// role plus zero or more qualifications.
import { t } from "../i18n";

export const teamRoleCategories = [
  "leadership",
  "information",
  "communications",
  "medical",
  "technical",
  "reconnaissance",
  "special",
  "support",
  "exercise",
] as const;
export type TeamRoleCategory = (typeof teamRoleCategories)[number];

export type TeamRole = {
  id: string;
  label: string;
  category: TeamRoleCategory;
  capabilityTags: string[];
};

export const teamRoles: TeamRole[] = [
  { id: "team_leader", label: "Team Leader", category: "leadership", capabilityTags: ["command", "communications"] },
  { id: "deputy_leader", label: "Deputy Team Leader", category: "leadership", capabilityTags: ["command", "communications"] },
  { id: "senior_nco", label: "Senior NCO", category: "leadership", capabilityTags: ["command"] },
  { id: "operations", label: "Operations Specialist", category: "leadership", capabilityTags: ["planning"] },
  { id: "intelligence", label: "Intelligence Specialist", category: "information", capabilityTags: ["information"] },
  { id: "communications", label: "Communications Specialist", category: "communications", capabilityTags: ["communications", "navigation"] },
  { id: "medical", label: "Medical Specialist", category: "medical", capabilityTags: ["medical"] },
  { id: "technical", label: "Technical Specialist", category: "technical", capabilityTags: ["technical"] },
  { id: "engineering", label: "Engineering Specialist", category: "technical", capabilityTags: ["technical", "mobility"] },
  { id: "observer", label: "Observation Specialist", category: "reconnaissance", capabilityTags: ["observation"] },
  { id: "sensor_operator", label: "Sensor Operator", category: "reconnaissance", capabilityTags: ["sensor"] },
  { id: "uas_operator", label: "UAS Operator", category: "reconnaissance", capabilityTags: ["sensor", "air"] },
  { id: "k9_handler", label: "K9 Handler", category: "special", capabilityTags: ["search"] },
  { id: "interpreter", label: "Interpreter", category: "support", capabilityTags: ["language"] },
  { id: "driver", label: "Driver", category: "support", capabilityTags: ["mobility"] },
  { id: "logistics", label: "Logistics Specialist", category: "support", capabilityTags: ["logistics"] },
  { id: "liaison", label: "Liaison", category: "leadership", capabilityTags: ["communications", "liaison"] },
  { id: "safety", label: "Safety Officer", category: "exercise", capabilityTags: ["safety"] },
  { id: "controller", label: "Exercise Controller", category: "exercise", capabilityTags: ["control"] },
  { id: "observer_controller", label: "Observer / Controller", category: "exercise", capabilityTags: ["evaluation"] },
  { id: "simulation_operator", label: "Simulation Operator", category: "exercise", capabilityTags: ["simulation"] },
];

export function teamRole(id: string): TeamRole | undefined {
  return teamRoles.find((role) => role.id === id);
}

// Resolves through the i18n layer (German labels live in the dictionaries, not
// in core data).
export function teamRoleLabel(id: string): string {
  return teamRole(id) ? t(`role.${id}`) : id;
}
