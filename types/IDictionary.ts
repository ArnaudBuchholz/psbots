import type { Value } from '@api/values/Value.js';
import type { IReadOnlyDictionary } from '@api/interfaces/IReadOnlyDictionary.js';
import type { Result } from '@api/Result.js';

/** A collection of values indexed by a name */
export interface IDictionary extends IReadOnlyDictionary {
  /**
   * If the new value replaces an existing one, it is returned (otherwise NullValue is returned).
   * When the replaced value is tracked, it must be released before returning (because the caller might ignore it).
   * If the value is no more valid after releasing, NullValue is returned.
   */
  def: (name: string, value: Value) => Result<Value>;
}
