# Constant Folding

**Pass 2 in the default pipeline**

Constant Folding identifies subgraphs where all inputs are constants and replaces them with a single pre-computed constant node. This is a standard compiler optimization adapted for computation graphs.

## What It Does

1. **Identify foldable nodes**: Find operations where every input edge originates from a `Constant` node
2. **Replace with constant**: Remove the operation and its constant inputs, replace with a single new `Constant` node
3. **Clean up**: Remove any orphaned constant nodes that no longer feed into any operation
4. **Iterate**: Repeat until no more folding is possible (fixed-point iteration)

## Foldable Patterns

```
Constant ─┐
           ├─→ MatMul ─→ ...    ⟹    Constant ─→ ...
Constant ─┘

Constant ─┐
           ├─→ Add ─→ ...       ⟹    Constant ─→ ...
Constant ─┘
```

## Example: Simple MLP

In the Simple MLP model, weight and bias constants feed into MatMul and Add operations. While real values aren't available at compile time (this is a visualization tool), the pass demonstrates the pattern:

**Before**: `w1(Const) → MatMul ← x(Input)` — Not foldable (one input is non-constant)

**Foldable case**: `a(Const) → Add ← b(Const)` — Both inputs are constant, result is pre-computable

## When It Applies

Constant Folding is most effective in models with:
- Precomputed scale/shift parameters
- Static reshaping of constant tensors
- Chained arithmetic on constants (e.g., normalization parameters)

## Effect on Metrics

- **Node count**: Decreases (foldable subgraphs collapse to single nodes)
- **Edge count**: Decreases (fewer connections between nodes)
- **FLOPs**: May decrease (folded operations are "free" at runtime)
