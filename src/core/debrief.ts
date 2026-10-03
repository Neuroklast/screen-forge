import type { Inject, Scenario } from "./training";

// After-action report (docs/konzept/control/01-inject-orchestration.md, MEL v2).
// A pure projection of the authored scenario plus the exercise state: it groups
// every event under the training objective it serves and carries the declared
// expected observation and evidence, so the debrief answers "why did this event
// exist and what should we have seen" without re-reading the MEL by hand.
export type DebriefEventStatus = "planned" | "fired" | "skipped";

export type DebriefEvent = {
  id: string;
  name: string;
  category: Inject["category"];
  status: DebriefEventStatus;
  objectiveId: string;
  objectiveName: string;
  purpose: string;
  expectedOutcome: string[];
  evidence: string[];
};

export type DebriefObjective = {
  id: string;
  name: string;
  completed: boolean;
  events: DebriefEvent[];
  // Declared per event, de-duplicated for the objective-level checklist.
  expectedOutcome: string[];
  evidence: string[];
};

export type DebriefReport = {
  objectives: DebriefObjective[];
  events: DebriefEvent[];
  // Events that serve no objective, and objectives no event covers.
  unlinked: DebriefEvent[];
  uncovered: DebriefObjective[];
  summary: {
    objectives: number;
    completed: number;
    events: number;
    fired: number;
    skipped: number;
    evidence: number;
  };
};

export function buildDebrief(
  scenario: Scenario,
  state: {
    fired: readonly string[];
    completed: readonly string[];
    // Optional so a caller that only knows fired/completed still works.
    skipped?: readonly string[];
  },
): DebriefReport {
  const fired = new Set(state.fired);
  const skipped = new Set(state.skipped ?? []);
  const completed = new Set(state.completed);

  const events: DebriefEvent[] = scenario.injects.map((inject) => {
    const objective = scenario.objectives.find(
      (row) => row.id === inject.objective,
    );
    return {
      id: inject.id,
      name: inject.name,
      category: inject.category,
      // A suppressed event is "skipped", never "fired": its actions never ran.
      status: skipped.has(inject.id)
        ? "skipped"
        : fired.has(inject.id)
          ? "fired"
          : "planned",
      objectiveId: objective?.id ?? "",
      objectiveName: objective?.name ?? "",
      purpose: inject.purpose,
      expectedOutcome: inject.expectedOutcome,
      evidence: inject.evidence,
    };
  });

  const objectives: DebriefObjective[] = scenario.objectives.map(
    (objective) => {
      const linked = events.filter(
        (event) => event.objectiveId === objective.id,
      );
      return {
        id: objective.id,
        name: objective.name,
        completed: completed.has(objective.id),
        events: linked,
        expectedOutcome: [...new Set(linked.flatMap((e) => e.expectedOutcome))],
        evidence: [...new Set(linked.flatMap((e) => e.evidence))],
      };
    },
  );

  return {
    objectives,
    events,
    unlinked: events.filter((event) => !event.objectiveId),
    uncovered: objectives.filter((objective) => objective.events.length === 0),
    summary: {
      objectives: objectives.length,
      completed: objectives.filter((objective) => objective.completed).length,
      events: events.length,
      fired: events.filter((event) => event.status === "fired").length,
      skipped: events.filter((event) => event.status === "skipped").length,
      evidence: new Set(events.flatMap((event) => event.evidence)).size,
    },
  };
}
