# Getting Started

## Using the Web App

The fastest way to try MLGraph Optimizer is the hosted version:

**[https://mlgraph-optimizer.vercel.app](https://mlgraph-optimizer.vercel.app)**

1. Select an example model from the dropdown (e.g., "ResNet Block") or write your own using the DSL
2. Click **Compile & Optimize** to parse and run all enabled optimization passes
3. Use the **Timeline** at the bottom to step through each optimization stage
4. Click any node in the graph to inspect its details in the sidebar
5. Toggle passes on/off in the **Passes** panel and re-run to see their effects

## Running Locally

### Prerequisites

- Node.js 20+ (recommended: v24)
- npm 10+

### Setup

```bash
git clone https://github.com/0xtkey256/mlgraph-optimizer.git
cd mlgraph-optimizer
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Building

```bash
npm run build
```

This builds all packages via Turborepo:
1. `packages/core` compiles TypeScript to JavaScript
2. `apps/web` builds the Next.js application

## Project Structure

```
mlgraph-optimizer/
├── apps/web/                # Next.js frontend (Vercel deployment)
│   ├── src/components/      # Editor, GraphView, Sidebar, Timeline
│   ├── src/stores/          # Zustand state management
│   └── src/lib/             # Example model definitions
├── packages/core/           # @mlgraph/core — TypeScript graph IR + optimizer
│   ├── src/ir/              # Graph, Node, Edge, Port types
│   ├── src/passes/          # Optimization passes
│   ├── src/parser/          # DSL + JSON parsers
│   └── src/analysis/        # Metrics, graph diff
├── packages/ui/             # @mlgraph/ui — Shared visualization components
└── examples/                # .mlg model definition files
```

## Writing Your First Model

```
model MyModel {
  input x: Tensor<float32>[1, 784]

  w1 = Constant()
  linear1 = MatMul(x, w1)
  b1 = Constant()
  out = Add(linear1, b1)

  output out
}
```

Paste this into the editor, click **Compile & Optimize**, and watch the computation graph appear.

See the [DSL Reference](dsl-reference.md) for full syntax documentation.
