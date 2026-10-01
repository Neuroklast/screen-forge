import { describe, expect, it } from "vitest";
import {
  applySuggestion,
  contextFor,
  dismissSuggestion,
  evaluateSuggestions,
} from "../engine";
import { blankScenario, sessionWith } from "../fixtures";
import { removalOperationFor } from "../meta";
import { applyOperations } from "../operations";
import { reconcile } from "../reconcile";
import {
  removeParticipant,
  updateParticipant,
} from "../../../training/prepare/forceCommands";
import { lintMission } from "../../missionLint";
import { scenarioSchema, type Scenario } from "../../training";
import { teamTemplate, teamTemplates } from "../../teamTemplates";
import type { GuidedSession } from "../types";
import { compositionFor } from "./organization";

const ANSWERS = {
  "q.org.team-kind": ["search-rescue"],
  "q.org.deviation": ["as-recommended"],
};

function applyAll(scenario: Scenario) {
  const suggestions = evaluateSuggestions(
    contextFor(scenario, sessionWith("search-rescue", ANSWERS)),
  );
  let next = scenario;
  for (const suggestion of suggestions) {
    const result = applyOperations(next, suggestion.operations);
    expect(result.ok, result.ok ? "" : result.error).toBe(true);
    if (!result.ok) return { next, suggestions };
    next = result.scenario;
  }
  return { next, suggestions };
}

// Applies every suggestion through `applySuggestion`, so `session.accepted`
// records the real accepted state (the reconcile tests depend on it).
function acceptAll(
  scenario: Scenario,
  session: GuidedSession,
): { scenario: Scenario; session: GuidedSession } {
  let next = scenario;
  let current = session;
  for (const suggestion of evaluateSuggestions(contextFor(next, current))) {
    const result = applySuggestion(next, current, suggestion);
    expect(result.ok, result.ok ? "" : result.error).toBe(true);
    if (!result.ok) return { scenario: next, session: current };
    next = result.scenario;
    current = result.session;
  }
  return { scenario: next, session: current };
}

