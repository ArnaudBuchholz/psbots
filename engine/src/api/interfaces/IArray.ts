import { Value } from '../values/Value.js'
import { IReadOnlyArray } from './IReadOnlyArray.js'

/** A collection of values indexed by a number */
export interface IArray extends IReadOnlyArray {
  set: (index: number, value: Value) => Value | null
}
