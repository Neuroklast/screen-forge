import type { PrepSection } from "../readiness";

// Maps the fixed preparation information-architecture sections to semantic
// navigation term ids. Section ids remain the identifiers; only the visible
// label is resolved through the terminology layer.
export const SECTION_TERM: Record<PrepSection | "live", string> = {
  overview: "nav.overview",
  scenario: "nav.mission",
  participants: "nav.forces",
  devices: "nav.assets",
  flow: "nav.flow",
  review: "nav.review",
  live: "nav.live",
};

export function sectionTermId(section: PrepSection | "live"): string {
  return SECTION_TERM[section];
}
