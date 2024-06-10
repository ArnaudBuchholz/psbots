import { ValueType } from './ValueType.js'

/** A boolean */
export interface BooleanValue {
  readonly type: ValueType.boolean
  readonly isSet: boolean
}
