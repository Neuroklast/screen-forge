import type { Inject, Scenario } from "../../../core/training";
import type { ScenarioCapabilities } from "../../../core/capabilities";
import type { Finding } from "../../../core/missionLint";
import {
  edgeForOutput,
  flowKindOfNode,
  flowNodeLabels,
  removeNode,
  replaceNode,
  setOutputTarget,
  workflowNodeLabels,
  workflowPortLabel,
} from "../../../core/workflowEdit";
import {
  workflowNodePorts,
  type Workflow,
  type WorkflowNode,
} from "../../../core/workflow";
import { t } from "../../../i18n";
import { NodeFields } from "../../../builder/WorkflowFields";
import { EventInspector } from "./EventInspector";

// Inspector of the flow workspace: workflow settings, node settings, event
// settings, findings and the collapsed raw data.
export function FlowInspector({
  draft,
  workflow,
  caps,
  readOnly,
  selectedNode,
  selectedEvent,
  linkedWorkflow,
  findings,
  onSelectNode,
  onSelectEvent,
  onPatchWorkflow,
  onPatchInject,
  onDeleteWorkflow,
  onDeleteEvent,
}: {
  draft: Scenario;
  workflow?: Workflow;
  caps: ScenarioCapabilities;
  readOnly: boolean;
  selectedNode?: WorkflowNode;
  selectedEvent?: Inject;
  linkedWorkflow?: Workflow;
  findings: Finding[];
  onSelectNode: (id: string) => void;
  onSelectEvent: (id: string) => void;
  onPatchWorkflow: (next: Workflow) => void;
  onPatchInject: (id: string, patch: Partial<Inject>) => void;
  onDeleteWorkflow: () => void;
  onDeleteEvent: (id: string) => void;
}) {
  const nodeLabel = (node: WorkflowNode) => {
    const kind = flowKindOfNode(node);
    return kind === "advanced"
      ? workflowNodeLabels[node.type]
      : flowNodeLabels[kind];
  };
  const nodeForFinding = (finding: Finding) =>
    workflow?.nodes.find(
      (node) =>
        finding.id.startsWith(`graph-wf-exit-${workflow.id}-${node.id}-`) ||
        finding.id.startsWith(
          `graph-wf-unreachable-${workflow.id}-${node.id}`,
        ) ||
        finding.id.startsWith(`graph-wf-terminal-${workflow.id}-${node.id}`) ||
        finding.id.startsWith(`graph-wf-task-${workflow.id}-${node.id}`),
    );
  const workflowFindings = workflow
    ? findings.filter(
        (f) =>
          f.path.collection === "workflows" && f.path.id === workflow.id,
      )
    : [];
  // Keep the flow findings contextual: the selected workflow plus the selected
  // event. The review section owns the global picture.
  const eventFindings = selectedEvent
    ? findings.filter(
        (f) =>
          f.path.collection === "injects" && f.path.id === selectedEvent.id,
      )
    : [];
  const trigger = workflow?.trigger;

  return (
    <aside className="builder-inspector" aria-label={t("flow.inspector")}>
      <div className="builder-fields">
        {selectedEvent ? (
          <EventInspector
            event={selectedEvent}
            draft={draft}
            caps={caps}
            readOnly={readOnly}
            linkedWorkflow={linkedWorkflow}
            onChange={(next) => onPatchInject(selectedEvent.id, next)}
            onRemove={() => onDeleteEvent(selectedEvent.id)}
          />
        ) : selectedNode && workflow ? (
          <>
            <span className="palette-group-title">{t("flow.node")}</span>
            <label>
              {t("builder.nodeName")}
              <input
                value={selectedNode.name}
                disabled={readOnly}
                onChange={(event) =>
                  onPatchWorkflow(
                    replaceNode(workflow, {
                      ...selectedNode,
                      name: event.target.value,
                    }),
                  )
                }
              />
            </label>
            <NodeFields
              node={selectedNode}
              workflow={workflow}
              draft={draft}
              readOnly={readOnly}
              onChange={(node) => onPatchWorkflow(replaceNode(workflow, node))}
            />
            <span className="palette-group-title">{t("flow.outputs")}</span>
            {workflowNodePorts(selectedNode).map((port) => {
              const edge = edgeForOutput(workflow, selectedNode.id, port);
              return (
                <label key={port}>
                  {t(workflowPortLabel(port))}
                  <select
                    value={edge?.target ?? ""}
                    disabled={readOnly}
                    onChange={(event) =>
                      onPatchWorkflow(
                        setOutputTarget(
                          workflow,
                          selectedNode.id,
                          port,
                          event.target.value,
                        ),
                      )
                    }
                  >
                    <option value="">{t("builder.noTarget")}</option>
                    {workflow.nodes
                      .filter(
                        (node) =>
                          node.id !== selectedNode.id &&
                          node.id !== workflow.entry,
                      )
                      .map((node) => (
                        <option key={node.id} value={node.id}>
                          {node.name || t(nodeLabel(node))}
                        </option>
                      ))}
                  </select>
                </label>
              );
            })}
            <button
              className="danger"
              disabled={readOnly || selectedNode.id === workflow.entry}
              onClick={() => {
                onPatchWorkflow(removeNode(workflow, selectedNode.id));
                onSelectNode("");
              }}
            >
              {t("flow.remove")}
            </button>
          </>
        ) : workflow ? (
          <>
            <span className="palette-group-title">{t("cap.workflows")}</span>
            <label>
              {t("builder.workflowName")}
              <input
                value={workflow.name}
                disabled={readOnly}
                onChange={(event) =>
                  onPatchWorkflow({
                    ...workflow,
                    name: event.target.value || t("builder.workflowName"),
                  })
                }
              />
            </label>
            <label>
              {t("flow.trigger")}
              <select
                value={trigger?.type ?? "manual"}
                disabled={readOnly}
                onChange={(event) =>
                  onPatchWorkflow({
                    ...workflow,
                    trigger:
                      event.target.value === "prop"
                        ? {
                            type: "prop",
                            prop: draft.props[0]?.id ?? "",
                            to: draft.props[0]?.states[0] ?? "",
                          }
                        : { type: "manual" },
                  })
                }
              >
                <option value="manual">{t("flow.triggerManual")}</option>
                <option value="prop">{t("flow.triggerProp")}</option>
              </select>
            </label>
            {trigger && trigger.type === "prop" && (
              <>
                <label>
                  {t("flow.prop")}
                  <select
                    value={trigger.prop}
                    disabled={readOnly}
                    onChange={(event) =>
                      onPatchWorkflow({
                        ...workflow,
                        trigger: {
                          type: "prop",
                          prop: event.target.value,
                          to:
                            draft.props.find(
                              (row) => row.id === event.target.value,
                            )?.states[0] ?? "",
                        },
                      })
                    }
                  >
                    {draft.props.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("flow.propState")}
                  <select
                    value={trigger.to}
                    disabled={readOnly}
                    onChange={(event) =>
                      onPatchWorkflow({
                        ...workflow,
                        trigger: {
                          type: "prop",
                          prop: trigger.type === "prop" ? trigger.prop : "",
                          to: event.target.value,
                        },
                      })
                    }
                  >
                    {(draft.props.find(
                      (row) => row.id === trigger.prop,
                    )?.states ?? []).map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <button className="danger" disabled={readOnly} onClick={onDeleteWorkflow}>
              {t("flow.deleteWorkflow")}
            </button>
          </>
        ) : (
          <p className="builder-hint">{t("flow.selectHint")}</p>
        )}

        <span className="palette-group-title">{t("flow.findings")}</span>
        <ul className="wf-findings">
          {[...workflowFindings, ...eventFindings].map((finding) => {
            const node = nodeForFinding(finding);
            const event =
              finding.path.collection === "injects"
                ? draft.injects.find((row) => row.id === finding.path.id)
                : undefined;
            return (
              <li key={finding.id} className={`is-${finding.severity}`}>
                <button
                  onClick={() => {
                    if (node) onSelectNode(node.id);
                    else if (event) onSelectEvent(event.id);
                  }}
                  disabled={!node && !event}
                >
                  {finding.message}
                </button>
              </li>
            );
          })}
          {!workflowFindings.length && !eventFindings.length && (
            <li className="is-ok">{t("flow.ok")}</li>
          )}
        </ul>

        <details className="prepare-advanced">
          <summary>{t("flow.advanced")}</summary>
          <p className="prepare-hint">{t("flow.advancedHint")}</p>
          <ul className="prepare-findings">
            {draft.injects.map((inject) => (
              <li key={inject.id}>
                <button onClick={() => onSelectEvent(inject.id)}>
                  {inject.id} · {inject.name} · {inject.trigger}
                </button>
              </li>
            ))}
          </ul>
          {workflow && workflow.variables.length > 0 && (
            <>
              <span className="palette-group-title">{t("flow.variables")}</span>
              {workflow.variables.map((variable) => (
                <p key={variable.id} className="prepare-hint">
                  {variable.id} · {variable.kind}
                  {variable.secret ? ` · ${t("flow.variableSecret")}` : ""}
                </p>
              ))}
            </>
          )}
        </details>
      </div>
    </aside>
  );
}
