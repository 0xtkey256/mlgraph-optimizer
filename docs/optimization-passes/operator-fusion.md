# Operator Fusion

**Pass 4 in the default pipeline**

Operator Fusion identifies sequences of operations that can be combined into single, optimized kernel calls. This is one of the most impactful optimizations for ML computation graphs, often reducing node count by 30-55%.

## Fusion Patterns

### Conv2D + BatchNorm + ReLU → FusedConvBNReLU

The most common pattern in CNN architectures. Three separate operations are fused into a single kernel:

```
Before:  Conv2D → BatchNorm → ReLU     (3 nodes, 2 edges)
After:   FusedConvBNReLU               (1 node, 0 internal edges)
```

This eliminates intermediate memory allocations and enables hardware-specific optimizations (e.g., cuDNN fused kernels).

### Conv2D + BatchNorm → FusedConvBN

When ReLU doesn't follow the BN:

```
Before:  Conv2D → BatchNorm             (2 nodes, 1 edge)
After:   FusedConvBNReLU               (1 node, preserves downstream edges)
```

### MatMul + Add → FusedMatMulAdd

Common in fully-connected layers and attention projections:

```
Before:  MatMul → Add                   (2 nodes, 1 edge)
After:   FusedMatMulAdd                 (1 node)
```

## Algorithm

1. **Process in topological order**: Ensure dependencies are resolved before fusion
2. **Pattern matching**: For each node, check if it starts a fusible chain:
   - Conv2D: check if followed by BatchNorm, then optionally ReLU
   - MatMul: check if followed by Add (bias)
3. **Chain detection**: Verify the intermediate nodes have only one consumer (no branching)
4. **Fuse**: Replace the chain with a single fused node, reconnecting input/output edges

## Example: Inception Module

The Inception Module has 4 parallel branches, each containing Conv2D+BN+ReLU chains:

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Nodes | 22 | 10 | -55% |
| Edges | 24 | 12 | -50% |
| Depth | 8 | 4 | -50% |

Each `Conv2D → BatchNorm → ReLU` chain (3 nodes) is fused into a single `FusedConvBNReLU` node.

## Effect on Metrics

- **Node count**: Significant decrease (30-55% in CNN models)
- **Edge count**: Significant decrease (internal edges eliminated)
- **Graph depth**: Decreases (fused chains reduce critical path)
- **FLOPs**: Unchanged (same operations, just combined)
- **Memory**: Decreases (no intermediate tensor allocations)
