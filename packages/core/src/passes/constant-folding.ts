import { Graph, Node, getInputEdges, removeNode, addNode, genId } from '../ir/graph';
import { OptimizationPass } from './index';

function isConstantNode(node: Node): boolean {
  return node.op === 'Constant';
}

function canFold(graph: Graph, node: Node): boolean {
  // Don't fold I/O nodes
  if (node.op === 'Input' || node.op === 'Output' || node.op === 'Constant') return false;

  // All inputs must come from constant nodes
  const inEdges = getInputEdges(graph, node.id);
  if (inEdges.length === 0) return false;

  return inEdges.every((edge) => {
    const source = graph.nodes.get(edge.source.nodeId);
    return source && isConstantNode(source);
  });
}

function runConstantFolding(graph: Graph): Graph {
  let result = { ...graph, nodes: new Map(graph.nodes), edges: [...graph.edges] };
  let changed = true;

  while (changed) {
    changed = false;
    for (const [nodeId, node] of result.nodes) {
      if (canFold(result, node)) {
        // Replace this node with a Constant node that has the same output shape
        const outputType = node.outputs[0]?.tensorType;
        const constantNode: Node = {
          id: genId('const'),
          op: 'Constant',
          name: `folded_${node.name}`,
          inputs: [],
          outputs: [{ name: 'output', tensorType: outputType }],
          attributes: { folded_from: node.op, original_name: node.name },
        };

        // Remove old edges going into this node
        result.edges = result.edges.filter(
          (e) => e.target.nodeId !== nodeId,
        );

        // Rewrite outgoing edges to come from the new constant
        result.edges = result.edges.map((e) =>
          e.source.nodeId === nodeId
            ? { ...e, source: { ...e.source, nodeId: constantNode.id } }
            : e,
        );

        // Remove old node, add constant
        result.nodes.delete(nodeId);
        result.nodes.set(constantNode.id, constantNode);

        // Clean up orphaned constants (inputs to the folded node that have no consumers)
        const orphanIds: string[] = [];
        for (const [id, n] of result.nodes) {
          if (isConstantNode(n) && id !== constantNode.id) {
            const hasConsumer = result.edges.some((e) => e.source.nodeId === id);
            if (!hasConsumer) orphanIds.push(id);
          }
        }
        for (const id of orphanIds) {
          result.nodes.delete(id);
          result.edges = result.edges.filter(
            (e) => e.source.nodeId !== id && e.target.nodeId !== id,
          );
        }

        changed = true;
        break; // restart scan
      }
    }
  }

  return result;
}

export const constantFoldingPass: OptimizationPass = {
  name: 'Constant Folding',
  description: 'Evaluate subgraphs with all-constant inputs at compile time',
  run: runConstantFolding,
};
