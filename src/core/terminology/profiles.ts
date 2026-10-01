import type {
  Language,
  TerminologyProfile,
  TerminologySetting,
} from "./types";

// All resolvable profiles. Order matters for validation and documentation.
export const PROFILES: readonly TerminologyProfile[] = [
  "en-general",
  "en-professional",
  "en-military",
  "de-general",
  "de-professional",
  "de-bundeswehr",
  "de-spezkr",
] as const;

// A profile's immediate parent. `null` means the profile is a language base.
const PARENT: Record<TerminologyProfile, TerminologyProfile | null> = {
  "en-general": null,
  "en-professional": "en-general",
  "en-military": "en-professional",
  "de-general": null,
  "de-professional": "de-general",
  "de-bundeswehr": "de-professional",
  "de-spezkr": "de-bundeswehr",
};

const LANGUAGE_OF: Record<TerminologyProfile, Language> = {
  "en-general": "en",
  "en-professional": "en",
  "en-military": "en",
  "de-general": "de",
  "de-professional": "de",
  "de-bundeswehr": "de",
  "de-spezkr": "de",
};

const PROFESSIONAL: Record<Language, TerminologyProfile> = {
  en: "en-professional",
  de: "de-professional",
};

const GENERAL: Record<Language, TerminologyProfile> = {
  en: "en-general",
  de: "de-general",
};

// Resolution order from the spec: requested profile -> parent -> same-language
// professional -> same-language general -> en-professional -> en-general.
// Duplicates are removed while preserving first-seen order.
export function chainFor(profile: TerminologyProfile): TerminologyProfile[] {
  const chain: TerminologyProfile[] = [];
  const push = (next: TerminologyProfile | null) => {
    if (next && !chain.includes(next)) chain.push(next);
  };
  push(profile);
  push(PARENT[profile]);
  const language = LANGUAGE_OF[profile];
  push(PROFESSIONAL[language]);
  push(GENERAL[language]);
  push("en-professional");
  push("en-general");
  return chain;
}

// The concrete profile for the current language + terminology settings.
export function profileFor(
  language: Language,
  terminology: TerminologySetting,
): TerminologyProfile {
  if (language === "en") {
    if (terminology === "general") return "en-general";
    if (terminology === "military") return "en-military";
    // "professional" and "spezkr" (no distinct public EN profile) -> military.
    return terminology === "spezkr" ? "en-military" : "en-professional";
  }
  if (terminology === "general") return "de-general";
  if (terminology === "military") return "de-bundeswehr";
  if (terminology === "spezkr") return "de-spezkr";
  return "de-professional";
}

export function isTerminologyProfile(value: string): value is TerminologyProfile {
  return (PROFILES as readonly string[]).includes(value);
}

export function isLanguage(value: string): value is Language {
  return value === "en" || value === "de";
}

export function isTerminologySetting(
  value: string,
): value is TerminologySetting {
  return (
    value === "general" ||
    value === "professional" ||
    value === "military" ||
    value === "spezkr"
  );
}

export function isUiDensity(value: string): value is import("./types").UiDensity {
  return value === "simple" || value === "operational" || value === "full";
}
