export type DataType = 'float32' | 'float16' | 'int32' | 'int64' | 'int8' | 'uint8' | 'bool';

export interface TensorType {
  dtype: DataType;
  shape: number[];
}

export function tensorByteSize(t: TensorType): number {
  const dtypeBytes: Record<DataType, number> = {
    float32: 4,
    float16: 2,
    int32: 4,
    int64: 8,
    int8: 1,
    uint8: 1,
    bool: 1,
  };
  const elements = t.shape.reduce((a, b) => a * b, 1);
  return elements * dtypeBytes[t.dtype];
}

export function shapeToString(shape: number[]): string {
  return `[${shape.join(', ')}]`;
}

export function tensorTypeToString(t: TensorType): string {
  return `Tensor<${t.dtype}>${shapeToString(t.shape)}`;
}
