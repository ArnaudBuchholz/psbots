import type { IReadOnlyArray, Result, Value } from '@api/index.js';

/** A LIFO list of values */
export interface IStack extends IReadOnlyArray {
  readonly top: Value;
  /** As memory is possibly fragmented, the only contiguous items are based on the initial capacity */
  readonly ref: readonly Value[];
  /** Returns the new length */
  push: (value: Value) => Result<number>;
  pop: () => void;
  /** Atomic pop then push to reduce memory fragmentation */
  // TODO: ?
  // popush: (count: number, ...values: Value[]) => Result<number>
}
