import { lazy, Suspense, useState } from "react";
import {
  injectSchema,
  moduleEvents,
  type Action,
  type Inject,
  type Scenario,
} from "../../core/training";
import { lintMission, type Finding } from "../../core/missionLint";
import {
  addNodeOfType,
  createNodeOfKind,
  createWorkflow,
  edgeForOutput,
  flowKindOfNode,
  flowLinks,
  flowNodeLabels,
  nodeSummary,
  removeNode,
  replaceNode,
  setOutputTarget,
  workflowNodeLabels,
  workflowUid,
  type FlowNodeKind,
} from "../../core/workflowEdit";
import { workflowNodePorts, type Workflow, type WorkflowNode } from "../../core/workflow";
import { NodeFields } from "../../builder/WorkflowFields";
import { t } from "../../i18n";
import { uid, type PrepareSectionProps } from "./shared";
import "../../builder/workflow-graph.css";

// React Flow loads only when the flow workspace renders.
const WorkflowCanvas = lazy(() =>
  import("../../builder/WorkflowCanvas").then((module) => ({
    default: module.WorkflowCanvas,
  })),
);

const ADVANCED_NODES = [
  "delay",
  "show-surface",
  "increment",
  "set-prop-state",
] as const;

const EVENT_TRIGGERS = [
  "timer",
  "zone",
  "manual",
  "prop",
  "signal",
  "intervention",
] as const;

