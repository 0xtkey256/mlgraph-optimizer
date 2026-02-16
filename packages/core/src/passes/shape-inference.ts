import { Graph, Node, topologicalSort, getInputEdges } from '../ir/graph';
import { TensorType } from '../ir/types';
import { OptimizationPass } from './index';

function inferConv2DOutput(input: TensorType, attrs: Record<string, unknown>): TensorType {
  const [n, _c, h, w] = input.shape;
  const filters = Number(attrs['filters'] ?? input.shape[1]);
  const kernel = Number(attrs['kernel'] ?? 3);
  const stride = Number(attrs['stride'] ?? 1);
  const padding = Number(attrs['padding'] ?? 0);
  const outH = Math.floor((h + 2 * padding - kernel) / stride) + 1;
  const outW = Math.floor((w + 2 * padding - kernel) / stride) + 1;
  return { dtype: input.dtype, shape: [n, filters, outH, outW] };
}

function inferMatMulOutput(a: TensorType, b: TensorType): TensorType {
  const shapeA = a.shape;
  const shapeB = b.shape;
  const outShape = [...shapeA.slice(0, -1), shapeB[shapeB.length - 1]];
  return { dtype: a.dtype, shape: outShape };
}

function inferPoolOutput(input: TensorType, attrs: Record<string, unknown>): TensorType {
  const [n, c, h, w] = input.shape;
  const kernel = Number(attrs['kernel'] ?? 2);
  const stride = Number(attrs['stride'] ?? kernel);
  const outH = Math.floor(h / stride);
  const outW = Math.floor(w / stride);
  return { dtype: input.dtype, shape: [n, c, outH, outW] };
}

function inferOutputShape(
  node: Node,
  inputTypes: (TensorType | undefined)[],
): TensorType | undefined {
  const first = inputTypes[0];
  if (!first) return undefined;

  switch (node.op) {
    case 'Input':
      return node.outputs[0]?.tensorType;
    case 'Constant':
      return node.outputs[0]?.tensorType;
    case 'Conv2D':
    case 'FusedConvBNReLU':
      return inferConv2DOutput(first, node.attributes);
    case 'MatMul':
    case 'FusedMatMulAdd': {
      const second = inputTypes[1];
      return second ? inferMatMulOutput(first, second) : first;
    }
    case 'BatchNorm':
    case 'LayerNorm':
    case 'ReLU':
    case 'GELU':
    case 'Sigmoid':
    case 'Add':
    case 'Mul':
      return first;
    case 'Softmax':
      return first;
    case 'MaxPool2D':
    case 'AvgPool2D':
      return inferPoolOutput(first, node.attributes);
    case 'GlobalAvgPool':
      return { dtype: first.dtype, shape: [first.shape[0], first.shape[1], 1, 1] };
    case 'Flatten':
      return {
        dtype: first.dtype,
        shape: [first.shape[0], first.shape.slice(1).reduce((a, b) => a * b, 1)],
      };
    case 'Reshape': {
      const targetShape = node.attributes['shape'] as number[] | undefined;
      return targetShape ? { dtype: first.dtype, shape: targetShape } : first;
    }
    case 'Transpose': {
      const perm = (node.attributes['perm'] as number[]) ?? [...first.shape.keys()].reverse();
      return { dtype: first.dtype, shape: perm.map((i) => first.shape[i]) };
    }
    case 'Concat': {
      const axis = Number(node.attributes['axis'] ?? 0);
      const concatDim = inputTypes.reduce(
        (sum, t) => sum + (t?.shape[axis] ?? 0),
        0,
      );
      const shape = [...first.shape];
      shape[axis] = concatDim;
      return { dtype: first.dtype, shape };
    }
    case 'FusedLinear':
      return first;
    case 'ReduceSum':
    case 'ReduceMean': {
      const axis = Number(node.attributes['axis'] ?? -1);
      const realAxis = axis < 0 ? first.shape.length + axis : axis;
      const shape = first.shape.filter((_, i) => i !== realAxis);
      return { dtype: first.dtype, shape: shape.length ? shape : [1] };
    }
    default:
      return first;
  }
}

function runShapeInference(graph: Graph): Graph {
  const sorted = topologicalSort(graph);
  const nodeShapes = new Map<string, TensorType>();
  const newNodes = new Map(graph.nodes);

  for (const node of sorted) {
    // Collect input tensor types
    const inEdges = getInputEdges(graph, node.id);
    const inputTypes = node.inputs.map((_, i) => {
      const edge = inEdges.find((e) => e.target.portIndex === i);
      if (!edge) return undefined;
      return nodeShapes.get(edge.source.nodeId);
    });

    const outType = inferOutputShape(node, inputTypes);
    if (outType) {
      nodeShapes.set(node.id, outType);
      const updatedNode: Node = {
        ...node,
        outputs: node.outputs.map((p) => ({ ...p, tensorType: outType })),
      };
      newNodes.set(node.id, updatedNode);
    }
  }

  // Update edge tensor types
  const newEdges = graph.edges.map((edge) => {
    const sourceType = nodeShapes.get(edge.source.nodeId);
    return sourceType ? { ...edge, tensorType: sourceType } : edge;
  });

  return { ...graph, nodes: newNodes, edges: newEdges };
}

export const shapeInferencePass: OptimizationPass = {
  name: 'Shape Inference',
  description: 'Propagate tensor shapes through the computation graph',
  run: runShapeInference,
};
