import { deriveFacts, isAnswered } from "./facts.ts";
import { applyOperations } from "./operations.ts";
import { domainPacks, packsForIntent } from "./domains/registry.ts";
import {
  guidedPriorityRank,
  type DomainPack,
  type GuidedContext,
  type GuidedQuestion,
  type GuidedSession,
  type MissingInfo,
  type QuestionCard,
  type ScenarioOperation,
  type Suggestion,
  type SuggestionConflict,
} from "./types.ts";

// The guided engine is a pure projection: scenario + session in, derived facts,
// questions, suggestions and conflicts out. Rules never mutate and never see
// each other's output; every rule evaluates the same immutable snapshot.

export function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>))
      deepFreeze(child);
  }
  return value;
}

export function contextFor(
  scenario: GuidedContext["scenario"],
  session: GuidedSession,
  registry: readonly DomainPack[] = domainPacks,
): GuidedContext {
  const packs = packsForIntent(session.intent, registry);
  const facts = deriveFacts(session, packs);
  return { scenario, session, facts, packs };
}

export function evaluateSuggestions(ctx: GuidedContext): Suggestion[] {
  const raw: Suggestion[] = [];
  for (const pack of ctx.packs)
    for (const rule of pack.rules)
      for (const suggestion of rule.evaluate(ctx)) raw.push(suggestion);
  return normalizeSuggestions(raw);
}

// Stable output order. Sorting is for reproducibility only; it carries no
// dependency semantics because no rule ever sees another rule's suggestions.
export function normalizeSuggestions(raw: readonly Suggestion[]): Suggestion[] {
  const sorted = [...raw].sort((a, b) => {
    if (a.ruleId !== b.ruleId) return a.ruleId < b.ruleId ? -1 : 1;
    if (a.id !== b.id) return a.id < b.id ? -1 : 1;
    return 0;
  });
  const seen = new Set<string>();
  const out: Suggestion[] = [];
  for (const suggestion of sorted) {
    if (seen.has(suggestion.id)) continue;
    seen.add(suggestion.id);
    out.push(suggestion);
  }
  return out;
}

function writeKey(operation: ScenarioOperation): string {
  switch (operation.op) {
    case "set-capability":
      return `capability:${operation.key}`;
    case "set-mode":
      return "mode";
    case "set-scenario-type":
      return "scenario-type";
    case "add-station":
      return `stations:${operation.station.id}`;
    case "add-patient":
      return `patients:${operation.patient.id}`;
    case "add-prop":
      return `props:${operation.prop.id}`;
    case "add-team":
      return `teams:${operation.team.id}`;
    case "add-actor":
      return `actors:${operation.actor.id}`;
    case "add-zone":
      return `zones:${operation.zone.id}`;
    case "add-objective":
      return `objectives:${operation.objective.id}`;
    case "add-dossier":
      return `dossiers:${operation.dossier.id}`;
    case "add-event":
      return `injects:${operation.inject.id}`;
    case "add-workflow":
      return `workflows:${operation.workflow.id}`;
    case "add-node":
      return `nodes:${operation.workflowId}/${operation.node.id}`;
    case "connect":
      return `edge:${operation.workflowId}:${operation.edge.source}.${operation.edge.output}`;
    case "set-workflow-trigger":
      return `trigger:${operation.workflowId}`;
    case "set-node-config":
      return `config:${operation.workflowId}/${operation.nodeId}`;
    case "disconnect-edge":
      return `disconnect:${operation.workflowId}/${operation.edgeId}`;
    case "remove-generated-node":
      return `remove:nodes:${operation.workflowId}/${operation.nodeId}`;
    case "remove-generated-workflow":
      return `remove:workflows:${operation.workflowId}`;
    case "remove-generated-event":
      return `remove:injects:${operation.injectId}`;
    case "remove-generated-entity":
      return `remove:${operation.collection}:${operation.id}`;
  }
}

// Conflicting suggestions are surfaced, never silently merged: two rules that
// write the same target with different values are a design finding.
export function detectSuggestionConflicts(
  suggestions: readonly Suggestion[],
): SuggestionConflict[] {
  const byId = new Map<string, Suggestion[]>();
  for (const suggestion of suggestions) {
    const rows = byId.get(suggestion.id) ?? [];
    rows.push(suggestion);
    byId.set(suggestion.id, rows);
  }
  const conflicts: SuggestionConflict[] = [];
  for (const [id, rows] of byId)
    if (rows.length > 1)
      conflicts.push({
        id: `duplicate:${id}`,
        suggestionIds: rows.map((row) => row.id),
        reason: "duplicate-suggestion-id",
      });

  const byKey = new Map<string, { value: string; suggestionId: string }[]>();
  for (const suggestion of suggestions)
    for (const operation of suggestion.operations) {
      const key = writeKey(operation);
      const rows = byKey.get(key) ?? [];
      rows.push({ value: JSON.stringify(operation), suggestionId: suggestion.id });
      byKey.set(key, rows);
    }
  for (const [key, rows] of byKey) {
    const values = new Set(rows.map((row) => row.value));
    if (values.size > 1)
      conflicts.push({
        id: `write:${key}`,
        suggestionIds: [...new Set(rows.map((row) => row.suggestionId))].sort(),
        reason: `conflicting-write:${key}`,
      });
  }
  return conflicts.sort((a, b) => (a.id < b.id ? -1 : 1));
}

