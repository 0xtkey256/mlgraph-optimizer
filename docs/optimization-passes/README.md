# Optimization Passes

MLGraph Optimizer applies a pipeline of compiler optimization passes to transform computation graphs. Each pass is a **pure function** — it takes an immutable graph and returns a new, optimized graph. This design enables full transformation history and step-through visualization.

## Pass Pipeline

The default pipeline runs passes in this order:

```
Original Graph
    │
    ▼
[1] Shape Inference      — Annotate edges with tensor shapes and dtypes
    │
    ▼
[2] Constant Folding     — Evaluate constant subgraphs at compile time
    │
    ▼
[3] Dead Code Elimination — Remove unreachable nodes
    │
    ▼
[4] Operator Fusion      — Fuse operator sequences into optimized kernels
    │
    ▼
[5] Memory Planning      — Compute memory allocation with liveness analysis
    │
    ▼
Optimized Graph
```

## Pass Summary

| Pass | Effect | Typical Reduction |
|------|--------|-------------------|
| [Shape Inference](shape-inference.md) | Annotates every edge with dtype and dimensions | No node reduction (metadata only) |
| [Constant Folding](constant-folding.md) | Replaces computable subgraphs with constants | Varies by model |
| [Dead Code Elimination](dead-code-elimination.md) | Prunes orphaned branches | 0-30% node reduction |
| [Operator Fusion](operator-fusion.md) | Conv+BN+ReLU → FusedConvBNReLU | 30-55% node reduction |
| [Memory Planning](memory-planning.md) | Identifies in-place ops and peak memory | No node reduction (allocation metadata) |

## Enabling/Disabling Passes

In the web UI, use the **Passes** panel in the sidebar to toggle individual passes on or off, then click **Re-run** to recompile with the updated pipeline.

## Immutability

Each pass produces a **new graph snapshot**. The original graph is never mutated. This enables:

- **Step-through visualization**: Click any step in the Timeline to see the graph at that stage
- **Metrics comparison**: View node count, edge count, FLOPs, and memory before/after each pass
- **Diff analysis**: The system computes structural diffs between consecutive snapshots to highlight what changed
