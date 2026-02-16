# Examples

MLGraph Optimizer includes 13 built-in example models across 5 categories, covering a wide range of neural network architectures.

## Classic

### Simple MLP
A 3-layer multilayer perceptron with ReLU activations. Demonstrates basic linear algebra operations (MatMul, Add) and constant folding opportunities.

**Input**: `Tensor<float32>[1, 784]` (flattened MNIST image)

### Image Classifier
A CNN-based image classifier with convolutional feature extraction, global average pooling, and a fully-connected classification head.

**Input**: `Tensor<float32>[1, 3, 224, 224]` (RGB image)

## CNN

### ResNet Block
The fundamental building block of ResNets — two Conv2D+BN+ReLU layers with a skip (residual) connection. Demonstrates how Operator Fusion handles residual branches.

**Input**: `Tensor<float32>[1, 64, 56, 56]`

### ResNet Bottleneck
The bottleneck variant using 1x1 → 3x3 → 1x1 convolutions to reduce computational cost. The 1x1 convolutions project to a lower-dimensional space.

**Input**: `Tensor<float32>[1, 256, 56, 56]`

### VGG Block
Three consecutive Conv2D+BN+ReLU layers followed by MaxPooling. Represents the repeated block structure of VGG networks.

**Input**: `Tensor<float32>[1, 64, 224, 224]`

### Inception Module
Google's Inception/GoogLeNet architecture with 4 parallel branches (1x1, 3x3, 5x5 convolutions + max pooling) concatenated along the channel axis. Shows dramatic Operator Fusion results: 22 nodes → 10 (-55%).

**Input**: `Tensor<float32>[1, 192, 28, 28]`

## Transformer

### Multi-Head Attention
Self-attention mechanism with Query/Key/Value projections, scaled dot-product attention (MatMul + Softmax), and output projection with LayerNorm.

**Input**: `Tensor<float32>[1, 128, 512]`

### Transformer Block
A complete Transformer encoder block: self-attention → residual + LayerNorm → feed-forward (GELU) → residual + LayerNorm. Shows MatMul+Add fusion in attention and FFN layers.

**Input**: `Tensor<float32>[1, 128, 768]`

### Seq2Seq Encoder-Decoder
A sequence-to-sequence model with separate encoder and decoder attention mechanisms and a cross-attention connection. Demonstrates multi-input models.

**Inputs**: `Tensor<float32>[1, 128, 512]` (encoder), `Tensor<float32>[1, 64, 512]` (decoder)

## Generative

### Conv Autoencoder
An encoder-decoder architecture for image reconstruction. The encoder compresses via Conv2D+MaxPool, and the decoder reconstructs via Conv2D layers with Sigmoid output.

**Input**: `Tensor<float32>[1, 3, 64, 64]`

### GAN Generator
A generator network that transforms a latent vector into an image through projection, reshaping, and transposed convolution-like upsampling blocks.

**Input**: `Tensor<float32>[1, 128]` (latent vector)

## Efficient

### Depthwise Separable Conv
MobileNet-style depthwise separable convolutions: depthwise Conv2D (per-channel) followed by pointwise 1x1 Conv2D. Two blocks shown.

**Input**: `Tensor<float32>[1, 32, 112, 112]`

### Squeeze-and-Excitation
Channel attention mechanism: GlobalAvgPool → FC → ReLU → FC → Sigmoid → channel-wise scaling, with a residual connection. Demonstrates the interaction between convolution and attention paths.

**Input**: `Tensor<float32>[1, 64, 56, 56]`

## Adding Your Own Models

Write a model definition in the editor using the [DSL syntax](dsl-reference.md) and click **Compile & Optimize**. The DSL supports all 26+ operations listed in the reference.
