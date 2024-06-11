import type { Value } from '@api/values/Value.js'
import type { IReadOnlyArray } from '@api/interfaces/IReadOnlyArray.js'

/** A collection of values indexed by a number */
export interface IArray extends IReadOnlyArray {
  /**
   * If the new value replaces an existing one, it is returned (otherwise null).
   * When the replaced value is shared, it must be released before returning (because the caller might ignore it).
   * If the reference count of the shared value reaches 0 after releasing, null is returned.
   */
  set: (index: number, value: Value) => Value | null
}
