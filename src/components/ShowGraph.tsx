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
import {
  connect,
  disconnect,
  graphUid,
  moveNode,
  removeNode,
} from "../core/graphEdit";
import {
  showNodePorts,
  type Show,
  type ShowEdge,
  type ShowFinding,
  type ShowNode,
} from "../core/director";
import { labelFor } from "../core/labels";
import { t } from "../i18n";
import "../builder/workflow-graph.css";

function nodeSummary(node: ShowNode): string {
  if (node.kind !== "take") return "";
  return labelFor("scene", node.config.scene);
}

type FilmNodeData = {
  node: ShowNode;
  ports: string[];
  portLabels: string[];
  errors: number;
  isEntry: boolean;
  highlighted: boolean;
  label: string;
  summary: string;
};

type FilmNode = Node<FilmNodeData, "film">;

function FilmNodeCard({ data, selected }: NodeProps<FilmNode>) {
  return (
    <div
      className={`wf-node ${selected ? "is-selected" : ""} ${
        data.errors ? "has-error" : ""
      } ${data.highlighted ? "is-highlighted" : ""}`}
    >
      <Handle type="target" position={Position.Left} />
      <header>
        <span className="wf-node-type">{data.label}</span>
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

const nodeTypes = { film: FilmNodeCard } satisfies NodeTypes;

// Film graph canvas. Same topology API as the training canvas; only the node
// payload (scene/config/cue/trigger) differs. Every take exposes visible
// success/fail/timeout ports and there is no pagination.
export function ShowGraph({
  show,
  findings,
  readOnly,
  selectedId,
  onSelect,
  onChange,
  highlightId = "",
}: {
  show: Show;
  findings: ShowFinding[];
  readOnly: boolean;
  selectedId: string;
  onSelect: (id: string) => void;
  onChange: (next: Show) => void;
  highlightId?: string;
}) {
  const renderKey = JSON.stringify(show);
  const flowNodes: FilmNode[] = useMemo(
    () =>
      show.nodes.map((node) => {
        const ports = showNodePorts(node);
        return {
          id: node.id,
          type: "film" as const,
          position: node.position ?? { x: 0, y: 0 },
          data: {
            node,
            ports,
            portLabels: ports.map((port) => t(`sequence.port.${port}`)),
            errors: findings.filter((finding) => finding.nodeId === node.id)
              .length,
            isEntry: node.id === show.entry,
            highlighted: node.id === highlightId,
            label: t(
              node.kind === "end" ? "sequence.node.end" : "sequence.node.take",
            ),
            summary: nodeSummary(node),
          },
        };
      }),
    [show, findings, highlightId],
  );
  const flowEdges: Edge[] = useMemo(
    () =>
      show.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.output,
        label: t(`sequence.port.${edge.output}`),
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
      })),
    [show],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState<FilmNode>(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);
  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [renderKey, setNodes, setEdges, flowNodes, flowEdges]);

  const handleNodesChange = useCallback(
    (changes: NodeChange<FilmNode>[]) => {
      onNodesChange(changes);
      if (readOnly) return;
      const removed = changes.filter((change) => change.type === "remove");
      if (removed.length) {
        let next = show;
        for (const change of removed) next = removeNode(next, change.id);
        onChange(next);
        if (removed.some((change) => change.id === selectedId)) onSelect("");
        return;
      }
      const moved = changes.filter(
        (change) => change.type === "position" && change.dragging === false,
      );
      if (moved.length) {
        let next = show;
        for (const change of moved)
          if (change.type === "position" && change.position)
            next = moveNode(next, change.id, change.position);
        onChange(next);
      }
    },
    [show, readOnly, onChange, onNodesChange, selectedId, onSelect],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      if (readOnly) return;
      for (const change of changes)
        if (change.type === "remove") onChange(disconnect(show, change.id));
    },
    [show, readOnly, onChange, onEdgesChange],
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
      if (connection.target === show.entry) return;
      if (
        show.edges.some(
          (edge) =>
            edge.source === connection.source &&
            edge.output === connection.sourceHandle,
        )
      )
        return;
      onChange(
        connect(show, {
          id: graphUid("e"),
          source: connection.source,
          output: connection.sourceHandle as ShowEdge["output"],
          target: connection.target,
        }),
      );
    },
    [show, readOnly, onChange],
  );

  return (
    <ReactFlow
      key={show.name}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={handleNodesChange}
      onEdgesChange={handleEdgesChange}
      onConnect={handleConnect}
      onNodeClick={(_, node) => onSelect(node.id)}
      onPaneClick={() => onSelect("")}
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