export function isSettled(session: GuidedSession, suggestionId: string): boolean {
  return (
    session.accepted.includes(suggestionId) ||
    session.dismissed.includes(suggestionId)
  );
}

export function pendingSuggestions(ctx: GuidedContext): {
  suggestions: Suggestion[];
  conflicts: SuggestionConflict[];
} {
  const all = evaluateSuggestions(ctx);
  const pending = all.filter(
    (suggestion) => !isSettled(ctx.session, suggestion.id),
  );
  return {
    suggestions: pending,
    conflicts: detectSuggestionConflicts(all),
  };
}

// One active decision card at a time; a card may bundle several closely
// related questions. Optional questions stay behind the caller's toggle.
export function nextQuestionCards(
  ctx: GuidedContext,
  includeOptional = false,
): QuestionCard[] {
  const applicable: GuidedQuestion[] = [];
  for (const pack of ctx.packs)
    for (const question of pack.questions) {
      if (isAnswered(question, ctx.session)) continue;
      if (!question.appliesWhen(ctx.facts)) continue;
      if (!includeOptional && question.priority === "optional") continue;
      applicable.push(question);
    }
  const cards = new Map<string, GuidedQuestion[]>();
  for (const question of applicable) {
    const rows = cards.get(question.group) ?? [];
    rows.push(question);
    cards.set(question.group, rows);
  }
  return [...cards.entries()]
    .map(([id, questions]) => ({
      id,
      priority: questions.reduce(
        (best, question) =>
          guidedPriorityRank[question.priority] < guidedPriorityRank[best]
            ? question.priority
            : best,
        "optional" as GuidedQuestion["priority"],
      ),
      questions,
    }))
    .sort((a, b) => {
      const rank = guidedPriorityRank[a.priority] - guidedPriorityRank[b.priority];
      if (rank !== 0) return rank;
      return a.id < b.id ? -1 : 1;
    });
}

export function missingGuidedInfo(ctx: GuidedContext): MissingInfo[] {
  return nextQuestionCards(ctx, true)
    .flatMap((card) => card.questions)
    .filter(
      (question) => question.priority === "blocking" || question.priority === "structural",
    )
    .map((question) => ({
      questionId: question.id,
      priority: question.priority,
    }));
}

export type ApplySuggestionResult =
  | { ok: true; scenario: GuidedContext["scenario"]; session: GuidedSession }
  | { ok: false; error: string };

// Atomic acceptance: the scenario changes only when every operation of the
// suggestion applies. The applied list is an append-only audit log, never a
// lookup source for reconciliation.
export function applySuggestion(
  scenario: GuidedContext["scenario"],
  session: GuidedSession,
  suggestion: Suggestion,
): ApplySuggestionResult {
  if (session.accepted.includes(suggestion.id))
    return { ok: true, scenario, session };
  const result = applyOperations(scenario, suggestion.operations);
  if (!result.ok) return result;
  return {
    ok: true,
    scenario: result.scenario,
    session: {
      ...session,
      accepted: [...session.accepted, suggestion.id],
      applied: [
        ...session.applied,
        { suggestionId: suggestion.id, ruleId: suggestion.ruleId, refs: result.refs },
      ].slice(-200),
    },
  };
}

export function dismissSuggestion(
  session: GuidedSession,
  suggestion: Suggestion,
): GuidedSession {
  if (session.dismissed.includes(suggestion.id)) return session;
  return { ...session, dismissed: [...session.dismissed, suggestion.id] };
}

export function answerQuestion(
  session: GuidedSession,
  questionId: string,
  optionIds: readonly string[],
): GuidedSession {
  return {
    ...session,
    answers: { ...session.answers, [questionId]: [...optionIds] },
  };
}

export function setIntent(
  session: GuidedSession,
  intent: GuidedSession["intent"],
): GuidedSession {
  return { ...session, intent };
}

export function emptySession(
  primaryDomain: GuidedSession["intent"]["primaryDomain"],
): GuidedSession {
  return {
    version: 1,
    intent: { primaryDomain, enabledDomains: [], goal: "" },
    answers: {},
    explicitFacts: {},
    accepted: [],
    dismissed: [],
    applied: [],
  };
}
