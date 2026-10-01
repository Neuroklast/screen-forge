import { phraseById, termById } from "../../i18n/terminology/registry";
import { chainFor } from "./profiles";
import type {
  MissingTermListener,
  PhraseParams,
  TacticalPhrase,
  TermForm,
  TermVariant,
  TerminologyProfile,
} from "./types";

// Turn a semantic id into a readable fallback so a missing entry never renders
// an empty string or a raw id: `common_operational_picture` -> "Common operational picture".
export function humanizeId(id: string): string {
  const spaced = id
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[._-]+/g, " ")
    .trim();
  if (!spaced) return id;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

const FORM_ORDER: Record<TermForm, TermForm[]> = {
  short: ["short", "full"],
  full: ["full", "short"],
  acronym: ["acronym", "short", "full"],
};

function formValue(
  variant: TermVariant,
  form: TermForm,
): string | undefined {
  for (const candidate of FORM_ORDER[form]) {
    const value = variant[candidate];
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

const LANGUAGE_OF_PROFILE: Record<TerminologyProfile, "en" | "de"> = {
  "en-general": "en",
  "en-professional": "en",
  "en-military": "en",
  "de-general": "de",
  "de-professional": "de",
  "de-bundeswehr": "de",
  "de-spezkr": "de",
};

export function resolveTerm(
  id: string,
  profile: TerminologyProfile,
  form: TermForm = "short",
  onMissing?: MissingTermListener,
): string {
  const term = termById.get(id);
  const chain = chainFor(profile);
  let value: string | undefined;
  if (term) {
    for (const candidate of chain) {
      const variant = term.profiles[candidate];
      if (!variant) continue;
      value = formValue(variant, form);
      if (value) break;
    }
  }
  if (!value) {
    // Nothing resolved in any profile: warn and humanize instead of failing.
    onMissing?.(id, profile);
    return humanizeId(id);
  }
  // A German request that only resolved through an English profile is a real
  // translation gap; a same-language fallback (de-spezkr -> de-bundeswehr) is not.
  const requestedLanguage = LANGUAGE_OF_PROFILE[profile];
  const hasSameLanguage = chain.some(
    (candidate) =>
      LANGUAGE_OF_PROFILE[candidate] === requestedLanguage &&
      !!term?.profiles[candidate],
  );
  if (!hasSameLanguage) onMissing?.(id, profile);
  return value;
}

function interpolate(template: string, params?: PhraseParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    String(params[name] ?? `{${name}}`),
  );
}

export function resolvePhrase(
  id: string,
  profile: TerminologyProfile,
  params?: PhraseParams,
  onMissing?: MissingTermListener,
): string {
  const phrase: TacticalPhrase | undefined = phraseById.get(id);
  const chain = chainFor(profile);
  let template: string | undefined;
  if (phrase) {
    for (const candidate of chain) {
      const value = phrase.profiles[candidate];
      if (typeof value === "string" && value.trim()) {
        template = value;
        break;
      }
    }
  }
  if (!template) {
    onMissing?.(id, profile);
    return humanizeId(id);
  }
  const requestedLanguage = LANGUAGE_OF_PROFILE[profile];
  const hasSameLanguage = chain.some(
    (candidate) =>
      LANGUAGE_OF_PROFILE[candidate] === requestedLanguage &&
      !!phrase?.profiles[candidate],
  );
  if (!hasSameLanguage) onMissing?.(id, profile);
  return interpolate(template, params);
}

// Development-only missing-translation sink. Deduplicates so a repeated lookup
// logs once. Callers pass this as `onMissing`; the public API wires it in dev.
const warned = new Set<string>();

export function notifyMissing(id: string, profile: TerminologyProfile): void {
  const key = `${profile}:${id}`;
  if (warned.has(key)) return;
  warned.add(key);
  if (typeof console !== "undefined" && console.warn)
    console.warn(`[terminology] no same-language entry for "${id}" (${profile})`);
}
