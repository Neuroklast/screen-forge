import { phrases, terms } from "../../i18n/terminology/registry";
import { SECTION_TERM } from "./nav";
import { PROFILES } from "./profiles";
import type { TermCategory, TerminologyProfile } from "./types";

const CATEGORIES: readonly TermCategory[] = [
  "command",
  "situation",
  "planning",
  "forces",
  "communications",
  "reporting",
  "training",
  "medical",
  "logistics",
  "status",
  "time",
  "location",
  "safety",
];

// Control, navigation and status terms that MUST carry an explicit Bundeswehr
// entry; specialized terms may fall back to the professional form.
const CRITICAL_TERM_IDS: readonly string[] = [
  "mission",
  "situation",
  "exercise_control",
  "after_action_review",
  "common_operational_picture",
  "nav.overview",
  "nav.mission",
  "nav.forces",
  "nav.assets",
  "nav.flow",
  "nav.review",
  "nav.live",
  "ready",
  "not_ready",
  "offline",
  "online",
];

export type TerminologyIssue = {
  level: "error" | "warning";
  id: string;
  message: string;
};

function hasEnglish(profiles: Record<string, unknown>): boolean {
  return Object.keys(profiles).some((profile) => profile.startsWith("en-"));
}

function hasGerman(profiles: Record<string, unknown>): boolean {
  return Object.keys(profiles).some((profile) => profile.startsWith("de-"));
}

// Static integrity check over the semantic dictionary. Returns [] when clean.
export function validateTerminology(): TerminologyIssue[] {
  const issues: TerminologyIssue[] = [];
  const seenTerms = new Set<string>();
  const seenPhrases = new Set<string>();

  for (const term of terms) {
    if (seenTerms.has(term.id))
      issues.push({ level: "error", id: term.id, message: "duplicate term id" });
    seenTerms.add(term.id);

    if (!CATEGORIES.includes(term.category))
      issues.push({
        level: "error",
        id: term.id,
        message: `invalid category "${term.category}"`,
      });

    if (!term.profiles["en-general"])
      issues.push({
        level: "error",
        id: term.id,
        message: "missing English default (en-general)",
      });

    for (const [profile, variant] of Object.entries(term.profiles)) {
      if (!(PROFILES as readonly string[]).includes(profile))
        issues.push({
          level: "error",
          id: term.id,
          message: `invalid profile "${profile}"`,
        });
      if (!variant) continue;
      if (!variant.short.trim() || !variant.full.trim())
        issues.push({
          level: "error",
          id: term.id,
          message: `empty label for ${profile}`,
        });
      if (variant.acronym !== undefined && !variant.acronym.trim())
        issues.push({
          level: "error",
          id: term.id,
          message: `empty acronym for ${profile}`,
        });
      if (profile === "de-spezkr" && !variant.source?.trim())
        issues.push({
          level: "error",
          id: term.id,
          message: "de-spezkr entry without a public source",
        });
    }
  }

  for (const phrase of phrases) {
    if (seenPhrases.has(phrase.id))
      issues.push({
        level: "error",
        id: phrase.id,
        message: "duplicate phrase id",
      });
    seenPhrases.add(phrase.id);

    if (!hasEnglish(phrase.profiles as Record<string, unknown>))
      issues.push({
        level: "error",
        id: phrase.id,
        message: "missing English default",
      });
    if (!hasGerman(phrase.profiles as Record<string, unknown>))
      issues.push({
        level: "warning",
        id: phrase.id,
        message: "no German entry",
      });
    for (const [profile, template] of Object.entries(phrase.profiles)) {
      if (!(PROFILES as readonly string[]).includes(profile))
        issues.push({
          level: "error",
          id: phrase.id,
          message: `invalid profile "${profile}"`,
        });
      if (!template) continue;
      const opens = (template.match(/\{/g) ?? []).length;
      const closes = (template.match(/\}/g) ?? []).length;
      if (opens !== closes)
        issues.push({
          level: "error",
          id: phrase.id,
          message: "unbalanced parameter braces",
        });
    }
  }

  for (const id of CRITICAL_TERM_IDS) {
    const term = terms.find((candidate) => candidate.id === id);
    if (!term) {
      issues.push({
        level: "error",
        id,
        message: "critical term is missing",
      });
      continue;
    }
    if (!term.profiles["de-bundeswehr"])
      issues.push({
        level: "error",
        id,
        message: "critical term lacks a de-bundeswehr entry",
      });
  }

  for (const [section, id] of Object.entries(SECTION_TERM)) {
    if (!terms.some((term) => term.id === id))
      issues.push({
        level: "error",
        id,
        message: `navigation section "${section}" references an unknown term`,
      });
  }

  return issues;
}

export function assertTerminologyValid(): void {
  const issues = validateTerminology().filter((issue) => issue.level === "error");
  if (issues.length)
    throw new Error(
      `terminology validation failed:\n${issues
        .map((issue) => `- ${issue.id}: ${issue.message}`)
        .join("\n")}`,
    );
}
