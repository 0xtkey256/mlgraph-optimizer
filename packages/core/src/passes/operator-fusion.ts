import {
  Graph,
  Node,
  Edge,
  getInputEdges,
  getOutputEdges,
  genId,
} from '../ir/graph';
import { OptimizationPass } from './index';

interface FusionPattern {
  name: string;
  /** Sequence of op types to match (in topological order) */
  ops: string[];
  /** The fused op type to replace with */
  fusedOp: string;
}

const FUSION_PATTERNS: FusionPattern[] = [
  {
    name: 'Conv2D + BatchNorm + ReLU',
    ops: ['Conv2D', 'BatchNorm', 'ReLU'],
    fusedOp: 'FusedConvBNReLU',
  },
  {
    name: 'Conv2D + BatchNorm',
    ops: ['Conv2D', 'BatchNorm'],
    fusedOp: 'FusedConvBNReLU',
  },
  {
    name: 'MatMul + Add',
    ops: ['MatMul', 'Add'],
    fusedOp: 'FusedMatMulAdd',
  },
];

function findChain(
  graph: Graph,
  startId: string,
  opSequence: string[],
): Node[] | null {
  const chain: Node[] = [];
  let currentId = startId;

  for (const expectedOp of opSequence) {
    const node = graph.nodes.get(currentId);
    if (!node || node.op !== expectedOp) return null;
    chain.push(node);

    // Move to the single consumer
    if (chain.length < opSequence.length) {
      const outEdges = getOutputEdges(graph, currentId);
      if (outEdges.length !== 1) return null;
      // The consumer node must also have only one input from this chain
      const nextId = outEdges[0].target.nodeId;
      const nextNode = graph.nodes.get(nextId);
      if (!nextNode) return null;

      // Verify the next node only has one input edge from the chain
      const nextInEdges = getInputEdges(graph, nextId);
      const chainInputs = nextInEdges.filter(
        (e) => e.source.nodeId === currentId,
      );
      if (chainInputs.length !== 1) return null;

      currentId = nextId;
    }
  }

  return chain;
}

function fuseChain(
  graph: Graph,
  chain: Node[],
  fusedOp: string,
  patternName: string,
): Graph {
  const first = chain[0];
  const last = chain[chain.length - 1];

  // Create fused node
  const fusedNode: Node = {
    id: genId('fused'),
    op: fusedOp as any,
    name: `fused_${chain.map((n) => n.name).join('_')}`,
    inputs: [...first.inputs],
    outputs: last.outputs.map((p) => ({ ...p })),
    attributes: {
      fused_from: chain.map((n) => ({ op: n.op, name: n.name })),
      pattern: patternName,
      ...first.attributes,
    },
  };

  // Collect all node IDs in the chain
  const chainIds = new Set(chain.map((n) => n.id));

  // Rewrite edges:
  // 1. Edges going INTO the first node → go into fused node
  // 2. Edges coming OUT of the last node → come from fused node
  // 3. Edges between chain nodes → removed
  const newEdges: Edge[] = [];
  for (const edge of graph.edges) {
    const srcInChain = chainIds.has(edge.source.nodeId);
    const tgtInChain = chainIds.has(edge.target.nodeId);

    if (srcInChain && tgtInChain) {
      // Internal edge — skip
      continue;
    } else if (tgtInChain && edge.target.nodeId === first.id) {
      // Edge into first node → redirect to fused
      newEdges.push({
        ...edge,
        target: { ...edge.target, nodeId: fusedNode.id },
      });
    } else if (srcInChain && edge.source.nodeId === last.id) {
      // Edge from last node → redirect from fused
      newEdges.push({
        ...edge,
        source: { ...edge.source, nodeId: fusedNode.id },
      });
    } else if (!srcInChain && !tgtInChain) {
      newEdges.push(edge);
    }
    // Drop any other edges touching the chain
  }

  // Build new node map
  const newNodes = new Map(graph.nodes);
  for (const id of chainIds) {
    newNodes.delete(id);
  }
  newNodes.set(fusedNode.id, fusedNode);

  return { ...graph, nodes: newNodes, edges: newEdges };
}

function runOperatorFusion(graph: Graph): Graph {
  let result = graph;
  let changed = true;

  while (changed) {
    changed = false;

    for (const pattern of FUSION_PATTERNS) {
      for (const [nodeId, node] of result.nodes) {
        if (node.op !== pattern.ops[0]) continue;

        const chain = findChain(result, nodeId, pattern.ops);
        if (chain) {
          result = fuseChain(result, chain, pattern.fusedOp, pattern.name);
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
  }

  return result;
}

export const operatorFusionPass: OptimizationPass = {
  name: 'Operator Fusion',
  description:
    'Fuse sequences of operators into single optimized kernels (Conv+BN+ReLU, MatMul+Add)',
  run: runOperatorFusion,
};
