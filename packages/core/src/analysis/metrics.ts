import { Graph, Node, topologicalSort } from '../ir/graph';
import { tensorByteSize, TensorType } from '../ir/types';

export interface GraphMetrics {
  nodeCount: number;
  edgeCount: number;
  opCounts: Record<string, number>;
  totalFLOPs: number;
  totalParams: number;
  totalMemoryBytes: number;
  depth: number;
}

function estimateFlops(node: Node): number {
  const out = node.outputs[0]?.tensorType;
  if (!out) return 0;

  const outputElements = out.shape.reduce((a, b) => a * b, 1);

  switch (node.op) {
    case 'Conv2D':
    case 'FusedConvBNReLU': {
      const [_n, inC, _h, _w] = node.inputs[0]?.tensorType?.shape ?? [1, 1, 1, 1];
      const k = Number(node.attributes['kernel'] ?? 3);
      return outputElements * inC * k * k * 2; // multiply-accumulate
    }
    case 'MatMul':
    case 'FusedMatMulAdd':
    case 'FusedLinear': {
      const inShape = node.inputs[0]?.tensorType?.shape ?? [1, 1];
      const K = inShape[inShape.length - 1];
      return outputElements * K * 2;
    }
    case 'BatchNorm':
    case 'LayerNorm':
      return outputElements * 4; // mean, var, normalize, scale
    case 'ReLU':
    case 'Sigmoid':
    case 'GELU':
      return outputElements;
    case 'Softmax':
      return outputElements * 3; // exp, sum, div
    case 'Add':
    case 'Mul':
      return outputElements;
    default:
      return 0;
  }
}

function estimateParams(node: Node): number {
  switch (node.op) {
    case 'Conv2D':
    case 'FusedConvBNReLU': {
      const inC = node.inputs[0]?.tensorType?.shape?.[1] ?? 1;
      const outC = Number(node.attributes['filters'] ?? inC);
      const k = Number(node.attributes['kernel'] ?? 3);
      return outC * inC * k * k + outC; // weights + bias
    }
    case 'MatMul':
    case 'FusedMatMulAdd':
    case 'FusedLinear': {
      const inShape = node.inputs[0]?.tensorType?.shape ?? [1, 1];
      const outShape = node.outputs[0]?.tensorType?.shape ?? [1, 1];
      const inFeatures = inShape[inShape.length - 1];
      const outFeatures = outShape[outShape.length - 1];
      return inFeatures * outFeatures + outFeatures;
    }
    case 'BatchNorm':
    case 'LayerNorm': {
      const c = node.inputs[0]?.tensorType?.shape?.[1] ?? 1;
      return c * 4; // gamma, beta, running_mean, running_var
    }
    default:
      return 0;
  }
}

export function computeMetrics(graph: Graph): GraphMetrics {
  const opCounts: Record<string, number> = {};
  let totalFLOPs = 0;
  let totalParams = 0;
  let totalMemoryBytes = 0;

  for (const [_, node] of graph.nodes) {
    opCounts[node.op] = (opCounts[node.op] ?? 0) + 1;
    totalFLOPs += estimateFlops(node);
    totalParams += estimateParams(node);

    const outType = node.outputs[0]?.tensorType;
    if (outType) {
      totalMemoryBytes += tensorByteSize(outType);
    }
  }

  // Compute graph depth (longest path)
  const sorted = topologicalSort(graph);
  const depthMap = new Map<string, number>();
  let maxDepth = 0;
  for (const node of sorted) {
    const inputs = graph.edges.filter((e) => e.target.nodeId === node.id);
    const depth = inputs.length === 0
      ? 0
      : Math.max(...inputs.map((e) => (depthMap.get(e.source.nodeId) ?? 0) + 1));
    depthMap.set(node.id, depth);
    maxDepth = Math.max(maxDepth, depth);
  }

  return {
    nodeCount: graph.nodes.size,
    edgeCount: graph.edges.length,
    opCounts,
    totalFLOPs,
    totalParams,
    totalMemoryBytes,
    depth: maxDepth,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatFLOPs(flops: number): string {
  if (flops < 1e3) return `${flops}`;
  if (flops < 1e6) return `${(flops / 1e3).toFixed(1)}K`;
  if (flops < 1e9) return `${(flops / 1e6).toFixed(1)}M`;
  if (flops < 1e12) return `${(flops / 1e9).toFixed(1)}G`;
  return `${(flops / 1e12).toFixed(2)}T`;
}
