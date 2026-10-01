import type { TacticalPhrase, TacticalTerm } from "../../core/terminology/types";
import { tacticalPhrases } from "./phrases";
import { allTerms } from "./terms";

// Single source of truth for the semantic dictionary. The resolver reads these
// maps; nothing else may re-declare term ids or labels.
export const terms: TacticalTerm[] = allTerms;
export const phrases: TacticalPhrase[] = tacticalPhrases;

export const termById: ReadonlyMap<string, TacticalTerm> = new Map(
  terms.map((term) => [term.id, term]),
);
export const phraseById: ReadonlyMap<string, TacticalPhrase> = new Map(
  phrases.map((phrase) => [phrase.id, phrase]),
);
