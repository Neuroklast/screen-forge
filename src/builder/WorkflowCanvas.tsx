import { useCallback, useEffect, useMemo } from "react";
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
import {
  workflowNodePorts,
  type Workflow,
  type WorkflowNode,
} from "../core/workflow";
import {
  addEdge,
  autoLayout,
  flowKindOfNode,
  flowNodeLabels,
  nodeFindingIds,
  nodeSummary,
  removeEdge,
  removeNode,
  setNodePosition,
  workflowNodeLabels,
  workflowPortLabel,
  workflowUid,
} from "../core/workflowEdit";
import { t } from "../i18n";
import "./workflow-graph.css";

type WorkflowNodeData = {
  node: WorkflowNode;
  ports: string[];
  portLabels: string[];
  errors: number;
  isEntry: boolean;
  label: string;
  summary: string;
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
        <span className="wf-node-type">{t(data.label)}</span>
        {data.isEntry && (
          <span className="wf-node-entry">{t("builder.workflowEntry")}</span>
        )}
      </header>
      <strong>{data.node.name || data.summary || "—"}</strong>
      <ul className="wf-node-ports">
        {data.portLabels.map((port, index) => (
          <li key={data.ports[index]}>{port}</li>
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

// Shared React Flow canvas. The preparation flow workspace renders it with
// human node/port labels; the legacy builder view keeps the technical labels.
export function WorkflowCanvas({
  workflow,
  findings,
  readOnly,
  selectedNodeId,
  onSelectNode,
  onPatch,
  variant = "legacy",
}: {
  workflow: Workflow;
  findings: Finding[];
  readOnly: boolean;
  selectedNodeId: string;
  onSelectNode: (id: string) => void;
  onPatch: (next: Workflow) => void;
  variant?: "legacy" | "human";
}) {
  const layout = useMemo(() => autoLayout(workflow), [workflow]);
  const renderKey = JSON.stringify(workflow);

  const flowNodes: FlowNode[] = useMemo(
    () =>
      workflow.nodes.map((node) => {
        const ports = workflowNodePorts(node);
        const kind = flowKindOfNode(node);
        const label =
          variant === "human"
            ? kind === "advanced"
              ? workflowNodeLabels[node.type]
              : flowNodeLabels[kind]
            : workflowNodeLabels[node.type];
        return {
          id: node.id,
          type: "workflow" as const,
          position: node.position ?? layout[node.id] ?? { x: 0, y: 0 },
          data: {
            node,
            ports,
            portLabels: ports.map((port) =>
              variant === "human" ? t(workflowPortLabel(port)) : port,
            ),
            errors: nodeFindingIds(findings, workflow.id, node.id).length,
            isEntry: node.id === workflow.entry,
            label,
            summary: nodeSummary(node),
          },
        };
      }),
    [workflow, layout, findings, variant],
  );
  const flowEdges: Edge[] = useMemo(
    () =>
      workflow.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.output,
        label: variant === "human" ? t(workflowPortLabel(edge.output)) : edge.output,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
      })),
    [workflow, variant],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);
  // Re-sync when the workflow structure or its values change.
  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [renderKey, setNodes, setEdges, flowNodes, flowEdges]);

  const handleNodesChange = useCallback(
    (changes: NodeChange<FlowNode>[]) => {
      onNodesChange(changes);
      if (readOnly) return;
      const removed = changes.filter((change) => change.type === "remove");
      if (removed.length) {
        let next = workflow;
        for (const change of removed) next = removeNode(next, change.id);
        onPatch(next);
        if (removed.some((change) => change.id === selectedNodeId))
          onSelectNode("");
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
        onPatch(next);
      }
    },
    [workflow, readOnly, onPatch, onNodesChange, selectedNodeId, onSelectNode],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      if (readOnly) return;
      for (const change of changes)
        if (change.type === "remove") onPatch(removeEdge(workflow, change.id));
    },
    [workflow, readOnly, onPatch, onEdgesChange],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (
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
      onPatch(
        addEdge(workflow, {
          id: workflowUid("e"),
          source: connection.source,
          output: connection.sourceHandle,
          target: connection.target,
        }),
      );
    },
    [workflow, readOnly, onPatch],
  );

  return (
    <ReactFlow
      key={workflow.id}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={handleNodesChange}
      onEdgesChange={handleEdgesChange}
      onConnect={handleConnect}
      onNodeClick={(_, node) => onSelectNode(node.id)}
      onPaneClick={() => onSelectNode("")}
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
  );
}
