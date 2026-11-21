import type { Value } from './values/Value.js';
import type { IReadOnlyDictionary } from './IReadOnlyDictionary.js';

/** A collection of values indexed by a name */
export interface IDictionary extends IReadOnlyDictionary {
  /** @throws vmerror */
  def: (name: string, value: Value) => void;
}
