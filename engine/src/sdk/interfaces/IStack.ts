import type { IArray, Value } from '@api/index.js';

export interface IStack extends IArray {
  readonly ref: readonly Value[];
  push: (value: Value) => void;
  pop: () => void;
}
