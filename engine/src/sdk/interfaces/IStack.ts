import type { IArray, Value } from '@api/index.js';

export interface IStack extends IArray {
  /** throws StackUnderflow if none, value is not addValueRef'ed */
  readonly top: Value;
  readonly ref: readonly Value[];
  push: (value: Value) => void;
  pop: () => void;
}
