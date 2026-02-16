import { Graph, getInputEdges } from '../ir/graph';
import { OptimizationPass } from './index';

function runDeadCodeElimination(graph: Graph): Graph {
  // BFS backward from output nodes to find all reachable nodes
  const reachable = new Set<string>();
  const queue: string[] = [];

  // Start from Output nodes
  for (const [id, node] of graph.nodes) {
    if (node.op === 'Output') {
      reachable.add(id);
      queue.push(id);
    }
  }

  // Walk backward through edges
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const inEdges = getInputEdges(graph, nodeId);
    for (const edge of inEdges) {
      if (!reachable.has(edge.source.nodeId)) {
        reachable.add(edge.source.nodeId);
        queue.push(edge.source.nodeId);
      }
    }
  }

  // Remove unreachable nodes and their edges
  const newNodes = new Map(
    Array.from(graph.nodes.entries()).filter(([id]) => reachable.has(id)),
  );
  const newEdges = graph.edges.filter(
    (e) => reachable.has(e.source.nodeId) && reachable.has(e.target.nodeId),
  );

  return { ...graph, nodes: newNodes, edges: newEdges };
}

export const deadCodeEliminationPass: OptimizationPass = {
  name: 'Dead Code Elimination',
  description: 'Remove unreachable nodes that do not contribute to any output',
  run: runDeadCodeElimination,
};
