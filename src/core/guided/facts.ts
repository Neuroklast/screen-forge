import type {
  DomainPack,
  FactValue,
  GuidedFacts,
  GuidedQuestion,
  GuidedSession,
} from "./types.ts";

// Facts are derived, never persisted. Answers and explicitFacts are the
// persisted truth; a reload recomputes exactly the same fact set.
export function deriveFacts(
  session: GuidedSession,
  packs: readonly DomainPack[],
): GuidedFacts {
  const facts: Record<string, FactValue> = {};
  for (const pack of packs)
    for (const question of pack.questions) {
      for (const optionId of session.answers[question.id] ?? []) {
        const option = question.options.find((row) => row.id === optionId);
        if (!option) continue;
        for (const effect of option.effects) facts[effect.fact] = effect.value;
      }
    }
  for (const [key, value] of Object.entries(session.explicitFacts))
    facts[key] = value;
  return facts;
}

export function isAnswered(
  question: GuidedQuestion,
  session: GuidedSession,
): boolean {
  if (question.isAnswered) return question.isAnswered(session);
  return (session.answers[question.id]?.length ?? 0) > 0;
}

export function factValue(
  facts: GuidedFacts,
  key: string,
): FactValue | undefined {
  return facts[key];
}

export function factString(
  facts: GuidedFacts,
  key: string,
): string | undefined {
  const value = facts[key];
  return typeof value === "string" ? value : undefined;
}

export function factBoolean(
  facts: GuidedFacts,
  key: string,
): boolean | undefined {
  const value = facts[key];
  return typeof value === "boolean" ? value : undefined;
}

export function factNumber(
  facts: GuidedFacts,
  key: string,
): number | undefined {
  const value = facts[key];
  return typeof value === "number" ? value : undefined;
}
