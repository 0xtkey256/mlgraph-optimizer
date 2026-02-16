import { TensorType } from './types';
import { OpType } from './ops';

export interface Port {
  name: string;
  tensorType?: TensorType;
}

export interface Node {
  id: string;
  op: OpType;
  name: string;
  inputs: Port[];
  outputs: Port[];
  attributes: Record<string, unknown>;
}

export interface Edge {
  id: string;
  source: { nodeId: string; portIndex: number };
  target: { nodeId: string; portIndex: number };
  tensorType?: TensorType;
}

export interface PassRecord {
  name: string;
  description: string;
  timestamp: number;
}

export interface GraphMetadata {
  name: string;
  description: string;
  passHistory: PassRecord[];
}

export interface Graph {
  id: string;
  nodes: Map<string, Node>;
  edges: Edge[];
  metadata: GraphMetadata;
}

// ---------------------------------------------------------------------------
// Graph construction helpers (immutable — all return new objects)
// ---------------------------------------------------------------------------

let _idCounter = 0;
export function genId(prefix = 'n'): string {
  return `${prefix}_${++_idCounter}`;
}

export function resetIdCounter(): void {
  _idCounter = 0;
}

export function createGraph(name: string, description = ''): Graph {
  return {
    id: genId('g'),
    nodes: new Map(),
    edges: [],
    metadata: { name, description, passHistory: [] },
  };
}

export function addNode(graph: Graph, node: Node): Graph {
  const nodes = new Map(graph.nodes);
  nodes.set(node.id, node);
  return { ...graph, nodes };
}

export function removeNode(graph: Graph, nodeId: string): Graph {
  const nodes = new Map(graph.nodes);
  nodes.delete(nodeId);
  const edges = graph.edges.filter(
    (e) => e.source.nodeId !== nodeId && e.target.nodeId !== nodeId,
  );
  return { ...graph, nodes, edges };
}

export function addEdge(graph: Graph, edge: Edge): Graph {
  return { ...graph, edges: [...graph.edges, edge] };
}

export function removeEdge(graph: Graph, edgeId: string): Graph {
  return { ...graph, edges: graph.edges.filter((e) => e.id !== edgeId) };
}

export function recordPass(graph: Graph, name: string, description: string): Graph {
  return {
    ...graph,
    metadata: {
      ...graph.metadata,
      passHistory: [
        ...graph.metadata.passHistory,
        { name, description, timestamp: Date.now() },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

export function getInputEdges(graph: Graph, nodeId: string): Edge[] {
  return graph.edges.filter((e) => e.target.nodeId === nodeId);
}

export function getOutputEdges(graph: Graph, nodeId: string): Edge[] {
  return graph.edges.filter((e) => e.source.nodeId === nodeId);
}

export function getProducers(graph: Graph, nodeId: string): Node[] {
  return getInputEdges(graph, nodeId)
    .map((e) => graph.nodes.get(e.source.nodeId)!)
    .filter(Boolean);
}

export function getConsumers(graph: Graph, nodeId: string): Node[] {
  return getOutputEdges(graph, nodeId)
    .map((e) => graph.nodes.get(e.target.nodeId)!)
    .filter(Boolean);
}

export function topologicalSort(graph: Graph): Node[] {
  const visited = new Set<string>();
  const result: Node[] = [];

  function visit(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    for (const edge of getInputEdges(graph, nodeId)) {
      visit(edge.source.nodeId);
    }
    const node = graph.nodes.get(nodeId);
    if (node) result.push(node);
  }

  for (const [id] of graph.nodes) {
    visit(id);
  }
  return result;
}

export function cloneGraph(graph: Graph): Graph {
  return {
    id: genId('g'),
    nodes: new Map(Array.from(graph.nodes.entries()).map(([k, v]) => [k, { ...v }])),
    edges: graph.edges.map((e) => ({ ...e })),
    metadata: {
      ...graph.metadata,
      passHistory: [...graph.metadata.passHistory],
    },
  };
}
