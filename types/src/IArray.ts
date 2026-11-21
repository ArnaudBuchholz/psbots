import type { Value } from './values/Value.js';
import type { IReadOnlyArray } from './IReadOnlyArray.js';

/** A collection of values indexed by a number */
export interface IArray extends IReadOnlyArray {
  /** @throws vmerror */
  resize: (capacity: number) => void;
  /** @throws rangecheckerror */
  set: (index: number, value: Value) => void;
}
