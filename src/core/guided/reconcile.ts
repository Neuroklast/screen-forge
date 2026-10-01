import { contextFor, evaluateSuggestions } from "./engine.ts";
import {
  generatedElementRefs,
  operationElementRef,
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
  Suggestion,
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

  // The additive refs a suggestion names, independent of whether it currently
  // applies. A full preview can fail when a generated row was edited by hand;
  // that must not make the row look stale, so its ref still counts as produced.
  const additiveRefs = (suggestion: Suggestion): string[] => {
    const refs: string[] = [];
    for (const operation of suggestion.operations) {
      const ref = operationElementRef(operation);
      if (ref) refs.push(ref);
    }
    return refs;
  };

  const invalid = new Set<string>();
  const produced = new Map<string, string[]>();
  const nextRefs = new Set<string>();
  for (const suggestion of suggestions) {
    const result = applyOperations(scenario, suggestion.operations);
    if (!result.ok) invalid.add(suggestion.id);
    const refs = result.ok ? result.refs : additiveRefs(suggestion);
    produced.set(suggestion.id, refs);
    for (const ref of refs) nextRefs.add(ref);
  }

  const existing = new Set(generatedElementRefs(scenario).map((row) => row.ref));
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

  // An accepted suggestion is allowed to be temporarily unapplicable (a row it
  // owns was edited); it is re-offered as a restore below instead.
  for (const suggestion of suggestions)
    if (invalid.has(suggestion.id) && !session.accepted.includes(suggestion.id))
      conflicts.push({
        ref: `suggestion:${suggestion.id}`,
        ruleId: suggestion.ruleId,
        reason: "invalid",
      });

  const add: Suggestion[] = [];
  for (const suggestion of suggestions) {
    // A dismissal always wins, even over a previously accepted suggestion, so
    // the user can always clear one.
    if (session.dismissed.includes(suggestion.id)) continue;
    if (!session.accepted.includes(suggestion.id)) {
      if (!invalid.has(suggestion.id)) add.push(suggestion);
      continue;
    }
    const refs = produced.get(suggestion.id) ?? [];
    if (refs.every((ref) => existing.has(ref))) continue;
    // An accepted suggestion whose content is missing again (the answer was
    // reverted after a deviation) is re-offered as a restore of only the
    // missing parts. Existing content is never re-emitted, so user edits to
    // generated rows survive the restore.
    const operations = suggestion.operations.filter((operation) => {
      const ref = operationElementRef(operation);
      return !ref || !existing.has(ref);
    });
    if (operations.length > 0) add.push({ ...suggestion, operations });
  }

  return {
    keep: keep.sort(),
    add,
    remove: remove.sort((a, b) => (a.ref < b.ref ? -1 : 1)),
    conflicts: conflicts.sort((a, b) => (a.ref < b.ref ? -1 : 1)),
  };
}
