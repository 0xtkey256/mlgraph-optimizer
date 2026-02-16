# MLGraph Optimizer

**ML Computation Graph Compiler & Optimizer Visualizer**

MLGraph Optimizer is an interactive tool for defining neural network models, compiling them into computation graph intermediate representations (IR), applying compiler optimization passes, and visualizing each transformation step.

Think of it as [Compiler Explorer (godbolt.org)](https://godbolt.org) but for ML models.

## What It Does

1. **Define** a neural network model using a concise DSL or select from 13 built-in examples
2. **Compile** the model definition into an immutable computation graph IR
3. **Optimize** by applying up to 5 compiler optimization passes
4. **Visualize** the graph at each transformation step with interactive D3.js rendering
5. **Analyze** metrics like FLOPs, memory footprint, parameter count, and graph complexity

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Computation Graph** | A directed acyclic graph (DAG) where nodes represent operations (Conv2D, MatMul, ReLU) and edges represent tensor data flow |
| **Intermediate Representation (IR)** | The structured, machine-readable form of the computation graph used internally by the optimizer |
| **Optimization Pass** | A pure function that takes a graph and returns a new, optimized graph (immutable transformation) |
| **DSL** | A domain-specific language for defining ML models in a human-readable syntax |

## Quick Links

- [Live Demo](https://mlgraph-optimizer.vercel.app)
- [GitHub Repository](https://github.com/0xtkey256/mlgraph-optimizer)
- [Getting Started](getting-started.md)
- [DSL Reference](dsl-reference.md)
- [Optimization Passes](optimization-passes/README.md)
