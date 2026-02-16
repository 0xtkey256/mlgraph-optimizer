# Roadmap

## Planned Features

### Native Performance Engine
- **Python + Rust core** via PyO3 for high-performance graph optimization
- **WASM compilation** of Rust core for in-browser native-speed execution
- Target: 10-100x faster optimization for large graphs

### Additional Optimization Passes
- **Layout Transformation**: NCHW ↔ NHWC memory layout conversion
- **Quantization**: INT8/FP16 quantization analysis and simulation
- **Graph Partitioning**: Split graphs across devices/accelerators
- **Common Subexpression Elimination**: Deduplicate identical subgraphs

### Export & Import
- **ONNX export**: Convert optimized graphs to ONNX format
- **ONNX import**: Load existing ONNX models for visualization and optimization
- **SVG/PNG export**: High-quality graph rendering export

### Visualization Enhancements
- **Side-by-side diff view**: Compare graphs before and after specific passes
- **3D tensor visualization**: Three.js rendering of tensor shapes and data flow
- **Animation**: Smooth transitions between optimization steps
- **Heatmaps**: Color nodes by FLOPs, memory, or execution time

### Developer Experience
- **Python CLI**: `mlgraph optimize model.mlg --passes fusion,dce,memory`
- **VS Code extension**: Syntax highlighting and preview for `.mlg` files
- **API**: REST/gRPC API for programmatic graph optimization

## Contributing

Contributions are welcome. Please open an [issue](https://github.com/0xtkey256/mlgraph-optimizer/issues) first to discuss what you would like to change.
