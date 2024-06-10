import { ValueType } from './ValueType.js'
import { IReadOnlyArray } from '../interfaces/IReadOnlyArray.js'

/** An executable block, instructions can be enumerated through the IReadOnlyArray */
export interface BlockValue {
  readonly type: ValueType.block
  readonly block: IReadOnlyArray
}
