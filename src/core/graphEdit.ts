// Shared graph topology API. Film shows and training workflows both use these
// functions for every topology change; UI components never filter node or edge
// arrays themselves, so no dangling reference can be introduced.
export type GraphNode = { id: string; position?: { x: number; y: number } };
export type GraphEdge = {
  id: string;
  source: string;
  output: string;
  target: string;
};
export type Graph = {
  entry: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export function graphUid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function addNode<G extends Graph, N extends GraphNode>(
  graph: G,
  node: N,
): G {
  return { ...graph, nodes: [...graph.nodes, node] } as G;
}

// Removing a node always removes every incoming and outgoing edge.
export function removeNode<G extends Graph>(graph: G, nodeId: string): G {
  if (nodeId === graph.entry) return graph;
  return {
    ...graph,
    nodes: graph.nodes.filter((node) => node.id !== nodeId),
    edges: graph.edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId,
    ),
  } as G;
}

// Connecting an output replaces any existing edge on the same port, so a port
// can never fan out to two targets.
export function connect<G extends Graph>(graph: G, edge: GraphEdge): G {
  return {
    ...graph,
    edges: [
      ...graph.edges.filter(
        (existing) =>
          !(existing.source === edge.source && existing.output === edge.output),
      ),
      edge,
    ],
  } as G;
}

export function disconnect<G extends Graph>(graph: G, edgeId: string): G {
  return {
    ...graph,
    edges: graph.edges.filter((edge) => edge.id !== edgeId),
  } as G;
}

export function edgeForOutput<G extends Graph>(
  graph: G,
  nodeId: string,
  output: string,
): GraphEdge | undefined {
  return graph.edges.find(
    (edge) => edge.source === nodeId && edge.output === output,
  );
}

// Accessible alternative to dragging: pick a target per output. An empty target
// removes the edge.
export function setOutputTarget<G extends Graph>(
  graph: G,
  nodeId: string,
  output: string,
  target: string,
  newId: () => string,
): G {
  const existing = edgeForOutput(graph, nodeId, output);
  const edges = graph.edges.filter(
    (edge) => !(edge.source === nodeId && edge.output === output),
  );
  if (!target) return { ...graph, edges } as G;
  return {
    ...graph,
    edges: [
      ...edges,
      {
        id: existing?.id ?? newId(),
        source: nodeId,
        output,
        target,
      },
    ],
  } as G;
}

// Replacing a node can retire outputs; their edges are dropped so the graph
// never keeps an edge on a port the node no longer has.
export function replaceNode<G extends Graph, N extends GraphNode>(
  graph: G,
  node: N,
  portsOf: (candidate: N) => string[],
): G {
  const previous = graph.nodes.find((row) => row.id === node.id) as
    | N
    | undefined;
  const changedShape =
    !!previous && portsOf(previous).join("|") !== portsOf(node).join("|");
  const ports = changedShape ? new Set(portsOf(node)) : undefined;
  return {
    ...graph,
    nodes: graph.nodes.map((row) => (row.id === node.id ? node : row)),
    edges: ports
      ? graph.edges.filter(
          (edge) => edge.source !== node.id || ports.has(edge.output),
        )
      : graph.edges,
  } as G;
}

export function moveNode<G extends Graph>(
  graph: G,
  nodeId: string,
  position: { x: number; y: number },
): G {
  return {
    ...graph,
    nodes: graph.nodes.map((node) =>
      node.id === nodeId ? { ...node, position } : node,
    ),
  } as G;
}

export function setEntry<G extends Graph>(graph: G, entry: string): G {
  return { ...graph, entry } as G;
}

// Nodes reachable from the entry across all outputs.
export function reachableFrom<G extends Graph>(graph: G): Set<string> {
  const reachable = new Set<string>();
  const stack = [graph.entry];
  while (stack.length) {
    const id = stack.pop();
    if (!id || reachable.has(id)) continue;
    reachable.add(id);
    for (const edge of graph.edges)
      if (edge.source === id) stack.push(edge.target);
  }
  return reachable;
}
