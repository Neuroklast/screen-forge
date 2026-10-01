import { lintMission } from "./missionLint";
import type { Scenario } from "./training";

// One readiness model for preparation. Each section reports complete / warning /
// blocking; Overview derives the next recommended action from it and the guided
// setup routes to the first incomplete section instead of a fixed tab.
export type Readiness = "complete" | "warning" | "blocking";
export type PrepSection =
  | "overview"
  | "scenario"
  | "participants"
  | "devices"
  | "flow"
  | "review";

export const PREP_SECTIONS: PrepSection[] = [
  "overview",
  "scenario",
  "participants",
  "devices",
  "flow",
  "review",
];

const SECTION_OF: Record<string, PrepSection> = {
  stations: "devices",
  props: "devices",
  patients: "participants",
  teams: "participants",
  actors: "participants",
  dossiers: "participants",
  zones: "scenario",
  objectives: "scenario",
  workflows: "flow",
  injects: "flow",
};

export function prepareReadiness(
  scenario: Scenario,
): Record<PrepSection, Readiness> {
  const findings = lintMission(scenario);
  const result: Record<PrepSection, Readiness> = {
    overview: "complete",
    scenario: "complete",
    participants: "complete",
    devices: "complete",
    flow: "complete",
    review: "complete",
  };
  for (const finding of findings) {
    const section = SECTION_OF[finding.path.collection] ?? "scenario";
    if (finding.severity === "error") result[section] = "blocking";
    else if (finding.severity === "warning" && result[section] !== "blocking")
      result[section] = "warning";
  }
  const errors = findings.filter((finding) => finding.severity === "error");
  result.review = errors.length
    ? "blocking"
    : findings.some((finding) => finding.severity === "warning")
      ? "warning"
      : "complete";
  if (!scenario.name.trim()) result.scenario = "blocking";
  if (scenario.stations.length === 0) result.devices = "blocking";
  if (scenario.workflows.length === 0 && result.flow === "complete")
    result.flow = "warning";
  return result;
}

// First section that is not complete, in reading order. Falls back to review,
// which owns the final validation and the start action.
export function nextIncomplete(
  readiness: Record<PrepSection, Readiness>,
  order: PrepSection[] = PREP_SECTIONS,
): PrepSection {
  for (const section of order) {
    if (section === "overview" || section === "review") continue;
    if (readiness[section] !== "complete") return section;
  }
  return "review";
}
