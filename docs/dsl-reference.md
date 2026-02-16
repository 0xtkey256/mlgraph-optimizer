# DSL Reference

MLGraph Optimizer uses a concise domain-specific language for defining neural network models. The syntax is designed to be readable while mapping directly to computation graph nodes.

## Syntax Overview

```
model ModelName {
  input name: Tensor<dtype>[shape]

  variable = Operation(inputs, key=value, ...)

  output variable
}
```

## Model Declaration

Every model starts with a `model` block:

```
model ResNetBlock {
  ...
}
```

The model name is used as metadata in the compiled graph.

## Input Declaration

Inputs define the entry tensors to the graph:

```
input x: Tensor<float32>[1, 64, 56, 56]
```

- **name**: Variable name for referencing in operations
- **dtype**: Data type — `float32`, `float16`, `int32`, `int64`, `bool`
- **shape**: Comma-separated dimensions in brackets

Multiple inputs are supported:

```
input encoder_in: Tensor<float32>[1, 128, 512]
input decoder_in: Tensor<float32>[1, 64, 512]
```

## Operations

Operations are assigned to variables and reference previous variables as inputs:

```
conv1 = Conv2D(x, filters=64, kernel=3, padding=1)
bn1 = BatchNorm(conv1)
relu1 = ReLU(bn1)
```

### Positional Arguments

The first arguments are tensor inputs (references to other variables):

```
residual = Add(bn2, x)        // Two tensor inputs
out = Concat(a, b, c, axis=1) // Three tensor inputs + attribute
```

### Keyword Arguments

Named parameters after tensor inputs set operation attributes:

```
Conv2D(x, filters=64, kernel=3, padding=1, stride=1)
Reshape(x, shape=1,256,4,4)
Transpose(k, perm=0,2,1)
```

## Output Declaration

The output statement marks which variable(s) produce the final graph outputs:

```
output out
```

## Comments

Line comments are supported with `//`:

```
// 1x1 branch
branch1 = Conv2D(x, filters=64, kernel=1, padding=0)
```

## Supported Operations

### Input/Output
| Operation | Description | Attributes |
|-----------|-------------|------------|
| `Input` | Graph entry point | (declared via `input` keyword) |
| `Output` | Graph exit point | (declared via `output` keyword) |
| `Constant()` | Constant tensor value | — |

### Linear Algebra
| Operation | Description | Attributes |
|-----------|-------------|------------|
| `MatMul(a, b)` | Matrix multiplication | — |
| `Add(a, b)` | Element-wise addition | — |
| `Mul(a, b)` | Element-wise multiplication | — |

### Convolution
| Operation | Description | Attributes |
|-----------|-------------|------------|
| `Conv2D(x, ...)` | 2D convolution | `filters`, `kernel`, `padding`, `stride` |

### Normalization
| Operation | Description | Attributes |
|-----------|-------------|------------|
| `BatchNorm(x)` | Batch normalization | — |
| `LayerNorm(x)` | Layer normalization | — |

### Activation
| Operation | Description | Attributes |
|-----------|-------------|------------|
| `ReLU(x)` | Rectified linear unit | — |
| `GELU(x)` | Gaussian error linear unit | — |
| `Sigmoid(x)` | Sigmoid activation | — |
| `Softmax(x)` | Softmax activation | — |

### Pooling
| Operation | Description | Attributes |
|-----------|-------------|------------|
| `MaxPool2D(x, ...)` | Max pooling | `kernel`, `stride` |
| `AvgPool2D(x, ...)` | Average pooling | `kernel`, `stride` |
| `GlobalAvgPool(x)` | Global average pooling | — |

### Shape Manipulation
| Operation | Description | Attributes |
|-----------|-------------|------------|
| `Reshape(x, ...)` | Reshape tensor | `shape` (comma-separated) |
| `Transpose(x, ...)` | Transpose dimensions | `perm` (comma-separated) |
| `Flatten(x)` | Flatten to 2D | — |
| `Concat(a, b, ..., axis=n)` | Concatenate tensors | `axis` |
| `Split(x, ...)` | Split tensor | `axis`, `chunks` |

### Reduction
| Operation | Description | Attributes |
|-----------|-------------|------------|
| `ReduceSum(x, ...)` | Sum reduction | `axis` |
| `ReduceMean(x, ...)` | Mean reduction | `axis` |

## Complete Example

```
model TransformerBlock {
  input x: Tensor<float32>[1, 128, 768]

  // Self-attention
  wq = Constant()
  wk = Constant()
  wv = Constant()
  q = MatMul(x, wq)
  k = MatMul(x, wk)
  v = MatMul(x, wv)
  kt = Transpose(k, perm=0,2,1)
  scores = MatMul(q, kt)
  attn = Softmax(scores)
  context = MatMul(attn, v)
  wo = Constant()
  attn_out = MatMul(context, wo)
  bo = Constant()
  attn_proj = Add(attn_out, bo)

  // Residual + LayerNorm
  attn_res = Add(attn_proj, x)
  norm1 = LayerNorm(attn_res)

  // Feed-forward
  wff1 = Constant()
  ff1 = MatMul(norm1, wff1)
  bff1 = Constant()
  ff1_bias = Add(ff1, bff1)
  ff_act = GELU(ff1_bias)
  wff2 = Constant()
  ff2 = MatMul(ff_act, wff2)
  bff2 = Constant()
  ff2_bias = Add(ff2, bff2)

  // Residual + LayerNorm
  ff_res = Add(ff2_bias, norm1)
  out = LayerNorm(ff_res)

  output out
}
```
