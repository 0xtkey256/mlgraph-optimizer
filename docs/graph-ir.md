# Graph IR

The Graph Intermediate Representation (IR) is the core data structure of MLGraph Optimizer. It represents computation graphs as immutable, typed directed acyclic graphs (DAGs).

## Design Principles

1. **Immutability**: Graphs are never mutated. Every optimization pass returns a new graph.
2. **Type safety**: All nodes, edges, and ports are strongly typed with TypeScript interfaces.
3. **Self-contained**: Each graph snapshot contains all information needed for rendering and analysis.

## Core Types

### Graph

```typescript
interface Graph {
  id: string;
  nodes: Map<string, Node>;
  edges: Edge[];
  metadata: {
    name: string;
    passHistory: string[];  // Ordered list of applied passes
  };
}
```

### Node

```typescript
interface Node {
  id: string;
  op: OpType;              // "Conv2D", "MatMul", "ReLU", etc.
  name: string;            // User-assigned name from DSL
  inputs: Port[];
  outputs: Port[];
  attributes: Record<string, unknown>;
  metadata: {
    flops: number;
    memoryBytes: number;
  };
}
```

### Edge

```typescript
interface Edge {
  id: string;
  source: { nodeId: string; portIndex: number };
  target: { nodeId: string; portIndex: number };
  tensorType?: TensorType;
}
```

### TensorType

```typescript
interface TensorType {
  dtype: DataType;   // "float32" | "float16" | "int32" | "int64" | "bool"
  shape: number[];   // e.g., [1, 64, 56, 56]
}
```

## Operations

The IR supports 26+ ML operations across 8 categories:

| Category | Operations |
|----------|-----------|
| **I/O** | Input, Output, Constant |
| **Linear** | MatMul, Add, Mul |
| **Convolution** | Conv2D |
| **Normalization** | BatchNorm, LayerNorm |
| **Activation** | ReLU, GELU, Sigmoid, Softmax |
| **Pooling** | MaxPool2D, AvgPool2D, GlobalAvgPool |
| **Shape** | Reshape, Transpose, Flatten, Concat, Split |
| **Reduction** | ReduceSum, ReduceMean |
| **Fused** | FusedConvBNReLU, FusedMatMulAdd |

## Graph Utilities

### Construction

- `createGraph(name)` — Create an empty graph
- `addNode(graph, node)` — Add a node, returns new graph
- `addEdge(graph, edge)` — Add an edge, returns new graph
- `removeNode(graph, nodeId)` — Remove a node and its edges

### Query

- `getInputEdges(graph, nodeId)` — Get all edges flowing into a node
- `getOutputEdges(graph, nodeId)` — Get all edges flowing out of a node
- `topologicalSort(graph)` — Returns nodes in dependency order

### Analysis

- `computeMetrics(graph)` — Compute FLOPs, memory, params, depth
- `computeGraphDiff(before, after)` — Structural diff between two graphs
