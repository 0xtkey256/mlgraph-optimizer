export const EXAMPLES: Record<string, { name: string; code: string }> = {
  'resnet-block': {
    name: 'ResNet Block',
    code: `model ResNetBlock {
  input x: Tensor<float32>[1, 64, 56, 56]

  conv1 = Conv2D(x, filters=64, kernel=3, padding=1)
  bn1 = BatchNorm(conv1)
  relu1 = ReLU(bn1)
  conv2 = Conv2D(relu1, filters=64, kernel=3, padding=1)
  bn2 = BatchNorm(conv2)
  residual = Add(bn2, x)
  out = ReLU(residual)

  output out
}`,
  },
  'simple-mlp': {
    name: 'Simple MLP',
    code: `model SimpleMLP {
  input x: Tensor<float32>[1, 784]

  w1 = Constant()
  linear1 = MatMul(x, w1)
  b1 = Constant()
  add1 = Add(linear1, b1)
  relu1 = ReLU(add1)

  w2 = Constant()
  linear2 = MatMul(relu1, w2)
  b2 = Constant()
  add2 = Add(linear2, b2)
  relu2 = ReLU(add2)

  w3 = Constant()
  linear3 = MatMul(relu2, w3)
  b3 = Constant()
  add3 = Add(linear3, b3)

  output add3
}`,
  },
  'transformer-attention': {
    name: 'Transformer Attention',
    code: `model TransformerAttention {
  input x: Tensor<float32>[1, 128, 512]

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
  proj = MatMul(context, wo)
  bo = Constant()
  out = Add(proj, bo)
  norm = LayerNorm(out)

  output norm
}`,
  },
};

export const DEFAULT_EXAMPLE = 'resnet-block';
