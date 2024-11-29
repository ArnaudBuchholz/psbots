import type { IReadOnlyArray, Result, Value } from '@api/index.js';

/** A LIFO list of values */
export interface IStack extends IReadOnlyArray {
  readonly top: Result<Value>;
  /** As memory is possibly fragmented, the only contiguous items are based on the initial capacity */
  readonly ref: readonly Value[];
  push: (value: Value) => void;
  pop: () => void;
}
