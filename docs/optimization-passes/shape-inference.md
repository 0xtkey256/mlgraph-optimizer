# Shape Inference

**Pass 1 in the default pipeline**

Shape Inference propagates tensor shapes and data types through the computation graph, annotating every edge with concrete dimension information.

## What It Does

Starting from Input nodes (which have explicitly declared shapes), the pass performs a forward traversal in topological order, computing the output shape of each operation based on its input shapes and attributes.

## Shape Rules by Operation

| Operation | Output Shape Rule |
|-----------|-------------------|
| **Conv2D** | `[N, filters, (H + 2*padding - kernel) / stride + 1, (W + 2*padding - kernel) / stride + 1]` |
| **MatMul** | `[...batch, M, K] x [...batch, K, N] → [...batch, M, N]` |
| **BatchNorm** | Same as input |
| **ReLU/GELU/Sigmoid** | Same as input |
| **Softmax** | Same as input |
| **MaxPool2D/AvgPool2D** | `[N, C, (H - kernel) / stride + 1, (W - kernel) / stride + 1]` |
| **GlobalAvgPool** | `[N, C, 1, 1]` |
| **Flatten** | `[N, C * H * W]` |
| **Reshape** | User-specified target shape |
| **Transpose** | Permuted dimensions per `perm` attribute |
| **Concat** | Sum along specified `axis`, other dims unchanged |
| **Add/Mul** | Broadcasting rules (matching or size-1 dims) |

## Example

**Before** (no shape annotations):
```
Input x [1, 64, 56, 56]
  → Conv2D (filters=64, kernel=3, padding=1)
    → BatchNorm
      → ReLU
```

**After** shape inference:
```
Input x [1, 64, 56, 56]
  → Conv2D → [1, 64, 56, 56]
    → BatchNorm → [1, 64, 56, 56]
      → ReLU → [1, 64, 56, 56]
```

## Effect on Metrics

Shape Inference does not change the graph structure (no nodes or edges are added or removed). It enriches the graph metadata, enabling subsequent passes (like Memory Planning) to compute accurate memory footprints.
