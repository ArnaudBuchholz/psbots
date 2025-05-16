import type { IReadOnlyArray, Result, Value } from '@api/index.js';

/** A LIFO list of values */
export interface IStack extends IReadOnlyArray {
  readonly top: Value;
  /** Returns the new length */
  push: (value: Value) => Result<number>;
  pop: () => void;
}
