import {
  Graph,
  Node,
  topologicalSort,
  getInputEdges,
  getOutputEdges,
} from '../ir/graph';
import { tensorByteSize } from '../ir/types';
import { OptimizationPass } from './index';

export interface MemoryAllocation {
  nodeId: string;
  offset: number;
  size: number;
  liveRange: [number, number]; // [birth, death] in topological order
  inPlace: boolean;
}

export interface MemoryPlan {
  allocations: MemoryAllocation[];
  peakMemoryBytes: number;
  totalTensorBytes: number;
  inPlaceCount: number;
}

function computeMemoryPlan(graph: Graph): MemoryPlan {
  const sorted = topologicalSort(graph);
  const nodeOrder = new Map(sorted.map((n, i) => [n.id, i]));

  // Compute live ranges: each tensor is "born" when produced and "dies" at last consumer
  const allocations: MemoryAllocation[] = [];

  for (const node of sorted) {
    if (node.op === 'Output') continue;

    const outType = node.outputs[0]?.tensorType;
    if (!outType) continue;

    const birth = nodeOrder.get(node.id) ?? 0;
    const outEdges = getOutputEdges(graph, node.id);
    let death = birth;
    for (const edge of outEdges) {
      const consumerOrder = nodeOrder.get(edge.target.nodeId) ?? birth;
      death = Math.max(death, consumerOrder);
    }

    // Check if this op can be done in-place (unary ops with single consumer)
    const inEdges = getInputEdges(graph, node.id);
    const isUnary =
      inEdges.length === 1 &&
      (node.op === 'ReLU' ||
        node.op === 'GELU' ||
        node.op === 'Sigmoid' ||
        node.op === 'BatchNorm' ||
        node.op === 'LayerNorm');

    let inPlace = false;
    if (isUnary) {
      const producer = graph.nodes.get(inEdges[0].source.nodeId);
      if (producer) {
        const producerConsumers = getOutputEdges(graph, producer.id);
        inPlace = producerConsumers.length === 1; // Only consumer
      }
    }

    allocations.push({
      nodeId: node.id,
      offset: 0, // Will be filled by allocation
      size: inPlace ? 0 : tensorByteSize(outType),
      liveRange: [birth, death],
      inPlace,
    });
  }

  // Simple greedy first-fit allocation
  const sortedAllocs = [...allocations]
    .filter((a) => !a.inPlace)
    .sort((a, b) => a.liveRange[0] - b.liveRange[0]);

  const freeList: { offset: number; size: number }[] = [];
  let nextOffset = 0;

  for (const alloc of sortedAllocs) {
    // Try to find a free block
    let placed = false;
    for (let i = 0; i < freeList.length; i++) {
      if (freeList[i].size >= alloc.size) {
        alloc.offset = freeList[i].offset;
        if (freeList[i].size > alloc.size) {
          freeList[i] = {
            offset: freeList[i].offset + alloc.size,
            size: freeList[i].size - alloc.size,
          };
        } else {
          freeList.splice(i, 1);
        }
        placed = true;
        break;
      }
    }
    if (!placed) {
      alloc.offset = nextOffset;
      nextOffset += alloc.size;
    }
  }

  const peakMemoryBytes = nextOffset;
  const totalTensorBytes = allocations.reduce((s, a) => s + a.size, 0);
  const inPlaceCount = allocations.filter((a) => a.inPlace).length;

  return { allocations, peakMemoryBytes, totalTensorBytes, inPlaceCount };
}

function runMemoryPlanning(graph: Graph): Graph {
  const plan = computeMemoryPlan(graph);

  // Annotate nodes with memory info
  const newNodes = new Map(graph.nodes);
  for (const alloc of plan.allocations) {
    const node = newNodes.get(alloc.nodeId);
    if (node) {
      newNodes.set(alloc.nodeId, {
        ...node,
        attributes: {
          ...node.attributes,
          _memoryOffset: alloc.offset,
          _memorySize: alloc.size,
          _liveRange: alloc.liveRange,
          _inPlace: alloc.inPlace,
        },
      });
    }
  }

  return {
    ...graph,
    nodes: newNodes,
    metadata: {
      ...graph.metadata,
      ...({
        memoryPlan: {
          peakMemoryBytes: plan.peakMemoryBytes,
          totalTensorBytes: plan.totalTensorBytes,
          inPlaceCount: plan.inPlaceCount,
        },
      } as any),
    },
  };
}

export const memoryPlanningPass: OptimizationPass = {
  name: 'Memory Planning',
  description:
    'Compute optimal memory allocation with liveness analysis and in-place operation detection',
  run: runMemoryPlanning,
};

export { computeMemoryPlan };
