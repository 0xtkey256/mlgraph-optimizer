export interface Example {
  name: string;
  category: string;
  code: string;
}

export const EXAMPLES: Record<string, Example> = {
  'resnet-block': {
    name: 'ResNet Block',
    category: 'CNN',
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
    category: 'Classic',
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
    name: 'Multi-Head Attention',
    category: 'Transformer',
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
  'vgg-block': {
    name: 'VGG Block',
    category: 'CNN',
    code: `model VGGBlock {
  input x: Tensor<float32>[1, 64, 224, 224]

  conv1 = Conv2D(x, filters=128, kernel=3, padding=1)
  bn1 = BatchNorm(conv1)
  relu1 = ReLU(bn1)
  conv2 = Conv2D(relu1, filters=128, kernel=3, padding=1)
  bn2 = BatchNorm(conv2)
  relu2 = ReLU(bn2)
  conv3 = Conv2D(relu2, filters=128, kernel=3, padding=1)
  bn3 = BatchNorm(conv3)
  relu3 = ReLU(bn3)
  pool = MaxPool2D(relu3, kernel=2, stride=2)

  output pool
}`,
  },
  'bottleneck': {
    name: 'ResNet Bottleneck',
    category: 'CNN',
    code: `model ResNetBottleneck {
  input x: Tensor<float32>[1, 256, 56, 56]

  conv1 = Conv2D(x, filters=64, kernel=1, padding=0)
  bn1 = BatchNorm(conv1)
  relu1 = ReLU(bn1)

  conv2 = Conv2D(relu1, filters=64, kernel=3, padding=1)
  bn2 = BatchNorm(conv2)
  relu2 = ReLU(bn2)

  conv3 = Conv2D(relu2, filters=256, kernel=1, padding=0)
  bn3 = BatchNorm(conv3)

  residual = Add(bn3, x)
  out = ReLU(residual)

  output out
}`,
  },
  'inception-module': {
    name: 'Inception Module',
    category: 'CNN',
    code: `model InceptionModule {
  input x: Tensor<float32>[1, 192, 28, 28]

  // 1x1 branch
  branch1 = Conv2D(x, filters=64, kernel=1, padding=0)
  b1_bn = BatchNorm(branch1)
  b1_relu = ReLU(b1_bn)

  // 3x3 branch
  reduce3 = Conv2D(x, filters=96, kernel=1, padding=0)
  r3_bn = BatchNorm(reduce3)
  r3_relu = ReLU(r3_bn)
  branch3 = Conv2D(r3_relu, filters=128, kernel=3, padding=1)
  b3_bn = BatchNorm(branch3)
  b3_relu = ReLU(b3_bn)

  // 5x5 branch
  reduce5 = Conv2D(x, filters=16, kernel=1, padding=0)
  r5_bn = BatchNorm(reduce5)
  r5_relu = ReLU(r5_bn)
  branch5 = Conv2D(r5_relu, filters=32, kernel=5, padding=2)
  b5_bn = BatchNorm(branch5)
  b5_relu = ReLU(b5_bn)

  // Pool branch
  pool = MaxPool2D(x, kernel=3, stride=1)
  pool_proj = Conv2D(pool, filters=32, kernel=1, padding=0)
  pp_bn = BatchNorm(pool_proj)
  pp_relu = ReLU(pp_bn)

  out = Concat(b1_relu, b3_relu, b5_relu, pp_relu, axis=1)

  output out
}`,
  },
  'transformer-block': {
    name: 'Transformer Block',
    category: 'Transformer',
    code: `model TransformerBlock {
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
}`,
  },
  'autoencoder': {
    name: 'Conv Autoencoder',
    category: 'Generative',
    code: `model ConvAutoencoder {
  input x: Tensor<float32>[1, 3, 64, 64]

  // Encoder
  enc1 = Conv2D(x, filters=32, kernel=3, padding=1)
  enc1_bn = BatchNorm(enc1)
  enc1_act = ReLU(enc1_bn)
  pool1 = MaxPool2D(enc1_act, kernel=2, stride=2)

  enc2 = Conv2D(pool1, filters=64, kernel=3, padding=1)
  enc2_bn = BatchNorm(enc2)
  enc2_act = ReLU(enc2_bn)
  pool2 = MaxPool2D(enc2_act, kernel=2, stride=2)

  enc3 = Conv2D(pool2, filters=128, kernel=3, padding=1)
  enc3_bn = BatchNorm(enc3)
  latent = ReLU(enc3_bn)

  // Decoder
  dec1 = Conv2D(latent, filters=64, kernel=3, padding=1)
  dec1_bn = BatchNorm(dec1)
  dec1_act = ReLU(dec1_bn)

  dec2 = Conv2D(dec1_act, filters=32, kernel=3, padding=1)
  dec2_bn = BatchNorm(dec2)
  dec2_act = ReLU(dec2_bn)

  recon = Conv2D(dec2_act, filters=3, kernel=3, padding=1)
  out = Sigmoid(recon)

  output out
}`,
  },
  'gan-generator': {
    name: 'GAN Generator',
    category: 'Generative',
    code: `model GANGenerator {
  input z: Tensor<float32>[1, 128]

  // Project and reshape
  w_proj = Constant()
  proj = MatMul(z, w_proj)
  b_proj = Constant()
  proj_bias = Add(proj, b_proj)
  proj_act = ReLU(proj_bias)
  reshaped = Reshape(proj_act, shape=1,256,4,4)

  // Upsample blocks
  up1 = Conv2D(reshaped, filters=128, kernel=3, padding=1)
  bn1 = BatchNorm(up1)
  act1 = ReLU(bn1)

  up2 = Conv2D(act1, filters=64, kernel=3, padding=1)
  bn2 = BatchNorm(up2)
  act2 = ReLU(bn2)

  up3 = Conv2D(act2, filters=32, kernel=3, padding=1)
  bn3 = BatchNorm(up3)
  act3 = ReLU(bn3)

  final = Conv2D(act3, filters=3, kernel=3, padding=1)
  out = Sigmoid(final)

  output out
}`,
  },
  'image-classifier': {
    name: 'Image Classifier',
    category: 'Classic',
    code: `model ImageClassifier {
  input img: Tensor<float32>[1, 3, 224, 224]

  // Feature extraction
  conv1 = Conv2D(img, filters=32, kernel=3, padding=1)
  bn1 = BatchNorm(conv1)
  relu1 = ReLU(bn1)
  pool1 = MaxPool2D(relu1, kernel=2, stride=2)

  conv2 = Conv2D(pool1, filters=64, kernel=3, padding=1)
  bn2 = BatchNorm(conv2)
  relu2 = ReLU(bn2)
  pool2 = MaxPool2D(relu2, kernel=2, stride=2)

  conv3 = Conv2D(pool2, filters=128, kernel=3, padding=1)
  bn3 = BatchNorm(conv3)
  relu3 = ReLU(bn3)
  gap = GlobalAvgPool(relu3)
  flat = Flatten(gap)

  // Classifier head
  w_fc = Constant()
  fc = MatMul(flat, w_fc)
  b_fc = Constant()
  logits = Add(fc, b_fc)
  probs = Softmax(logits)

  output probs
}`,
  },
  'depthwise-separable': {
    name: 'Depthwise Separable Conv',
    category: 'Efficient',
    code: `model DepthwiseSeparable {
  input x: Tensor<float32>[1, 32, 112, 112]

  // Depthwise
  dw = Conv2D(x, filters=32, kernel=3, padding=1)
  dw_bn = BatchNorm(dw)
  dw_relu = ReLU(dw_bn)

  // Pointwise
  pw = Conv2D(dw_relu, filters=64, kernel=1, padding=0)
  pw_bn = BatchNorm(pw)
  pw_relu = ReLU(pw_bn)

  // Second block
  dw2 = Conv2D(pw_relu, filters=64, kernel=3, padding=1)
  dw2_bn = BatchNorm(dw2)
  dw2_relu = ReLU(dw2_bn)

  pw2 = Conv2D(dw2_relu, filters=128, kernel=1, padding=0)
  pw2_bn = BatchNorm(pw2)
  out = ReLU(pw2_bn)

  output out
}`,
  },
  'squeeze-excite': {
    name: 'Squeeze-and-Excitation',
    category: 'Efficient',
    code: `model SqueezeExcitation {
  input x: Tensor<float32>[1, 64, 56, 56]

  // Main path
  conv1 = Conv2D(x, filters=64, kernel=3, padding=1)
  bn1 = BatchNorm(conv1)
  relu1 = ReLU(bn1)

  // Squeeze
  squeeze = GlobalAvgPool(relu1)
  flat = Flatten(squeeze)

  // Excitation
  w1 = Constant()
  fc1 = MatMul(flat, w1)
  b1 = Constant()
  fc1_bias = Add(fc1, b1)
  fc1_act = ReLU(fc1_bias)

  w2 = Constant()
  fc2 = MatMul(fc1_act, w2)
  b2 = Constant()
  fc2_bias = Add(fc2, b2)
  scale = Sigmoid(fc2_bias)

  // Scale + Residual
  scaled = Mul(relu1, scale)
  out = Add(scaled, x)

  output out
}`,
  },
};

export const EXAMPLE_CATEGORIES = [
  ...new Set(Object.values(EXAMPLES).map((e) => e.category)),
];

export const DEFAULT_EXAMPLE = 'resnet-block';
