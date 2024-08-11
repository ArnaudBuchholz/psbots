import type { IReadOnlyArray, Value } from '@api/index.js';

export interface IStack extends IReadOnlyArray {
  /** throws StackUnderflow if none, value is not addValueRef'ed */
  readonly top: Value;
  readonly ref: readonly Value[];
  push: (value: Value) => void;
  pop: () => void;
}
