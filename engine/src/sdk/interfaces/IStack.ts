import type { IReadOnlyArray, Result, Value } from '@api/index.js';

/** A LIFO list of values */
export interface IStack extends IReadOnlyArray {
  readonly top: Value;
  /** Ensures capacity for at least `count` more values */
  reserve: (count: number) => Result<undefined>;
  /** Returns the new length */
  push: (value: Value) => Result<number>;
  pop: () => void;
  /** Atomic pop then push to reduce memory fragmentation */
  popush: ((count: number) => { success: true; value: number }) &
    ((count: number, valueArray: Value[], ...values: Value[]) => Result<number>) &
    ((count: number, ...values: Value[]) => Result<number>);
}
