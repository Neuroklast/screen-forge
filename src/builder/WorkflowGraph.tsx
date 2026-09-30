import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Finding } from "../core/missionLint";
import { taskBlock, taskBlocks, type UiField } from "../core/taskBlocks";
import { conditionOperators, workflowNodePorts } from "../core/workflow";
import {
  addEdge,
  addNodeOfType,
  addVariable,
  autoLayout,
  createWorkflow,
  defaultValueFor,
  edgeForOutput,
  newVariable,
  nodeFindingIds,
  nodeSummary,
  removeEdge,
  removeNode,
  removeVariable,
  renameVariable,
  replaceNode,
  replaceVariable,
  setNodePosition,
  setOutputTarget,
  workflowNodeLabels,
  workflowNodeTypes,
  workflowSurfaces,
  workflowUid,
  type WorkflowNodeType,
} from "../core/workflowEdit";
import type {
  Workflow,
  WorkflowNode,
  WorkflowValue,
  WorkflowVariable,
} from "../core/workflow";
import type { Scenario } from "../core/training";
import { t } from "../i18n";
import "./workflow-graph.css";

type WorkflowGraphProps = {
  draft: Scenario;
  commit: (next: Scenario) => void;
  readOnly: boolean;
  findings: Finding[];
};

type WorkflowNodeData = {
  node: WorkflowNode;
  ports: string[];
  errors: number;
  isEntry: boolean;
};

type FlowNode = Node<WorkflowNodeData, "workflow">;

function WorkflowNodeCard({ data, selected }: NodeProps<FlowNode>) {
  return (
    <div
      className={`wf-node ${selected ? "is-selected" : ""} ${
        data.errors ? "has-error" : ""
      }`}
    >
      <Handle type="target" position={Position.Left} />
      <header>
        <span className="wf-node-type">{t(workflowNodeLabels[data.node.type])}</span>
        {data.isEntry && (
          <span className="wf-node-entry">{t("builder.workflowEntry")}</span>
        )}
      </header>
      <strong>{data.node.name || nodeSummary(data.node) || "—"}</strong>
      <ul className="wf-node-ports">
        {data.ports.map((port) => (
          <li key={port}>{port}</li>
        ))}
      </ul>
      {data.ports.map((port, index) => (
        <Handle
          key={port}
          id={port}
          type="source"
          position={Position.Right}
          style={{
            top: `${((index + 1) / (data.ports.length + 1)) * 100}%`,
          }}
        />
      ))}
    </div>
  );
}

const nodeTypes = { workflow: WorkflowNodeCard } satisfies NodeTypes;

function VariableSelect({
  label,
  value,
  variables,
  kind,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  variables: WorkflowVariable[];
  kind?: WorkflowVariable["kind"];
  disabled: boolean;
  onChange: (id: string) => void;
}) {
  const options = kind ? variables.filter((v) => v.kind === kind) : variables;
  return (
    <label>
      {label}
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{t("builder.noneOption")}</option>
        {options.map((variable) => (
          <option key={variable.id} value={variable.id}>
            {variable.id}
          </option>
        ))}
      </select>
    </label>
  );
}

