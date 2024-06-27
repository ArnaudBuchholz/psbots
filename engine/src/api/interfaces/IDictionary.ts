import type { Value } from '@api/values/Value.js';
import type { IReadOnlyDictionary } from '@api/interfaces/IReadOnlyDictionary';

/** A collection of values indexed by a name */
export interface IDictionary extends IReadOnlyDictionary {
  /**
   * If the new value replaces an existing one, it is returned (otherwise null).
   * When the replaced value is tracked, it must be released before returning (because the caller might ignore it).
   * If the value is no more valid after releasing, null is returned.
   */
  def: (name: string, value: Value) => Value | null;
}
