import { lazy, Suspense, useState } from "react";
import { injectSchema, type Inject, type Scenario } from "../../core/training";
import { lintMission } from "../../core/missionLint";
import {
  addNodeOfType,
  createNodeOfKind,
  createWorkflow,
  flowLinks,
  workflowUid,
  type FlowNodeKind,
} from "../../core/workflowEdit";
import { type Workflow } from "../../core/workflow";
import { t } from "../../i18n";
import { Term } from "../../ui/terminology/Term";
import { uid, type PrepareSectionProps } from "./shared";
import { WorkspaceShell } from "../../ui/WorkspaceShell";
import { FlowPalette, type AdvancedNodeType } from "./flow/FlowPalette";
import { FlowTimeline } from "./flow/FlowTimeline";
import { FlowInspector } from "./flow/FlowInspector";
import type { FlowSelection } from "./flow/types";
import "../../builder/workflow-graph.css";

// React Flow loads only when the flow workspace renders.
const WorkflowCanvas = lazy(() =>
  import("../../builder/WorkflowCanvas").then((module) => ({
    default: module.WorkflowCanvas,
  })),
);

// Flow: one visual workspace for the scenario logic. Workflow nodes form the
// connected graph; timed/manual events live on the timeline and show the
// workflow they start. The internal split stays invisible in normal authoring.
export function FlowSection({
  draft,
  change,
  readOnly,
  caps,
}: PrepareSectionProps) {
  const [workflowId, setWorkflowId] = useState(draft.workflows[0]?.id ?? "");
  const [selection, setSelection] = useState<FlowSelection>(null);
  const findings = lintMission(draft);
  const links = flowLinks(draft);
  // A selected event brings its workflow to the canvas and highlights the
  // entry node, so the event-to-flow connection is visible, not just textual.
  const eventLink =
    selection?.kind === "event"
      ? links.find((row) => row.inject === selection.id)
      : undefined;
  const workflow =
    draft.workflows.find((row) => row.id === eventLink?.workflow) ??
    draft.workflows.find((row) => row.id === workflowId) ??
    draft.workflows[0];
  const highlightNodeId =
    eventLink && workflow?.id === eventLink.workflow ? workflow.entry : "";
  const selectedNode =
    selection?.kind === "node"
      ? workflow?.nodes.find((row) => row.id === selection.id)
      : undefined;
  const selectedEvent =
    selection?.kind === "event"
      ? draft.injects.find((row) => row.id === selection.id)
      : undefined;

  const patchWorkflow = (next: Workflow) =>
    change({
      ...draft,
      workflows: draft.workflows.map((row) =>
        row.id === next.id ? next : row,
      ),
    });
  const patchInject = (id: string, patch: Partial<Inject>) =>
    change({
      ...draft,
      injects: draft.injects.map((row) =>
        row.id === id ? { ...row, ...patch } : row,
      ),
    });
  const selectWorkflow = (id: string) => {
    setWorkflowId(id);
    setSelection(null);
  };
  const addWorkflow = () => {
    const id = workflowUid("wf");
    change({ ...draft, workflows: [...draft.workflows, createWorkflow(id)] });
    selectWorkflow(id);
  };
  const deleteWorkflow = () => {
    if (!workflow) return;
    const rest = draft.workflows.filter((row) => row.id !== workflow.id);
    change({ ...draft, workflows: rest });
    selectWorkflow(rest[0]?.id ?? "");
  };
  const deleteEvent = (id: string) => {
    change({ ...draft, injects: draft.injects.filter((row) => row.id !== id) });
    if (selection?.kind === "event" && selection.id === id) setSelection(null);
  };
  const addEvent = (trigger: Inject["trigger"]) => {
    const inject = injectSchema.parse({
      id: uid("event"),
      name: t(`flow.event.${trigger === "timer" ? "time" : trigger}`),
      trigger,
      at: 60,
      actions: [{ type: "message", text: t("editor.statusCheck") }],
    });
    change({ ...draft, injects: [...draft.injects, inject] });
    setSelection({ kind: "event", id: inject.id });
  };
  const addNode = (kind: FlowNodeKind) => {
    if (!workflow) return;
    const result = createNodeOfKind(workflow, kind, {
      position: {
        x: 40 + (workflow.nodes.length % 6) * 60,
        y: 40 + (workflow.nodes.length % 6) * 70,
      },
    });
    patchWorkflow(result.workflow);
    setSelection({ kind: "node", id: result.nodeId });
  };
  const addAdvancedNode = (type: AdvancedNodeType) => {
    if (!workflow) return;
    const result = addNodeOfType(workflow, type, {
      position: {
        x: 40 + (workflow.nodes.length % 6) * 60,
        y: 40 + (workflow.nodes.length % 6) * 70,
      },
    });
    patchWorkflow(result.workflow);
    setSelection({ kind: "node", id: result.nodeId });
  };

  return (
    <section className="sf-flow-workspace">
      <WorkspaceShell
        label={t("prep.flow.workspace")}
        toolbar={
          <div className="sf-flow-toolbar">
            <h2>
              <Term id="nav.flow" />
            </h2>
          </div>
        }
        navigator={
          <FlowPalette
            workflows={draft.workflows}
            workflowId={workflow?.id ?? ""}
            readOnly={readOnly}
            onSelectWorkflow={selectWorkflow}
            onAddWorkflow={addWorkflow}
            onAddNode={addNode}
            onAddAdvancedNode={addAdvancedNode}
            onAddEvent={addEvent}
          />
        }
        canvas={
          <div className="flow-center">
            <div className="flow-canvas">
              {workflow ? (
                <Suspense
                  fallback={
                    <p className="builder-hint">{t("builder.loading")}</p>
                  }
                >
                  <WorkflowCanvas
                    workflow={workflow}
                    findings={findings}
                    readOnly={readOnly}
                    selectedNodeId={selectedNode?.id ?? ""}
                    onSelectNode={(id) =>
                      setSelection(id ? { kind: "node", id } : null)
                    }
                    onPatch={patchWorkflow}
                    variant="human"
                    highlightNodeId={highlightNodeId}
                  />
                </Suspense>
              ) : (
                <p className="builder-hint">{t("builder.noWorkflow")}</p>
              )}
            </div>
            <FlowTimeline
              events={draft.injects}
              links={links}
              workflows={draft.workflows}
              selectedId={selection?.kind === "event" ? selection.id : ""}
              onSelect={(id) => setSelection({ kind: "event", id })}
            />
          </div>
        }
        inspector={
          <FlowInspector
            draft={draft}
            workflow={workflow}
            caps={caps}
            readOnly={readOnly}
            selectedNode={selectedNode}
            selectedEvent={selectedEvent}
            linkedWorkflow={eventLink ? workflow : undefined}
            findings={findings}
            onSelectNode={(id) =>
              setSelection(id ? { kind: "node", id } : null)
            }
            onSelectEvent={(id) => setSelection({ kind: "event", id })}
            onPatchWorkflow={patchWorkflow}
            onPatchInject={patchInject}
            onDeleteWorkflow={deleteWorkflow}
            onDeleteEvent={deleteEvent}
          />
        }
      />
    </section>
  );
}