function ValueInput({
  variable,
  value,
  disabled,
  onChange,
}: {
  variable?: WorkflowVariable;
  value: WorkflowValue;
  disabled: boolean;
  onChange: (value: WorkflowValue) => void;
}) {
  if (variable?.kind === "boolean")
    return (
      <label className="check">
        <input
          type="checkbox"
          checked={value === true}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        {t("builder.value")}
      </label>
    );
  if (variable?.kind === "enum")
    return (
      <label>
        {t("builder.value")}
        <select
          value={String(value)}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        >
          {variable.values.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
      </label>
    );
  if (variable?.kind === "number")
    return (
      <label>
        {t("builder.value")}
        <input
          type="number"
          value={Number(value ?? 0)}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </label>
    );
  return (
    <label>
      {t("builder.value")}
      <input
        value={String(value ?? "")}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function FieldInput({
  field,
  value,
  variables,
  disabled,
  onChange,
}: {
  field: UiField;
  value: unknown;
  variables: WorkflowVariable[];
  disabled: boolean;
  onChange: (value: unknown) => void;
}) {
  if (field.path === "expectedValueRef")
    return (
      <VariableSelect
        label={field.label}
        value={String(value ?? "")}
        variables={variables}
        kind="string"
        disabled={disabled}
        onChange={onChange}
      />
    );
  if (field.control === "toggle")
    return (
      <label className="check">
        <input
          type="checkbox"
          checked={value === true}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        {field.label}
      </label>
    );
  if (field.control === "lines")
    return (
      <label>
        {field.label}
        <textarea
          value={((value as string[] | undefined) ?? []).join("\n")}
          disabled={disabled}
          onChange={(event) =>
            onChange(
              event.target.value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .slice(0, 20),
            )
          }
        />
      </label>
    );
  if (field.control === "number" || field.control === "duration")
    return (
      <label>
        {field.label}
        <input
          type="number"
          value={Number(value ?? 0)}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </label>
    );
  return (
    <label>
      {field.label}
      <input
        value={String(value ?? "")}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function NodeFields({
  node,
  workflow,
  draft,
  readOnly,
  onChange,
}: {
  node: WorkflowNode;
  workflow: Workflow;
  draft: Scenario;
  readOnly: boolean;
  onChange: (node: WorkflowNode) => void;
}) {
  const variableOf = (id: string) =>
    workflow.variables.find((variable) => variable.id === id);
  switch (node.type) {
    case "start":
      return null;
    case "end":
      return (
        <label>
          {t("builder.outcome")}
          <select
            value={node.outcome}
            disabled={readOnly}
            onChange={(event) =>
              onChange({
                ...node,
                outcome: event.target.value as "success" | "failure",
              })
            }
          >
            <option value="success">{t("builder.success")}</option>
            <option value="failure">{t("builder.failure")}</option>
          </select>
        </label>
      );
    case "task": {
      const block = taskBlock(node.task);
      const parsed = block?.schema.safeParse(node.config);
      const config = (parsed?.success ? parsed.data : node.config) as Record<
        string,
        unknown
      >;
      const setConfig = (patch: Record<string, unknown>) =>
        onChange({ ...node, config: { ...node.config, ...patch } });
      return (
        <>
          <label>
            {t("builder.taskType")}
            <select
              value={node.task}
              disabled={readOnly}
              onChange={(event) => {
                const taskType = event.target.value;
                onChange({
                  ...node,
                  task: taskType,
                  config: taskBlock(taskType)?.defaults() ?? {},
                });
              }}
            >
              {taskBlocks().map((definition) => (
                <option key={definition.type} value={definition.type}>
                  {definition.type}
                </option>
              ))}
            </select>
          </label>
          {block?.ui.fields.map((field) => (
            <FieldInput
              key={field.path}
              field={field}
              value={config[field.path]}
              variables={workflow.variables}
              disabled={readOnly}
              onChange={(value) => setConfig({ [field.path]: value })}
            />
          ))}
          {(node.task === "wait-for-event" || node.task === "connect") && (
            <>
              <label>
                {t("builder.prop")}
                <select
                  value={String(config.prop ?? "")}
                  disabled={readOnly}
                  onChange={(event) =>
                    setConfig({ prop: event.target.value, to: "" })
                  }
                >
                  <option value="">{t("builder.noneOption")}</option>
                  {draft.props.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("builder.propState")}
                <select
                  value={String(config.to ?? "")}
                  disabled={readOnly}
                  onChange={(event) => setConfig({ to: event.target.value })}
                >
                  <option value="">{t("builder.noneOption")}</option>
                  {(draft.props.find(
                    (row) => row.id === String(config.prop ?? ""),
                  )?.states ?? []).map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          {node.task === "choice" &&
            (() => {
              const options =
                (config.options as
                  | { id: string; label: string }[]
                  | undefined) ?? [];
              return (
                <>
                  <span className="palette-group-title">
                    {t("builder.options")}
                  </span>
                  {options.map((option, index) => (
                    <div key={index} className="wf-option-row">
                      <input
                        aria-label={t("builder.optionId")}
                        value={option.id}
                        disabled={readOnly}
                        onChange={(event) => {
                          const next = [...options];
                          next[index] = { ...option, id: event.target.value };
                          setConfig({ options: next });
                        }}
                      />
                      <input
                        aria-label={t("builder.optionLabel")}
                        value={option.label}
                        disabled={readOnly}
                        onChange={(event) => {
                          const next = [...options];
                          next[index] = { ...option, label: event.target.value };
                          setConfig({ options: next });
                        }}
                      />
                      <button
                        aria-label={t("builder.remove")}
                        disabled={readOnly || options.length <= 2}
                        onClick={() =>
                          setConfig({
                            options: options.filter((_, i) => i !== index),
                          })
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    disabled={readOnly || options.length >= 6}
                    onClick={() => {
                      let n = options.length + 1;
                      while (options.some((o) => o.id === `o${n}`)) n++;
                      setConfig({
                        options: [...options, { id: `o${n}`, label: "" }],
                      });
                    }}
                  >
                    + {t("builder.addOption")}
                  </button>
                </>
              );
            })()}
          {node.task === "report" &&
            (() => {
              const fields =
                (config.fields as { id: string; label: string }[] | undefined) ??
                [];
              return (
                <>
                  <span className="palette-group-title">
                    {t("builder.reportFields")}
                  </span>
                  {fields.map((field, index) => (
                    <div key={index} className="wf-option-row">
                      <input
                        aria-label={t("builder.fieldId")}
                        value={field.id}
                        disabled={readOnly}
                        onChange={(event) => {
                          const next = [...fields];
                          next[index] = { ...field, id: event.target.value };
                          setConfig({ fields: next });
                        }}
                      />
                      <input
                        aria-label={t("builder.fieldLabel")}
                        value={field.label}
                        disabled={readOnly}
                        onChange={(event) => {
                          const next = [...fields];
                          next[index] = { ...field, label: event.target.value };
                          setConfig({ fields: next });
                        }}
                      />
                      <button
                        aria-label={t("builder.remove")}
                        disabled={readOnly || fields.length <= 1}
                        onClick={() =>
                          setConfig({
                            fields: fields.filter((_, i) => i !== index),
                          })
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    disabled={readOnly || fields.length >= 6}
                    onClick={() => {
                      let n = fields.length + 1;
                      while (fields.some((f) => f.id === `f${n}`)) n++;
                      setConfig({
                        fields: [...fields, { id: `f${n}`, label: "" }],
                      });
                    }}
                  >
                    + {t("builder.addField")}
                  </button>
                </>
              );
            })()}
          {node.task === "inspect" && (
            <label>
              {t("builder.lines")}
              <textarea
                value={((config.lines as string[] | undefined) ?? []).join("\n")}
                disabled={readOnly}
                onChange={(event) =>
                  setConfig({
                    lines: event.target.value
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .slice(0, 8),
                  })
                }
              />
            </label>
          )}
        </>
      );
    }
    case "condition":
      return (
        <>
          <VariableSelect
            label={t("builder.variable")}
            value={node.variable}
            variables={workflow.variables}
            disabled={readOnly}
            onChange={(id) =>
              onChange({
                ...node,
                variable: id,
                value: variableOf(id)
                  ? defaultValueFor(variableOf(id)!)
                  : node.value,
              })
            }
          />
          <label>
            {t("builder.operator")}
            <select
              value={node.operator}
              disabled={readOnly}
              onChange={(event) =>
                onChange({
                  ...node,
                  operator: event.target
                    .value as (typeof conditionOperators)[number],
                })
              }
            >
              {conditionOperators.map((operator) => (
                <option key={operator} value={operator}>
                  {operator}
                </option>
              ))}
            </select>
          </label>
          <ValueInput
            variable={variableOf(node.variable)}
            value={node.value}
            disabled={readOnly}
            onChange={(value) => onChange({ ...node, value })}
          />
        </>
      );
    case "set-variable":
      return (
        <>
          <VariableSelect
            label={t("builder.variable")}
            value={node.variable}
            variables={workflow.variables}
            disabled={readOnly}
            onChange={(id) =>
              onChange({
                ...node,
                variable: id,
                value: variableOf(id)
                  ? defaultValueFor(variableOf(id)!)
                  : node.value,
              })
            }
          />
          <ValueInput
            variable={variableOf(node.variable)}
            value={node.value}
            disabled={readOnly}
            onChange={(value) => onChange({ ...node, value })}
          />
        </>
      );
    case "increment":
      return (
        <>
          <VariableSelect
            label={t("builder.variable")}
            value={node.variable}
            variables={workflow.variables}
            kind="number"
            disabled={readOnly}
            onChange={(id) => onChange({ ...node, variable: id })}
          />
          <label>
            {t("builder.step")}
            <input
              type="number"
              value={node.by}
              disabled={readOnly}
              onChange={(event) =>
                onChange({ ...node, by: Number(event.target.value) })
              }
            />
          </label>
        </>
      );
    case "delay":
      return (
        <label>
          {t("builder.seconds")}
          <input
            type="number"
            min={0}
            value={node.seconds}
            disabled={readOnly}
            onChange={(event) =>
              onChange({ ...node, seconds: Number(event.target.value) })
            }
          />
        </label>
      );
    case "show-surface":
      return (
        <>
          <label>
            {t("builder.station")}
            <select
              value={node.station}
              disabled={readOnly}
              onChange={(event) =>
                onChange({ ...node, station: event.target.value })
              }
            >
              <option value="">{t("builder.noneOption")}</option>
              {draft.stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("builder.surface")}
            <select
              value={node.surface}
              disabled={readOnly}
              onChange={(event) =>
                onChange({ ...node, surface: event.target.value })
              }
            >
              {workflowSurfaces.map((surface) => (
                <option key={surface} value={surface}>
                  {surface}
                </option>
              ))}
            </select>
          </label>
        </>
      );
    case "set-prop-state": {
      const prop = draft.props.find((row) => row.id === node.prop);
      return (
        <>
          <label>
            {t("builder.prop")}
            <select
              value={node.prop}
              disabled={readOnly}
              onChange={(event) =>
                onChange({
                  ...node,
                  prop: event.target.value,
                  state: "",
                })
              }
            >
              <option value="">{t("builder.noneOption")}</option>
              {draft.props.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("builder.propState")}
            <select
              value={node.state}
              disabled={readOnly}
              onChange={(event) =>
                onChange({ ...node, state: event.target.value })
              }
            >
              <option value="">{t("builder.noneOption")}</option>
              {(prop?.states ?? []).map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>
        </>
      );
    }
    case "complete-objective":
      return (
        <label>
          {t("builder.objective")}
          <select
            value={node.objective}
            disabled={readOnly}
            onChange={(event) =>
              onChange({ ...node, objective: event.target.value })
            }
          >
            <option value="">{t("builder.noneOption")}</option>
            {draft.objectives.map((objective) => (
              <option key={objective.id} value={objective.id}>
                {objective.name}
              </option>
            ))}
          </select>
        </label>
      );
  }
}

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

  const layout = useMemo(
    () => (workflow ? autoLayout(workflow) : {}),
    [workflow],
  );
  const renderKey = workflow ? JSON.stringify(workflow) : "";

  const flowNodes: FlowNode[] = useMemo(
    () =>
      workflow
        ? workflow.nodes.map((node) => ({
            id: node.id,
            type: "workflow" as const,
            position: node.position ??
              layout[node.id] ?? { x: 0, y: 0 },
            data: {
              node,
              ports: workflowNodePorts(node),
              errors: nodeFindingIds(findings, workflow.id, node.id).length,
              isEntry: node.id === workflow.entry,
            },
          }))
        : [],
    [workflow, layout, findings],
  );
  const flowEdges: Edge[] = useMemo(
    () =>
      workflow
        ? workflow.edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.output,
            label: edge.output,
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
          }))
        : [],
    [workflow],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);
  // Re-sync when the workflow structure or its values change.
  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [renderKey, selectedId, setNodes, setEdges, flowNodes, flowEdges]);

  const handleNodesChange = useCallback(
    (changes: NodeChange<FlowNode>[]) => {
      onNodesChange(changes);
      if (!workflow || readOnly) return;
      const removed = changes.filter((change) => change.type === "remove");
      if (removed.length) {
        let next = workflow;
        for (const change of removed) next = removeNode(next, change.id);
        patch(next);
        if (removed.some((change) => change.id === selectedNodeId))
          setSelectedNodeId("");
        return;
      }
      const moved = changes.filter(
        (change) => change.type === "position" && change.dragging === false,
      );
      if (moved.length) {
        let next = workflow;
        for (const change of moved)
          if (change.type === "position" && change.position)
            next = setNodePosition(next, change.id, change.position);
        patch(next);
      }
    },
    [workflow, readOnly, patch, onNodesChange, selectedNodeId],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      if (!workflow || readOnly) return;
      for (const change of changes)
        if (change.type === "remove") patch(removeEdge(workflow, change.id));
    },
    [workflow, readOnly, patch, onEdgesChange],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (
        !workflow ||
        readOnly ||
        !connection.source ||
        !connection.target ||
        !connection.sourceHandle
      )
        return;
      if (connection.source === connection.target) return;
      if (connection.target === workflow.entry) return;
      if (
        workflow.edges.some(
          (edge) =>
            edge.source === connection.source &&
            edge.output === connection.sourceHandle,
        )
      )
        return;
      patch(
        addEdge(workflow, {
          id: workflowUid("e"),
          source: connection.source,
          output: connection.sourceHandle,
          target: connection.target,
        }),
      );
    },
    [workflow, readOnly, patch],
  );

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
      (node) => nodeFindingIds([finding], workflow.id, node.id).length > 0,
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
        <ReactFlow
          key={workflow.id}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId("")}
          fitView
          minZoom={0.3}
          maxZoom={1.6}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          edgesFocusable={false}
          deleteKeyCode={readOnly ? null : "Delete"}
        >
          <Background gap={24} size={1} color="#1e2a33" />
          <Controls showInteractive={false} />
        </ReactFlow>
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
                    patch(renameVariable(workflow, variable.id, event.target.value));
                }}
              />
              <select
                aria-label={t("builder.variableKind")}
                value={variable.kind}
                disabled={readOnly}
                onChange={(event) => {
                  const kind = event.target
                    .value as WorkflowVariable["kind"];
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
          <button disabled={readOnly} onClick={() => patch(addVariable(workflow, newVariable()))}>
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
