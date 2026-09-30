import { useCallback, useState } from "react";
import type { Finding } from "../core/missionLint";
import {
  addNodeOfType,
  addVariable,
  createWorkflow,
  defaultValueFor,
  edgeForOutput,
  newVariable,
  nodeSummary,
  removeNode,
  removeVariable,
  renameVariable,
  replaceNode,
  replaceVariable,
  setOutputTarget,
  workflowNodeLabels,
  workflowNodeTypes,
  workflowUid,
} from "../core/workflowEdit";
import {
  workflowNodePorts,
  type Workflow,
} from "../core/workflow";
import type { Scenario } from "../core/training";
import { t } from "../i18n";
import { WorkflowCanvas } from "./WorkflowCanvas";
import { NodeFields, ValueInput } from "./WorkflowFields";
import "./workflow-graph.css";

type WorkflowGraphProps = {
  draft: Scenario;
  commit: (next: Scenario) => void;
  readOnly: boolean;
  findings: Finding[];
};

// Legacy graph editor kept for the demo sandbox and compatibility. The
// preparation flow workspace (FlowSection) is the primary authoring surface.
export function WorkflowGraph({
  draft,
  commit,
  readOnly,
  findings,
}: WorkflowGraphProps) {
  const [selectedId, setSelectedId] = useState(draft.workflows[0]?.id ?? "");
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const workflow =
    draft.workflows.find((row) => row.id === selectedId) ?? draft.workflows[0];

  const patch = useCallback(
    (next: Workflow) =>
      commit({
        ...draft,
        workflows: draft.workflows.map((row) =>
          row.id === next.id ? next : row,
        ),
      }),
    [commit, draft],
  );

  const addWorkflow = () => {
    const id = workflowUid("wf");
    const next = createWorkflow(id);
    commit({ ...draft, workflows: [...draft.workflows, next] });
    setSelectedId(id);
    setSelectedNodeId("");
  };

  const deleteWorkflow = () => {
    if (!workflow) return;
    commit({
      ...draft,
      workflows: draft.workflows.filter((row) => row.id !== workflow.id),
    });
    setSelectedId("");
    setSelectedNodeId("");
  };

  if (!workflow)
    return (
      <div className="builder-flow">
        <p className="builder-hint">{t("builder.noWorkflow")}</p>
        <button onClick={addWorkflow} disabled={readOnly}>
          {t("builder.newWorkflow")}
        </button>
      </div>
    );

  const trigger = workflow.trigger;
  const selectedNode = workflow.nodes.find((row) => row.id === selectedNodeId);
  const workflowFindings = findings.filter(
    (finding) =>
      finding.path.collection === "workflows" &&
      finding.path.id === workflow.id,
  );
  const nodeForFinding = (finding: Finding) =>
    workflow.nodes.find(
      (node) =>
        finding.id.startsWith(`graph-wf-exit-${workflow.id}-${node.id}-`) ||
        finding.id.startsWith(`graph-wf-unreachable-${workflow.id}-${node.id}`) ||
        finding.id.startsWith(`graph-wf-terminal-${workflow.id}-${node.id}`) ||
        finding.id.startsWith(`graph-wf-task-${workflow.id}-${node.id}`),
    );

  return (
    <div className="builder-flow">
      <aside className="builder-palette" aria-label={t("builder.workflows")}>
        <div className="palette-group">
          <span className="palette-group-title">{t("builder.workflows")}</span>
          <div className="palette-items">
            {draft.workflows.map((row) => (
              <button
                key={row.id}
                className={`palette-item ${row.id === workflow.id ? "is-active" : ""}`}
                onClick={() => {
                  setSelectedId(row.id);
                  setSelectedNodeId("");
                }}
              >
                {row.name}
              </button>
            ))}
            <button
              className="palette-item"
              onClick={addWorkflow}
              disabled={readOnly}
            >
              + {t("builder.newWorkflow")}
            </button>
          </div>
        </div>
        <div className="palette-group">
          <span className="palette-group-title">{t("builder.nodePalette")}</span>
          <div className="palette-items">
            {workflowNodeTypes.map((type) => (
              <button
                key={type}
                className="palette-item"
                disabled={readOnly}
                onClick={() => {
                  const result = addNodeOfType(workflow, type, {
                    position: {
                      x: 40 + (workflow.nodes.length % 6) * 60,
                      y: 40 + (workflow.nodes.length % 6) * 70,
                    },
                  });
                  patch(result.workflow);
                  setSelectedNodeId(result.nodeId);
                }}
              >
                {t(workflowNodeLabels[type])}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div className="builder-board wf-board">
        <WorkflowCanvas
          workflow={workflow}
          findings={findings}
          readOnly={readOnly}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          onPatch={patch}
          labelOf={(node) => workflowNodeLabels[node.type]}
          summaryOf={nodeSummary}
        />
      </div>

      <aside className="builder-inspector" aria-label={t("builder.nodeInspector")}>
        <div className="builder-fields">
          <label>
            {t("builder.workflowName")}
            <input
              value={workflow.name}
              disabled={readOnly}
              onChange={(event) =>
                patch({ ...workflow, name: event.target.value || "Workflow" })
              }
            />
          </label>
          <label>
            {t("builder.trigger")}
            <select
              value={trigger.type}
              disabled={readOnly}
              onChange={(event) =>
                patch({
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
              <option value="manual">{t("builder.triggerManual")}</option>
              <option value="prop">{t("builder.triggerProp")}</option>
            </select>
          </label>
          {trigger.type === "prop" && (
            <>
              <label>
                {t("builder.prop")}
                <select
                  value={trigger.prop}
                  disabled={readOnly}
                  onChange={(event) =>
                    patch({
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
                {t("builder.triggerState")}
                <select
                  value={trigger.to}
                  disabled={readOnly}
                  onChange={(event) =>
                    patch({
                      ...workflow,
                      trigger: {
                        type: "prop",
                        prop: trigger.prop,
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
          {selectedNode ? (
            <>
              <label>
                {t("builder.nodeName")}
                <input
                  value={selectedNode.name}
                  disabled={readOnly}
                  onChange={(event) =>
                    patch(
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
                onChange={(node) => patch(replaceNode(workflow, node))}
              />
              <span className="palette-group-title">{t("builder.output")}</span>
              {workflowNodePorts(selectedNode).map((port) => {
                const edge = edgeForOutput(workflow, selectedNode.id, port);
                return (
                  <label key={port}>
                    {port}
                    <select
                      value={edge?.target ?? ""}
                      disabled={readOnly}
                      onChange={(event) =>
                        patch(
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
                            {node.name || t(workflowNodeLabels[node.type])} ·{" "}
                            {node.id}
                          </option>
                        ))}
                    </select>
                  </label>
                );
              })}
              <p className="builder-hint">{t("builder.connectHint")}</p>
              <button
                className="danger"
                disabled={readOnly || selectedNode.id === workflow.entry}
                onClick={() => {
                  patch(removeNode(workflow, selectedNode.id));
                  setSelectedNodeId("");
                }}
              >
                {t("builder.removeNode")}
              </button>
            </>
          ) : (
            <p className="builder-hint">{t("builder.hint")}</p>
          )}

          <span className="palette-group-title">{t("builder.variables")}</span>
          {workflow.variables.map((variable) => (
            <div key={variable.id} className="wf-variable">
              <input
                aria-label={t("builder.variable")}
                value={variable.id}
                disabled={readOnly}
                onChange={(event) => {
                  if (/^[a-zA-Z0-9_-]{0,40}$/.test(event.target.value))
                    patch(
                      renameVariable(workflow, variable.id, event.target.value),
                    );
                }}
              />
              <select
                aria-label={t("builder.variableKind")}
                value={variable.kind}
                disabled={readOnly}
                onChange={(event) => {
                  const kind = event.target
                    .value as (typeof variable)["kind"];
                  patch(
                    replaceVariable(workflow, {
                      ...variable,
                      kind,
                      values:
                        kind === "enum"
                          ? variable.values.length
                            ? variable.values
                            : ["a", "b"]
                          : [],
                      initial: defaultValueFor({ ...variable, kind }),
                    }),
                  );
                }}
              >
                {["boolean", "number", "string", "enum"].map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
              <ValueInput
                variable={variable}
                value={variable.initial}
                disabled={readOnly}
                onChange={(value) =>
                  patch(replaceVariable(workflow, { ...variable, initial: value }))
                }
              />
              {variable.kind === "enum" && (
                <input
                  aria-label={t("builder.variableValues")}
                  value={variable.values.join(", ")}
                  disabled={readOnly}
                  onChange={(event) => {
                    const values = event.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean)
                      .slice(0, 20);
                    patch(
                      replaceVariable(workflow, {
                        ...variable,
                        values,
                        initial: values.includes(String(variable.initial))
                          ? variable.initial
                          : (values[0] ?? ""),
                      }),
                    );
                  }}
                />
              )}
              <label className="check">
                <input
                  type="checkbox"
                  checked={variable.secret}
                  disabled={readOnly}
                  onChange={(event) =>
                    patch(
                      replaceVariable(workflow, {
                        ...variable,
                        secret: event.target.checked,
                      }),
                    )
                  }
                />
                {t("builder.variableSecret")}
              </label>
              <button
                className="danger"
                disabled={readOnly}
                onClick={() => patch(removeVariable(workflow, variable.id))}
              >
                {t("builder.deleteVariable")}
              </button>
            </div>
          ))}
          <button
            disabled={readOnly}
            onClick={() => patch(addVariable(workflow, newVariable()))}
          >
            + {t("builder.addVariable")}
          </button>

          <span className="palette-group-title">{t("builder.flowFindings")}</span>
          <ul className="wf-findings">
            {workflowFindings.map((finding) => {
              const node = nodeForFinding(finding);
              return (
                <li key={finding.id} className={`is-${finding.severity}`}>
                  <button
                    onClick={() => node && setSelectedNodeId(node.id)}
                    disabled={!node}
                  >
                    {finding.message}
                  </button>
                </li>
              );
            })}
            {!workflowFindings.length && (
              <li className="is-ok">{t("builder.flowOk")}</li>
            )}
          </ul>

          <button className="danger" disabled={readOnly} onClick={deleteWorkflow}>
            {t("builder.deleteWorkflow")}
          </button>
        </div>
      </aside>
    </div>
  );
}
