// Semantic terminology model. Terminology is a pure lookup layer: it maps stable
// semantic ids to profile-specific visible labels. It never touches scenario or
// workflow state, and visible text is never used as an identifier or business
// rule input (see docs/konzept/usability/12-terminology.md).

export type Language = "en" | "de";

// The user-facing terminology strength, orthogonal to language and UI density.
export type TerminologySetting = "general" | "professional" | "military" | "spezkr";

// How much information a control surface shows. Independent of terminology.
export type UiDensity = "simple" | "operational" | "full";

// Concrete resolvable profile: language crossed with terminology strength.
export type TerminologyProfile =
  | "en-general"
  | "en-professional"
  | "en-military"
  | "de-general"
  | "de-professional"
  | "de-bundeswehr"
  | "de-spezkr";

export type TermForm = "short" | "full" | "acronym";

export type TermCategory =
  | "command"
  | "situation"
  | "planning"
  | "forces"
  | "communications"
  | "reporting"
  | "training"
  | "medical"
  | "logistics"
  | "status"
  | "time"
  | "location"
  | "safety";

export type TermVariant = {
  short: string;
  full: string;
  acronym?: string;
  // Provenance for specialized profiles (de-spezkr): the public term this short
  // form is derived from. Required so no fictional jargon can be introduced.
  source?: string;
};

export type TacticalTerm = {
  id: string;
  category: TermCategory;
  profiles: Partial<Record<TerminologyProfile, TermVariant>>;
  descriptionKey?: string;
};

export type TacticalPhrase = {
  id: string;
  profiles: Partial<Record<TerminologyProfile, string>>;
};

export type PhraseParams = Record<string, string | number>;

export type MissingTermListener = (id: string, profile: TerminologyProfile) => void;
