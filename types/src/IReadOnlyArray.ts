import type { Value } from './values/Value.js';

/** A read-only collection of values indexed by a number */
export interface IReadOnlyArray {
  /** number of items it can contain */
  readonly capacity: number;
  /** number of items contained */
  readonly length: number;
  /** @throws rangecheckerror */
  at: (index: number) => Value;
}
