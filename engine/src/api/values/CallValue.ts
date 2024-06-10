import { ValueType } from './ValueType.js'

/** A callable name */
export interface CallValue {
  readonly type: ValueType.call
  readonly call: string
}
