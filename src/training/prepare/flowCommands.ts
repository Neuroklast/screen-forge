import { injectSchema, type Inject, type Scenario } from "../../core/training";
import type { Workflow } from "../../core/workflow";
import { createWorkflow, workflowUid } from "../../core/workflowEdit";
import { t } from "../../i18n";
import { uid } from "./shared";

// The only write path for flow edits (docs/architecture/commands.md): pure
// Scenario -> Scenario functions. Graph topology itself stays in the shared
// graphEdit/workflowEdit API; these commands only replace the owning arrays.
export function setWorkflow(scenario: Scenario, workflow: Workflow): Scenario {
  return {
    ...scenario,
    workflows: scenario.workflows.map((row) =>
      row.id === workflow.id ? workflow : row,
    ),
  };
}

export function addWorkflow(scenario: Scenario): {
  scenario: Scenario;
  id: string;
} {
  const id = workflowUid("wf");
  return {
    scenario: { ...scenario, workflows: [...scenario.workflows, createWorkflow(id)] },
    id,
  };
}

export function removeWorkflow(scenario: Scenario, id: string): Scenario {
  return {
    ...scenario,
    workflows: scenario.workflows.filter((row) => row.id !== id),
  };
}

export function setInject(
  scenario: Scenario,
  id: string,
  patch: Partial<Inject>,
): Scenario {
  return {
    ...scenario,
    injects: scenario.injects.map((row) =>
      row.id === id ? { ...row, ...patch } : row,
    ),
  };
}

export function addEvent(
  scenario: Scenario,
  trigger: Inject["trigger"],
): { scenario: Scenario; id: string } {
  const inject = injectSchema.parse({
    id: uid("event"),
    name: t(`flow.event.${trigger === "timer" ? "time" : trigger}`),
    trigger,
    at: 60,
    actions: [{ type: "message", text: t("editor.statusCheck") }],
  });
  return { scenario: { ...scenario, injects: [...scenario.injects, inject] }, id: inject.id };
}

export function removeEvent(scenario: Scenario, id: string): Scenario {
  return {
    ...scenario,
    injects: scenario.injects.filter((row) => row.id !== id),
  };
}
