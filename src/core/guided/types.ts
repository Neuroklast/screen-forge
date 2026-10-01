import { z } from "zod";
import type { ScenarioType } from "../capabilities.ts";
import type { Scenario } from "../training.ts";
import type { ScenarioOperation } from "./operations.ts";

// Operation payloads are declared next to the operation layer; re-exported here
// so packs and the engine read one type vocabulary.
export type { ScenarioOperation } from "./operations.ts";

// Guided authoring layer: pure data and schemas. The engine derives facts,
// questions, suggestions and reconciliation plans from the scenario plus the
// persisted guided session. Nothing here touches React, sockets or clocks.
export const guidedDomains = [
  "search-rescue",
  "medical",
  "technical",
  "disposal",
  "film",
  "free",
] as const;
export type GuidedDomain = (typeof guidedDomains)[number];

// Short tokens keep generated ids inside the 40 character id budget.
export const guidedDomainTokens: Record<GuidedDomain, string> = {
  "search-rescue": "sar",
  medical: "med",
  technical: "tech",
  disposal: "eod",
  film: "film",
  free: "free",
};

// The coarse scenario type a domain selects when the user starts a guided
// session. This is an explicit one-time transition, never a continuous
// derivation from the active domain packs.
export const guidedDomainScenarioType: Record<GuidedDomain, ScenarioType> = {
  "search-rescue": "sar",
  medical: "medical",
  technical: "technical",
  disposal: "disposal",
  film: "film",
  free: "custom",
};

export const generatedMetaSchema = z.object({
  source: z.literal("guided").default("guided"),
  ruleId: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{1,60}$/)
    .max(60),
  subjectKey: z.string().max(40).default(""),
  userModified: z.boolean().default(false),
});
export type GeneratedMeta = z.infer<typeof generatedMetaSchema>;

export const factValueSchema = z.union([
  z.boolean(),
  z.number().finite(),
  z.string().max(120),
]);
export type FactValue = z.infer<typeof factValueSchema>;
export type GuidedFacts = Readonly<Record<string, FactValue>>;

export const guidedIntentSchema = z.object({
  primaryDomain: z.enum(guidedDomains),
  enabledDomains: z.array(z.enum(guidedDomains)).max(8).default([]),
  goal: z.string().max(200).default(""),
});
export type GuidedIntent = z.infer<typeof guidedIntentSchema>;

export const guidedAnswerSchema = z.object({
  questionId: z.string().max(60),
  optionIds: z.array(z.string().max(60)).max(20),
});

// Persisted state of the interview. Derived facts are never stored; they are
// recomputed from answers + explicitFacts on every load.
export const guidedSessionSchema = z.object({
  version: z.literal(1),
  intent: guidedIntentSchema,
  answers: z
    .record(z.string().max(60), z.array(z.string().max(60)).max(20))
    .default({}),
  explicitFacts: z.record(z.string().max(60), factValueSchema).default({}),
  accepted: z.array(z.string().max(200)).max(200).default([]),
  dismissed: z.array(z.string().max(200)).max(200).default([]),
  applied: z
    .array(
      z.object({
        suggestionId: z.string().max(200),
        ruleId: z.string().max(60),
        refs: z.array(z.string().max(80)).max(50),
      }),
    )
    .default([]),
});
export type GuidedSession = z.infer<typeof guidedSessionSchema>;

export type GuidedPriority = "blocking" | "structural" | "useful" | "optional";

export const guidedPriorityRank: Record<GuidedPriority, number> = {
  blocking: 0,
  structural: 1,
  useful: 2,
  optional: 3,
};

export type FactEffect = { fact: string; value: FactValue };
export type GuidedOption = {
  id: string;
  labelKey: string;
  effects: readonly FactEffect[];
};
export type GuidedQuestion = {
  id: string;
  domain: GuidedDomain;
  // Questions sharing a group render as one decision card.
  group: string;
  labelKey: string;
  priority: GuidedPriority;
  dependsOn: readonly string[];
  appliesWhen: (facts: GuidedFacts) => boolean;
  // Optional scenario-level gate, for questions whose answer only makes sense
  // when the scenario can show the result (e.g. teams when the capability is off).
  appliesToScenario?: (scenario: Scenario) => boolean;
  isAnswered?: (session: GuidedSession) => boolean;
  options: readonly GuidedOption[];
  multi?: boolean;
};

export type SuggestionReason = {
  key: string;
  params?: Readonly<Record<string, string | number>>;
};

export type Suggestion = {
  id: string;
  ruleId: string;
  subjectKey: string;
  reason: SuggestionReason;
  operations: readonly ScenarioOperation[];
};

export type GuidedContext = Readonly<{
  scenario: Scenario;
  session: GuidedSession;
  facts: GuidedFacts;
  packs: readonly DomainPack[];
}>;

export type GuidedRule = {
  id: string;
  domain: GuidedDomain;
  dependsOn: readonly string[];
  evaluate: (ctx: GuidedContext) => readonly Suggestion[];
};

export type DomainPack = {
  id: GuidedDomain;
  token: string;
  scenarioType: ScenarioType;
  questions: readonly GuidedQuestion[];
  rules: readonly GuidedRule[];
};

export type EntityCollection =
  | "stations"
  | "patients"
  | "props"
  | "teams"
  | "actors"
  | "zones"
  | "objectives"
  | "dossiers";

export type ApplyResult =
  | { ok: true; scenario: Scenario; refs: string[] }
  | { ok: false; error: string };

export type SuggestionConflict = {
  id: string;
  suggestionIds: string[];
  reason: string;
};

export type QuestionCard = {
  id: string;
  priority: GuidedPriority;
  questions: GuidedQuestion[];
};

export type MissingInfo = { questionId: string; priority: GuidedPriority };

// "<collection>:<id>" for entities, "nodes:<workflowId>/<nodeId>" for nodes,
// "workflows:<id>" and "injects:<id>" for whole graphs and events.
export type ElementRef = string;

export type ReconcileResult = {
  keep: ElementRef[];
  add: Suggestion[];
  remove: { ref: ElementRef; ruleId: string }[];
  conflicts: {
    ref: ElementRef;
    ruleId: string;
    reason: "modified" | "referenced" | "invalid";
  }[];
};
