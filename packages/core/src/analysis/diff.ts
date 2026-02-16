import { Graph, Node } from '../ir/graph';

export interface GraphDiff {
  addedNodes: string[];
  removedNodes: string[];
  modifiedNodes: string[];
  addedEdges: string[];
  removedEdges: string[];
}

export function computeGraphDiff(before: Graph, after: Graph): GraphDiff {
  const beforeNodeIds = new Set(before.nodes.keys());
  const afterNodeIds = new Set(after.nodes.keys());

  const addedNodes: string[] = [];
  const removedNodes: string[] = [];
  const modifiedNodes: string[] = [];

  for (const id of afterNodeIds) {
    if (!beforeNodeIds.has(id)) {
      addedNodes.push(id);
    } else {
      const bNode = before.nodes.get(id)!;
      const aNode = after.nodes.get(id)!;
      if (bNode.op !== aNode.op || bNode.name !== aNode.name) {
        modifiedNodes.push(id);
      }
    }
  }

  for (const id of beforeNodeIds) {
    if (!afterNodeIds.has(id)) {
      removedNodes.push(id);
    }
  }

  const beforeEdgeIds = new Set(before.edges.map((e) => e.id));
  const afterEdgeIds = new Set(after.edges.map((e) => e.id));

  const addedEdges = after.edges
    .filter((e) => !beforeEdgeIds.has(e.id))
    .map((e) => e.id);
  const removedEdges = before.edges
    .filter((e) => !afterEdgeIds.has(e.id))
    .map((e) => e.id);

  return { addedNodes, removedNodes, modifiedNodes, addedEdges, removedEdges };
}
