import type {
  TacticalPhrase,
  TacticalTerm,
  TermCategory,
  TermVariant,
  TerminologyProfile,
} from "./types";

// Authoring helpers. Term data stays declarative; these functions expand a
// compact seed into the per-profile variant map the resolver consumes. They
// contain no translated text themselves.

export type LocaleForms = {
  // Plain language (general profile).
  general?: string;
  // Operational language (professional profile).
  professional?: string;
  // Joint/NATO short form (en) or concise Bundeswehr form (de).
  military?: string;
  // Full written-out form; defaults to the professional form.
  full?: string;
  acronym?: string;
};

export type SpezkrForm = {
  short: string;
  full?: string;
  // Public source of the concise form. Required so de-spezkr never invents jargon.
  source: string;
};

export type TermSeed = {
  id: string;
  category: TermCategory;
  en: LocaleForms;
  de: LocaleForms;
  spezkr?: SpezkrForm;
  descriptionKey?: string;
};

export type PhraseSeed = {
  id: string;
  en: Partial<Record<TerminologyProfile, string>>;
  de: Partial<Record<TerminologyProfile, string>>;
};

function pick(...values: (string | undefined)[]): string | undefined {
  for (const value of values) if (value && value.trim()) return value;
  return undefined;
}

function variant(short?: string, full?: string, acronym?: string): TermVariant | undefined {
  const resolvedShort = pick(short, full);
  if (!resolvedShort) return undefined;
  const result: TermVariant = {
    short: resolvedShort,
    full: pick(full, short) as string,
  };
  if (acronym && acronym.trim()) result.acronym = acronym;
  return result;
}

export function buildTerm(seed: TermSeed): TacticalTerm {
  const { en, de, spezkr } = seed;
  const profiles: TacticalTerm["profiles"] = {};

  // An acronym is a property of the language, not of the terminology strength:
  // `form: "acronym"` must resolve in the default professional profile too.
  const enGeneral = variant(
    pick(en.general, en.professional, en.military),
    pick(en.full, en.general, en.professional),
    en.acronym,
  );
  const enProfessional = variant(
    pick(en.professional, en.general, en.military),
    pick(en.full, en.professional, en.general),
    en.acronym,
  );
  const enMilitary = variant(
    pick(en.military, en.professional, en.general),
    pick(en.full, en.military, en.professional),
    en.acronym,
  );
  const deGeneral = variant(
    pick(de.general, de.professional, de.military),
    pick(de.full, de.general, de.professional),
    de.acronym,
  );
  const deProfessional = variant(
    pick(de.professional, de.general, de.military),
    pick(de.full, de.professional, de.general),
    de.acronym,
  );
  const deBundeswehr = variant(
    pick(de.military, de.professional, de.general),
    pick(de.full, de.military, de.professional),
    de.acronym,
  );

  if (enGeneral) profiles["en-general"] = enGeneral;
  if (enProfessional) profiles["en-professional"] = enProfessional;
  if (enMilitary) profiles["en-military"] = enMilitary;
  if (deGeneral) profiles["de-general"] = deGeneral;
  if (deProfessional) profiles["de-professional"] = deProfessional;
  if (deBundeswehr) profiles["de-bundeswehr"] = deBundeswehr;
  if (spezkr)
    profiles["de-spezkr"] = {
      short: spezkr.short,
      full: pick(spezkr.full, spezkr.short) as string,
      source: spezkr.source,
    };

  return {
    id: seed.id,
    category: seed.category,
    profiles,
    ...(seed.descriptionKey ? { descriptionKey: seed.descriptionKey } : {}),
  };
}

export function buildPhrase(seed: PhraseSeed): TacticalPhrase {
  const profiles: TacticalPhrase["profiles"] = { ...seed.en, ...seed.de };
  return { id: seed.id, profiles };
}
