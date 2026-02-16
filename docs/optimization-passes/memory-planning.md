# Memory Planning

**Pass 5 in the default pipeline**

Memory Planning computes a memory allocation strategy for the computation graph using liveness analysis. It determines when tensors are created, when they're last used, and identifies opportunities for in-place operations.

## What It Does

1. **Liveness analysis**: For each tensor (edge), determine its live range — from the step it's produced to the step it's last consumed
2. **Greedy allocation**: Assign memory slots using a greedy first-fit algorithm, reusing slots when tensors' lifetimes don't overlap
3. **In-place detection**: Identify operations that can reuse their input buffer for output (unary ops like ReLU, Sigmoid, GELU)
4. **Peak memory**: Compute the maximum memory required at any point during execution

## Liveness Analysis

Using topological order as the execution schedule:

```
Step 0: Input x        → x is live
Step 1: Conv2D(x)      → conv_out is live, x still live (may be used later)
Step 2: ReLU(conv_out) → relu_out is live, conv_out dies (last consumer)
Step 3: Output(relu_out)→ relu_out dies
```

## In-Place Operations

Unary operations (single input, same-shape output) can potentially execute in-place, reusing the input memory:

| Operation | In-Place Candidate |
|-----------|-------------------|
| ReLU | Yes |
| GELU | Yes |
| Sigmoid | Yes |
| Softmax | Yes |
| BatchNorm | Depends on implementation |
| Conv2D | No (different output shape possible) |
| MatMul | No (different output shape) |

In-place operations are only applied when the input tensor has no other consumers.

## Memory Metadata

After this pass, each node is annotated with:

```typescript
{
  memoryPlan: {
    peakMemoryBytes: number;    // Maximum memory at any step
    allocations: Allocation[];   // Per-tensor memory assignments
    inPlaceOps: string[];       // Node IDs that execute in-place
  }
}
```

## Effect on Metrics

- **Node count**: Unchanged (no structural changes)
- **Edge count**: Unchanged
- **Memory metadata**: Added (peak memory, allocation plan, in-place annotations)
- **Practical impact**: Enables runtime memory optimization, reducing actual memory usage by 20-40% through buffer reuse