describe("guided organization rule", () => {
  it("emits a team and one participant per recommended slot", () => {
    const { suggestions } = applyAll(blankScenario("sar"));
    const org = suggestions.find((row) => row.ruleId === "org-team");
    expect(org).toBeDefined();
    const teams = org!.operations.filter((op) => op.op === "add-team");
    const stations = org!.operations.filter((op) => op.op === "add-station");
    const template = teamTemplate("search-rescue")!;
    expect(teams).toHaveLength(1);
    expect(stations).toHaveLength(
      template.roles.reduce((sum, slot) => sum + slot.recommended, 0),
    );
  });

  it("is deterministic for the same answers", () => {
    const scenario = blankScenario("sar");
    const first = evaluateSuggestions(
      contextFor(scenario, sessionWith("search-rescue", ANSWERS)),
    );
    const second = evaluateSuggestions(
      contextFor(scenario, sessionWith("search-rescue", ANSWERS)),
    );
    expect(second).toEqual(first);
  });

  it("asks about deviations only after the team kind is chosen", () => {
    const none = contextFor(
      blankScenario("sar"),
      sessionWith("search-rescue", {}),
    );
    const ids = (ctx: ReturnType<typeof contextFor>) =>
      ctx.packs
        .flatMap((pack) => pack.questions)
        .filter((question) => question.appliesWhen(ctx.facts))
        .map((question) => question.id);
    expect(ids(none)).toContain("q.org.team-kind");
    expect(ids(none)).not.toContain("q.org.deviation");
    const chosen = contextFor(
      blankScenario("sar"),
      sessionWith("search-rescue", ANSWERS),
    );
    expect(ids(chosen)).toContain("q.org.deviation");
  });

  it("only changes the composition when a deviation is asked for", () => {
    const template = teamTemplate("search-rescue")!;
    const recommended = compositionFor(template, "as-recommended");
    const smaller = compositionFor(template, "smaller");
    const larger = compositionFor(template, "larger");
    const total = (rows: { count: number }[]) =>
      rows.reduce((sum, row) => sum + row.count, 0);
    expect(total(smaller)).toBeLessThan(total(recommended));
    expect(total(larger)).toBeGreaterThan(total(recommended));
  });

  it("keeps larger a superset of recommended for every template", () => {
    const total = (rows: { count: number }[]) =>
      rows.reduce((sum, row) => sum + row.count, 0);
    for (const template of teamTemplates) {
      const recommended = compositionFor(template, "as-recommended");
      const larger = compositionFor(template, "larger");
      expect(total(larger), template.id).toBeLessThanOrEqual(template.size.max);
      expect(total(larger), template.id).toBeGreaterThanOrEqual(
        total(recommended),
      );
      for (const row of recommended)
        expect(
          larger.find((candidate) => candidate.roleId === row.roleId)?.count ??
            0,
          `${template.id}.${row.roleId}`,
        ).toBeGreaterThanOrEqual(row.count);
    }
  });

  it("growing the team only appends participants, never reassigns a role", () => {
    const base = blankScenario("sar");
    const first = acceptAll(base, sessionWith("search-rescue", ANSWERS));
    const roles = new Map(
      first.scenario.stations.map((station) => [station.id, station.roleId]),
    );
    expect(roles.size).toBeGreaterThan(0);

    const grown = acceptAll(
      first.scenario,
      sessionWith("search-rescue", {
        ...ANSWERS,
        "q.org.deviation": ["larger"],
      }),
    );
    for (const [id, roleId] of roles)
      expect(grown.scenario.stations.find((s) => s.id === id)?.roleId, id).toBe(
        roleId,
      );
    expect(grown.scenario.stations.length).toBeGreaterThan(roles.size);
  });

  it("restores only missing content and never overwrites a user edit", () => {
    const accepted = acceptAll(
      blankScenario("sar"),
      sessionWith("search-rescue", ANSWERS),
    );
    const [editedRow] = accepted.scenario.stations;
    const removedRow =
      accepted.scenario.stations[accepted.scenario.stations.length - 1];
    expect(editedRow.id).not.toBe(removedRow.id);

    let scenario = updateParticipant(accepted.scenario, editedRow.id, {
      name: "My own callsign",
    });
    scenario = removeParticipant(scenario, removedRow.id);

    const offer = reconcile(scenario, accepted.session).add.find(
      (row) => row.ruleId === "org-team",
    );
    expect(offer).toBeDefined();
    if (!offer) return;
    // The restore carries only the missing participant, not the whole team.
    expect(
      offer.operations.every(
        (op) =>
          op.op !== "add-team" &&
          !(op.op === "add-station" && op.station.id === editedRow.id),
      ),
    ).toBe(true);

    const restored = applySuggestion(scenario, accepted.session, offer);
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    expect(
      restored.scenario.stations.find((row) => row.id === editedRow.id)?.name,
    ).toBe("My own callsign");
    expect(
      restored.scenario.stations.some((row) => row.id === removedRow.id),
    ).toBe(true);
  });

  it("switching the team kind never rewrites an existing participant", () => {
    const first = acceptAll(blankScenario("sar"), sessionWith("search-rescue", ANSWERS));
    const before = new Map(
      first.scenario.stations.map((station) => [station.id, station.roleId]),
    );
    expect(before.size).toBeGreaterThan(0);
    const other = acceptAll(
      first.scenario,
      sessionWith("search-rescue", {
        "q.org.team-kind": ["compact-field"],
        "q.org.deviation": ["as-recommended"],
      }),
    );
    for (const [id, roleId] of before)
      expect(other.scenario.stations.find((s) => s.id === id)?.roleId, id).toBe(
        roleId,
      );
  });

  it("does not offer a team where the scenario cannot show one", () => {
    const scenario: Scenario = {
      ...blankScenario("sar"),
      capabilities: { teams: false },
    };
    const suggestions = evaluateSuggestions(
      contextFor(scenario, sessionWith("search-rescue", ANSWERS)),
    );
    expect(suggestions.filter((row) => row.ruleId === "org-team")).toEqual([]);
  });

  it("leaves the workflow graph untouched and the scenario valid", () => {
    const base = blankScenario("sar");
    const { next } = applyAll(base);
    expect(next.workflows).toEqual(base.workflows);
    expect(scenarioSchema.safeParse(next).success).toBe(true);
    expect(
      lintMission(next).filter((finding) => finding.severity === "error"),
    ).toEqual([]);
  });

  it("keeps the team while the answer holds and reconciles only the deviation", () => {
    const { next } = applyAll(blankScenario("sar"));
    const teamId = next.teams[0]?.id;
    expect(teamId).toBeTruthy();
    const stable = reconcile(next, sessionWith("search-rescue", ANSWERS));
    expect(stable.remove).toEqual([]);

    // "smaller" keeps the team identity and drops the optional slot's seat, so
    // only the surplus participant is proposed for removal.
    const changed = reconcile(
      next,
      sessionWith("search-rescue", {
        "q.org.team-kind": ["search-rescue"],
        "q.org.deviation": ["smaller"],
      }),
    );
    const refs = changed.remove.map((row) => row.ref);
    expect(refs).not.toContain(`teams:${teamId}`);
    expect(refs.some((ref) => ref.startsWith("stations:g-org-team-main-"))).toBe(
      true,
    );
    expect(changed.conflicts).toEqual([]);
  });

  it("re-offers a previously accepted deviation whose content is missing again", () => {
    const base = blankScenario("sar");
    const accepted = acceptAll(base, sessionWith("search-rescue", ANSWERS));
    // The user shrinks the team: the surplus participant is proposed for removal.
    const smaller = sessionWith("search-rescue", {
      ...ANSWERS,
      "q.org.deviation": ["smaller"],
    });
    const surplus = reconcile(accepted.scenario, smaller).remove[0];
    expect(surplus).toBeDefined();
    const removal = removalOperationFor(surplus.ref);
    expect(removal).toBeDefined();
    const removed = applyOperations(accepted.scenario, [removal!]);
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;

    // Back to "as recommended": the accepted suggestion is offered again
    // because its participants are missing, and accepting it restores them.
    const reverted = reconcile(removed.scenario, accepted.session);
    const offer = reverted.add.find((row) => row.ruleId === "org-team");
    expect(offer).toBeDefined();
    if (!offer) return;
    const restored = applySuggestion(removed.scenario, accepted.session, offer);
    expect(restored.ok).toBe(true);
    if (!restored.ok) return;
    expect(restored.scenario.stations).toHaveLength(
      accepted.scenario.stations.length,
    );

    // The same offer can be dismissed for good, even though it was accepted.
    const dismissed = dismissSuggestion(accepted.session, offer);
    expect(
      reconcile(removed.scenario, dismissed).add.some(
        (row) => row.ruleId === "org-team",
      ),
    ).toBe(false);
  });
});
