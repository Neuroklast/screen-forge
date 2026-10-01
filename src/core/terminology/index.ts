import { getLocale } from "../../i18n";
import { profileFor } from "./profiles";
import { notifyMissing, resolvePhrase, resolveTerm } from "./resolve";
import { getTerminology } from "./settings";
import type { PhraseParams, TermForm, TerminologyProfile } from "./types";
import { validateTerminology } from "./validate";

// Public terminology API. Components and phrase helpers address labels by stable
// semantic id; the active profile is derived from language + terminology.

export type TermOptions = {
  form?: TermForm;
  profile?: TerminologyProfile;
};

function activeProfile(explicit?: TerminologyProfile): TerminologyProfile {
  return explicit ?? profileFor(getLocale(), getTerminology());
}

const isDev =
  typeof import.meta !== "undefined" && !!import.meta.env?.DEV;

// Surface dictionary defects during development instead of shipping them.
if (isDev) {
  const errors = validateTerminology().filter(
    (issue) => issue.level === "error",
  );
  if (errors.length)
    console.error(
      `[terminology] ${errors.length} validation error(s)`,
      errors,
    );
}

export function term(id: string, options?: TermOptions): string {
  return resolveTerm(
    id,
    activeProfile(options?.profile),
    options?.form ?? "short",
    isDev ? notifyMissing : undefined,
  );
}

export function termPhrase(id: string, params?: PhraseParams): string {
  return resolvePhrase(
    id,
    activeProfile(),
    params,
    isDev ? notifyMissing : undefined,
  );
}

export { humanizeId } from "./resolve";
export { profileFor, chainFor, PROFILES } from "./profiles";
export {
  getDensity,
  setDensity,
  getTerminology,
  setTerminology,
  subscribePreferences,
  preferencesSnapshot,
  DEFAULT_DENSITY,
  DEFAULT_TERMINOLOGY,
} from "./settings";
export { sectionTermId, SECTION_TERM } from "./nav";
export { validateTerminology } from "./validate";
export type {
  Language,
  PhraseParams,
  TacticalPhrase,
  TacticalTerm,
  TermCategory,
  TermForm,
  TerminologyProfile,
  TerminologySetting,
  UiDensity,
} from "./types";