// Flow: one visual workspace for the scenario logic. Workflow nodes form the
// connected graph; timed/manual MEL events live on the timeline and show the
// workflow they start. The internal split stays invisible in normal authoring.
export function FlowSection({
  draft,
  change,
  readOnly,
  caps,
}: PrepareSectionProps) {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(
    draft.workflows[0]?.id ?? "",
  );
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const workflow =
    draft.workflows.find((row) => row.id === selectedWorkflowId) ??
    draft.workflows[0];
  const findings = lintMission(draft);
  const links = flowLinks(draft);

  const patchWorkflow = (next: Workflow) =>
    change({
      ...draft,
      workflows: draft.workflows.map((row) =>
        row.id === next.id ? next : row,
      ),
    });

  const patchInject = (id: string, next: Partial<Inject>) =>
    change({
      ...draft,
      injects: draft.injects.map((row) =>
        row.id === id ? { ...row, ...next } : row,
      ),
    });

  const addWorkflow = () => {
    const id = workflowUid("wf");
    const next = createWorkflow(id);
    change({ ...draft, workflows: [...draft.workflows, next] });
    setSelectedWorkflowId(id);
    setSelectedNodeId("");
    setSelectedEventId("");
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
    setSelectedEventId(inject.id);
    setSelectedNodeId("");
  };

  const selectNode = (id: string) => {
    setSelectedNodeId(id);
    setSelectedEventId("");
  };
  const selectEvent = (id: string) => {
    setSelectedEventId(id);
    setSelectedNodeId("");
  };

  const selectedNode = workflow?.nodes.find((row) => row.id === selectedNodeId);
  const trigger = workflow?.trigger;
  const selectedEvent = draft.injects.find((row) => row.id === selectedEventId);
  const orderedEvents = [...draft.injects].sort((a, b) => {
    const order = (r: Inject) => (r.trigger === "timer" ? 0 : 1);
    if (order(a) !== order(b)) return order(a) - order(b);
    return a.at - b.at;
  });
  const workflowFindings = workflow
    ? findings.filter(
        (f) =>
          f.path.collection === "workflows" && f.path.id === workflow.id,
      )
    : [];
  const eventFindings = selectedEvent
    ? findings.filter(
        (f) => f.path.collection === "injects" && f.path.id === selectedEvent.id,
      )
    : [];

  const nodeForFinding = (finding: Finding) =>
    workflow?.nodes.find(
      (node) =>
        finding.id.startsWith(
          `graph-wf-exit-${workflow.id}-${node.id}-`,
        ) ||
        finding.id.startsWith(
          `graph-wf-unreachable-${workflow.id}-${node.id}`,
        ) ||
        finding.id.startsWith(`graph-wf-terminal-${workflow.id}-${node.id}`) ||
        finding.id.startsWith(`graph-wf-task-${workflow.id}-${node.id}`),
    );

  const nodeLabel = (node: WorkflowNode) => {
    const kind = flowKindOfNode(node);
    return kind === "advanced"
      ? workflowNodeLabels[node.type]
      : flowNodeLabels[kind];
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
    selectNode(result.nodeId);
  };

  return (
    <section className="panel prepare">
      <h2>{t("prep.tab.flow")}</h2>
      <div className="flow-workspace">
        <aside className="builder-palette" aria-label={t("flow.palette")}>
          <div className="palette-group">
            <span className="palette-group-title">{t("cap.workflows")}</span>
            <div className="palette-items">
              {draft.workflows.map((row) => (
                <button
                  key={row.id}
                  className={`palette-item ${workflow?.id === row.id ? "is-active" : ""}`}
                  onClick={() => {
                    setSelectedWorkflowId(row.id);
                    setSelectedNodeId("");
                  }}
                >
                  {row.name}
                </button>
              ))}
              <button
                className="palette-item"
                disabled={readOnly}
                onClick={addWorkflow}
              >
                + {t("builder.newWorkflow")}
              </button>
            </div>
          </div>
          <div className="palette-group">
            <span className="palette-group-title">{t("flow.palette")}</span>
            <div className="palette-items">
              {(Object.keys(flowNodeLabels) as FlowNodeKind[]).map((kind) => (
                <button
                  key={kind}
                  className="palette-item"
                  disabled={readOnly || !workflow}
                  onClick={() => addNode(kind)}
                >
                  {t(flowNodeLabels[kind])}
                </button>
              ))}
            </div>
          </div>
          <details className="prepare-advanced">
            <summary>{t("flow.node.advanced")}</summary>
            <div className="palette-items">
              {ADVANCED_NODES.map((type) => (
                <button
                  key={type}
                  className="palette-item"
                  disabled={readOnly || !workflow}
                  onClick={() => {
                    if (!workflow) return;
                    const result = addNodeOfType(workflow, type, {
                      position: {
                        x: 40 + (workflow.nodes.length % 6) * 60,
                        y: 40 + (workflow.nodes.length % 6) * 70,
                      },
                    });
                    patchWorkflow(result.workflow);
                    selectNode(result.nodeId);
                  }}
                >
                  {t(workflowNodeLabels[type])}
                </button>
              ))}
            </div>
          </details>
          <div className="palette-group">
            <span className="palette-group-title">{t("flow.events")}</span>
            <div className="palette-items">
              {EVENT_TRIGGERS.map((trigger) => (
                <button
                  key={trigger}
                  className="palette-item"
                  disabled={readOnly}
                  onClick={() => addEvent(trigger)}
                >
                  {t(
                    `flow.event.${trigger === "timer" ? "time" : trigger}`,
                  )}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="flow-center">
          <div className="flow-canvas">
            {workflow ? (
              <Suspense
                fallback={<p className="builder-hint">{t("builder.loading")}</p>}
              >
                <WorkflowCanvas
                  workflow={workflow}
                  findings={findings}
                  readOnly={readOnly}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={selectNode}
                  onPatch={patchWorkflow}
                  labelOf={nodeLabel}
                  summaryOf={nodeSummary}
                />
              </Suspense>
            ) : (
              <p className="builder-hint">{t("builder.noWorkflow")}</p>
            )}
          </div>
          <div className="flow-timeline" aria-label={t("flow.timeline")}>
            <span className="palette-group-title">{t("flow.timeline")}</span>
            <div className="flow-chips">
              {orderedEvents.map((event) => {
                const link = links.find((row) => row.inject === event.id);
                const linked = link
                  ? draft.workflows.find((row) => row.id === link.workflow)
                  : undefined;
                return (
                  <button
                    key={event.id}
                    className={`flow-chip ${selectedEventId === event.id ? "is-selected" : ""}`}
                    onClick={() => selectEvent(event.id)}
                  >
                    <span className="flow-chip-time">
                      {event.trigger === "timer"
                        ? `${event.at}s`
                        : t(`flow.event.${event.trigger}`)}
                    </span>
                    <span>{event.name}</span>
                    {linked && (
                      <span className="flow-chip-link">
                        {t("flow.linksTo", { name: linked.name })}
                      </span>
                    )}
                  </button>
                );
              })}
              {!draft.injects.length && (
                <span className="flow-empty">{t("flow.addEvent")}</span>
              )}
            </div>
          </div>
        </div>

        <aside
          className="builder-inspector"
          aria-label={t("flow.inspector")}
        >
          <div className="builder-fields">
            {selectedEvent ? (
              <EventInspector
                event={selectedEvent}
                draft={draft}
                caps={caps}
                readOnly={readOnly}
                onChange={(next) => patchInject(selectedEvent.id, next)}
                onRemove={() => {
                  change({
                    ...draft,
                    injects: draft.injects.filter(
                      (row) => row.id !== selectedEvent.id,
                    ),
                  });
                  setSelectedEventId("");
                }}
              />
            ) : selectedNode && workflow ? (
              <>
                <label>
                  {t("builder.workflowName")}
                  <input
                    value={workflow.name}
                    disabled={readOnly}
                    onChange={(event) =>
                      patchWorkflow({
                        ...workflow,
                        name: event.target.value || "Workflow",
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
                      patchWorkflow({
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
                          patchWorkflow({
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
                          patchWorkflow({
                            ...workflow,
                            trigger: {
                              type: "prop",
                              prop:
                                trigger.type === "prop" ? trigger.prop : "",
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
                <label>
                  {t("builder.nodeName")}
                  <input
                    value={selectedNode.name}
                    disabled={readOnly}
                    onChange={(event) =>
                      patchWorkflow(
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
                  onChange={(node) => patchWorkflow(replaceNode(workflow, node))}
                />
                <span className="palette-group-title">
                  {t("flow.outputs")}
                </span>
                {workflowNodePorts(selectedNode).map((port) => {
                  const edge = edgeForOutput(workflow, selectedNode.id, port);
                  return (
                    <label key={port}>
                      {port}
                      <select
                        value={edge?.target ?? ""}
                        disabled={readOnly}
                        onChange={(event) =>
                          patchWorkflow(
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
                    patchWorkflow(removeNode(workflow, selectedNode.id));
                    setSelectedNodeId("");
                  }}
                >
                  {t("flow.remove")}
                </button>
              </>
            ) : (
              <p className="builder-hint">{t("flow.selectHint")}</p>
            )}

            <span className="palette-group-title">{t("flow.findings")}</span>
            <ul className="wf-findings">
              {[...workflowFindings, ...eventFindings].map((finding) => {
                const node = nodeForFinding(finding);
                const event = draft.injects.find(
                  (row) =>
                    finding.path.collection === "injects" &&
                    row.id === finding.path.id,
                );
                return (
                  <li key={finding.id} className={`is-${finding.severity}`}>
                    <button
                      onClick={() => {
                        if (node) selectNode(node.id);
                        else if (event) selectEvent(event.id);
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
                    <button onClick={() => selectEvent(inject.id)}>
                      {inject.id} · {inject.name} · {inject.trigger}
                    </button>
                  </li>
                ))}
              </ul>
              {workflow && (
                <>
                  <span className="palette-group-title">
                    {t("flow.variables")}
                  </span>
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
      </div>
    </section>
  );
}

function EventInspector({
  event,
  draft,
  caps,
  readOnly,
  onChange,
  onRemove,
}: {
  event: Inject;
  draft: Scenario;
  caps: PrepareSectionProps["caps"];
  readOnly: boolean;
  onChange: (next: Partial<Inject>) => void;
  onRemove: () => void;
}) {
  const station = draft.stations.find((row) => row.id === event.station);
  const setAction = (index: number, action: Action) =>
    onChange({
      actions: event.actions.map((row, i) => (i === index ? action : row)),
    });
  const actionTargets = (action: Action) => {
    if (action.type === "patient") return draft.patients;
    if (action.type === "release") return draft.dossiers;
    if (action.type === "objective") return draft.objectives;
    if (action.type === "camera")
      return draft.stations.filter((st) => st.module === "camera");
    if (action.type === "prop") return draft.props;
    return [];
  };
  return (
    <>
      <label>
        {t("flow.eventName")}
        <input
          value={event.name}
          disabled={readOnly}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </label>
      <label>
        {t("flow.eventTrigger")}
        <select
          value={event.trigger}
          disabled={readOnly}
          onChange={(e) =>
            onChange({
              trigger: e.target.value as Inject["trigger"],
              station:
                draft.stations.find((st) => st.role === "element")?.id ?? "",
              zone: draft.zones[0]?.id ?? "",
            })
          }
        >
          {EVENT_TRIGGERS.map((trigger) => (
            <option key={trigger} value={trigger}>
              {t(`flow.event.${trigger === "timer" ? "time" : trigger}`)}
            </option>
          ))}
        </select>
      </label>
      {event.trigger === "timer" && (
        <>
          <label>
            {t("flow.eventAt")}
            <input
              type="number"
              min={0}
              max={86400}
              value={event.at}
              disabled={readOnly}
              onChange={(e) => onChange({ at: Number(e.target.value) })}
            />
          </label>
          <label>
            {t("flow.eventJitter")}
            <input
              type="number"
              min={0}
              max={3600}
              value={event.jitter}
              disabled={readOnly}
              onChange={(e) => onChange({ jitter: Number(e.target.value) })}
            />
          </label>
        </>
      )}
      {event.trigger !== "timer" && event.trigger !== "manual" && (
        <label>
          {t("flow.eventStation")}
          <select
            value={event.station}
            disabled={readOnly}
            onChange={(e) => onChange({ station: e.target.value })}
          >
            <option value="">{t("builder.noneOption")}</option>
            {draft.stations
              .filter((st) => st.role === "element")
              .map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
          </select>
        </label>
      )}
      {event.trigger === "zone" && (
        <label>
          {t("flow.eventZone")}
          <select
            value={event.zone}
            disabled={readOnly}
            onChange={(e) => onChange({ zone: e.target.value })}
          >
            {draft.zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {event.trigger === "signal" && (
        <label>
          {t("flow.eventIntervention")}
          <select
            value={event.intervention}
            disabled={readOnly}
            onChange={(e) => onChange({ intervention: e.target.value })}
          >
            <option value="">{t("editor.chooseAction")}</option>
            {(moduleEvents[station?.module || ""] || []).map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      )}
      {event.trigger === "intervention" && (
        <label>
          {t("flow.eventIntervention")}
          <select
            value={event.intervention}
            disabled={readOnly}
            onChange={(e) => onChange({ intervention: e.target.value })}
          >
            {["treated", "tourniquet", "oxygen", "evacuated"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      )}
      <label>
        {t("flow.eventUnless")}
        <select
          value={event.unless}
          disabled={readOnly}
          onChange={(e) => onChange({ unless: e.target.value })}
        >
          <option value="">{t("editor.always")}</option>
          {["treated", "tourniquet", "oxygen", "evacuated"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={event.enabled}
          disabled={readOnly}
          onChange={(e) => onChange({ enabled: e.target.checked })}
        />
        {t("flow.eventActive")}
      </label>

      <span className="palette-group-title">{t("flow.eventActions")}</span>
      {event.actions.map((action, index) => (
        <div key={index} className="wf-variable">
          <label>
            {t("flow.action")}
            <select
              value={action.type}
              disabled={readOnly}
              onChange={(e) => {
                const type = e.target.value;
                setAction(
                  index,
                  type === "patient"
                    ? { type, target: draft.patients[0]?.id || "", kind: "desat" }
                    : type === "release"
                      ? { type, target: draft.dossiers[0]?.id || "" }
                      : type === "objective"
                        ? { type, target: draft.objectives[0]?.id || "" }
                        : type === "camera"
                          ? {
                              type,
                              target:
                                draft.stations.find(
                                  (st) => st.module === "camera",
                                )?.id || "",
                              offline: true,
                            }
                          : type === "prop"
                            ? {
                                type,
                                target: draft.props[0]?.id || "",
                                state: draft.props[0]?.states[0] || "",
                              }
                            : { type: "message", text: t("editor.newMessage") },
                );
              }}
            >
              <option value="message">{t("flow.actionMessage")}</option>
              {caps.patients && (
                <option value="patient">{t("flow.actionPatient")}</option>
              )}
              {caps.dossiers && (
                <option value="release">{t("flow.actionRelease")}</option>
              )}
              {caps.objectives && (
                <option value="objective">{t("flow.actionObjective")}</option>
              )}
              <option value="camera">{t("flow.actionCamera")}</option>
              {caps.props && (
                <option value="prop">{t("flow.actionProp")}</option>
              )}
            </select>
          </label>
          {action.type === "message" ? (
            <label>
              {t("flow.actionMessage")}
              <input
                value={action.text}
                disabled={readOnly}
                onChange={(e) =>
                  setAction(index, { ...action, text: e.target.value })
                }
              />
            </label>
          ) : (
            <label>
              {t("flow.actionTarget")}
              <select
                value={action.target}
                disabled={readOnly}
                onChange={(e) =>
                  setAction(index, { ...action, target: e.target.value })
                }
              >
                {actionTargets(action).map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {action.type === "patient" && (
            <label>
              {t("prep.people.patientState")}
              <select
                value={action.kind}
                disabled={readOnly}
                onChange={(e) =>
                  setAction(index, {
                    ...action,
                    kind: e.target.value as typeof action.kind,
                  })
                }
              >
                {[
                  "stable",
                  "tachy",
                  "brady",
                  "desat",
                  "trauma",
                  "arrest",
                  "recovered",
                ].map((kind) => (
                  <option key={kind}>{kind}</option>
                ))}
              </select>
            </label>
          )}
          {action.type === "prop" && (
            <label>
              {t("flow.propState")}
              <select
                value={action.state}
                disabled={readOnly}
                onChange={(e) =>
                  setAction(index, { ...action, state: e.target.value })
                }
              >
                {(draft.props.find((row) => row.id === action.target)?.states ??
                  []).map((state) => (
                  <option key={state}>{state}</option>
                ))}
              </select>
            </label>
          )}
          {action.type === "camera" && (
            <label className="check">
              <input
                type="checkbox"
                checked={action.offline}
                disabled={readOnly}
                onChange={(e) =>
                  setAction(index, { ...action, offline: e.target.checked })
                }
              />
              {t("editor.signalLost")}
            </label>
          )}
          <button
            disabled={readOnly || event.actions.length <= 1}
            onClick={() =>
              onChange({
                actions: event.actions.filter((_, i) => i !== index),
              })
            }
          >
            {t("flow.removeAction")}
          </button>
        </div>
      ))}
      <button
        disabled={readOnly}
        onClick={() =>
          onChange({
            actions: [
              ...event.actions,
              { type: "message", text: t("editor.newMessage") },
            ],
          })
        }
      >
        {t("flow.addAction")}
      </button>
      <button className="danger" disabled={readOnly} onClick={onRemove}>
        {t("flow.remove")}
      </button>
    </>
  );
}
