import type { Value } from '@api/values/Value.js';

/** A read-only collection of values indexed by a number */
export interface IReadOnlyArray {
  readonly length: number;
  /** If the index is out of bound or no item is found at the given index, return NullValue */
  at: (index: number) => Value;
}

/** Enumerate IReadOnlyArray values */
export function* enumIArrayValues(array: IReadOnlyArray): Generator<Value> {
  const { length } = array;
  for (let index = 0; index < length; ++index) {
    yield array.at(index);
  }
}
