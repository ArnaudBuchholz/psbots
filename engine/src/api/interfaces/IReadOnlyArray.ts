import type { Value } from '@api/values/Value.js'

/** A read-only collection of values indexed by a number */
export interface IReadOnlyArray {
  readonly length: number
  /** If the index is out of bound or no item is found at the given index, return null */
  at: (index: number) => Value | null
}

export function * enumIArrayValues (iArray: IReadOnlyArray): Generator<Value> {
  const { length } = iArray
  for (let index = 0; index < length; ++index) {
    const value = iArray.at(index)
    if (value !== null) {
      yield value
    }
  }
}
