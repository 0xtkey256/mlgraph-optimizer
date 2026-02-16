# Dead Code Elimination

**Pass 3 in the default pipeline**

Dead Code Elimination (DCE) removes nodes that do not contribute to the graph's outputs. This is a classic compiler optimization that prunes unreachable code paths.

## Algorithm

1. **Start from outputs**: Identify all Output nodes in the graph
2. **Backward BFS**: Traverse edges backward from outputs, marking each visited node as "live"
3. **Remove dead nodes**: Delete all nodes that were not marked as live
4. **Clean edges**: Remove edges connected to deleted nodes

```
Output nodes → Backward BFS → Mark live nodes → Remove unmarked
```

## Example

Consider a graph where a branch was created during development but never connected to the output:

```
Input x ─→ Conv2D ─→ ReLU ─→ Output    (live path)
       └─→ MatMul ─→ Add               (dead branch)
```

After DCE:
```
Input x ─→ Conv2D ─→ ReLU ─→ Output
```

The MatMul and Add nodes are removed because they don't contribute to any output.

## When It Applies

DCE is most effective:
- **After Constant Folding**: Folding may leave orphaned subgraphs
- **In models with unused branches**: Debug/auxiliary outputs that were disconnected
- **After Operator Fusion**: Some intermediate nodes may become unreachable

## Effect on Metrics

- **Node count**: Decreases (dead nodes removed)
- **Edge count**: Decreases (edges to/from dead nodes removed)
- **FLOPs**: Decreases (dead computations eliminated)
- **Memory**: Decreases (dead tensors no longer allocated)
