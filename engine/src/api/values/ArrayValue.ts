import { IReadOnlyArray } from '../interfaces/IReadOnlyArray.js'
import { ValueType } from './ValueType.js'

/** An array */
export interface ArrayValue {
  readonly type: ValueType.array
  readonly array: IReadOnlyArray
}
