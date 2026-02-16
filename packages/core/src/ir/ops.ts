export type OpType =
  | 'Input'
  | 'Output'
  | 'Constant'
  // Linear algebra
  | 'MatMul'
  | 'Add'
  | 'Mul'
  // Convolution
  | 'Conv2D'
  // Normalization
  | 'BatchNorm'
  | 'LayerNorm'
  // Activation
  | 'ReLU'
  | 'GELU'
  | 'Sigmoid'
  | 'Softmax'
  // Pooling
  | 'MaxPool2D'
  | 'AvgPool2D'
  | 'GlobalAvgPool'
  // Shape manipulation
  | 'Reshape'
  | 'Transpose'
  | 'Flatten'
  | 'Concat'
  | 'Split'
  // Reduction
  | 'ReduceSum'
  | 'ReduceMean'
  // Fused ops (produced by optimization)
  | 'FusedConvBNReLU'
  | 'FusedLinear'
  | 'FusedMatMulAdd';

export interface OpSignature {
  minInputs: number;
  maxInputs: number;
  numOutputs: number;
  description: string;
  category: 'io' | 'linear' | 'conv' | 'norm' | 'activation' | 'pool' | 'shape' | 'reduce' | 'fused';
}

export const OP_REGISTRY: Record<OpType, OpSignature> = {
  Input:          { minInputs: 0, maxInputs: 0, numOutputs: 1, description: 'Model input tensor', category: 'io' },
  Output:         { minInputs: 1, maxInputs: 1, numOutputs: 0, description: 'Model output tensor', category: 'io' },
  Constant:       { minInputs: 0, maxInputs: 0, numOutputs: 1, description: 'Constant tensor value', category: 'io' },
  MatMul:         { minInputs: 2, maxInputs: 2, numOutputs: 1, description: 'Matrix multiplication', category: 'linear' },
  Add:            { minInputs: 2, maxInputs: 2, numOutputs: 1, description: 'Element-wise addition', category: 'linear' },
  Mul:            { minInputs: 2, maxInputs: 2, numOutputs: 1, description: 'Element-wise multiplication', category: 'linear' },
  Conv2D:         { minInputs: 1, maxInputs: 3, numOutputs: 1, description: '2D convolution', category: 'conv' },
  BatchNorm:      { minInputs: 1, maxInputs: 1, numOutputs: 1, description: 'Batch normalization', category: 'norm' },
  LayerNorm:      { minInputs: 1, maxInputs: 1, numOutputs: 1, description: 'Layer normalization', category: 'norm' },
  ReLU:           { minInputs: 1, maxInputs: 1, numOutputs: 1, description: 'Rectified linear unit', category: 'activation' },
  GELU:           { minInputs: 1, maxInputs: 1, numOutputs: 1, description: 'Gaussian error linear unit', category: 'activation' },
  Sigmoid:        { minInputs: 1, maxInputs: 1, numOutputs: 1, description: 'Sigmoid activation', category: 'activation' },
  Softmax:        { minInputs: 1, maxInputs: 1, numOutputs: 1, description: 'Softmax normalization', category: 'activation' },
  MaxPool2D:      { minInputs: 1, maxInputs: 1, numOutputs: 1, description: '2D max pooling', category: 'pool' },
  AvgPool2D:      { minInputs: 1, maxInputs: 1, numOutputs: 1, description: '2D average pooling', category: 'pool' },
  GlobalAvgPool:  { minInputs: 1, maxInputs: 1, numOutputs: 1, description: 'Global average pooling', category: 'pool' },
  Reshape:        { minInputs: 1, maxInputs: 1, numOutputs: 1, description: 'Reshape tensor', category: 'shape' },
  Transpose:      { minInputs: 1, maxInputs: 1, numOutputs: 1, description: 'Transpose tensor dimensions', category: 'shape' },
  Flatten:        { minInputs: 1, maxInputs: 1, numOutputs: 1, description: 'Flatten tensor to 2D', category: 'shape' },
  Concat:         { minInputs: 2, maxInputs: 16, numOutputs: 1, description: 'Concatenate tensors', category: 'shape' },
  Split:          { minInputs: 1, maxInputs: 1, numOutputs: 4, description: 'Split tensor', category: 'shape' },
  ReduceSum:      { minInputs: 1, maxInputs: 1, numOutputs: 1, description: 'Sum reduction', category: 'reduce' },
  ReduceMean:     { minInputs: 1, maxInputs: 1, numOutputs: 1, description: 'Mean reduction', category: 'reduce' },
  FusedConvBNReLU:{ minInputs: 1, maxInputs: 3, numOutputs: 1, description: 'Fused Conv2D + BatchNorm + ReLU', category: 'fused' },
  FusedLinear:    { minInputs: 1, maxInputs: 1, numOutputs: 1, description: 'Fused MatMul + Add (linear layer)', category: 'fused' },
  FusedMatMulAdd: { minInputs: 2, maxInputs: 3, numOutputs: 1, description: 'Fused MatMul + Add', category: 'fused' },
};

export const OP_COLORS: Record<OpSignature['category'], string> = {
  io: '#6366f1',
  linear: '#3b82f6',
  conv: '#8b5cf6',
  norm: '#ec4899',
  activation: '#f59e0b',
  pool: '#10b981',
  shape: '#64748b',
  reduce: '#06b6d4',
  fused: '#ef4444',
};
