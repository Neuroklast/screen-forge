import { contextFor, evaluateSuggestions, isSettled } from "./engine.ts";
import {
  generatedElementRefs,
  ownershipOf,
  parseElementRef,
  removalOperationFor,
  workflowRef,
} from "./meta.ts";
import { applyOperations } from "./operations.ts";
import type { Scenario } from "../training.ts";
import type {
  DomainPack,
  GuidedSession,
  ReconcileResult,
} from "./types.ts";

// Reconciliation compares the generated elements that actually exist in the
// scenario (their origin is the single source of ownership) against what the
// current answers would generate. Untouched generated content may be removed;
// modified generated content and user content are never touched silently.
export function reconcile(
  scenario: Scenario,
  session: GuidedSession,
  registry?: readonly DomainPack[],
): ReconcileResult {
  const ctx = contextFor(scenario, session, registry);
  const suggestions = evaluateSuggestions(ctx);

  const previews = new Map<string, string[] | null>();
  const nextRefs = new Set<string>();
  for (const suggestion of suggestions) {
    const result = applyOperations(scenario, suggestion.operations);
    previews.set(suggestion.id, result.ok ? result.refs : null);
    if (result.ok) for (const ref of result.refs) nextRefs.add(ref);
  }

  const keep: string[] = [];
  const remove: ReconcileResult["remove"] = [];
  const conflicts: ReconcileResult["conflicts"] = [];

  for (const { ref, origin } of generatedElementRefs(scenario)) {
    const parsed = parseElementRef(ref);
    // Nodes belong to their generated workflow: as long as the workflow is
    // still produced, its untouched nodes are kept with it.
    if (
      nextRefs.has(ref) ||
      (parsed?.kind === "node" && nextRefs.has(workflowRef(parsed.workflowId)))
    ) {
      keep.push(ref);
      continue;
    }
    if (ownershipOf(origin) === "generated-modified") {
      conflicts.push({ ref, ruleId: origin.ruleId, reason: "modified" });
      continue;
    }
    const removal = removalOperationFor(ref);
    if (!removal) {
      conflicts.push({ ref, ruleId: origin.ruleId, reason: "referenced" });
      continue;
    }
    const probe = applyOperations(scenario, [removal]);
    if (probe.ok) remove.push({ ref, ruleId: origin.ruleId });
    else conflicts.push({ ref, ruleId: origin.ruleId, reason: "referenced" });
  }

  for (const suggestion of suggestions)
    if (previews.get(suggestion.id) === null)
      conflicts.push({
        ref: `suggestion:${suggestion.id}`,
        ruleId: suggestion.ruleId,
        reason: "invalid",
      });

  const add = suggestions.filter(
    (suggestion) =>
      previews.get(suggestion.id) !== null &&
      !isSettled(session, suggestion.id),
  );

  return {
    keep: keep.sort(),
    add,
    remove: remove.sort((a, b) => (a.ref < b.ref ? -1 : 1)),
    conflicts: conflicts.sort((a, b) => (a.ref < b.ref ? -1 : 1)),
  };
}
