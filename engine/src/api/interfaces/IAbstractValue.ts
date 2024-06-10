import { ValueType } from '../values/ValueType.js'

export interface IAbstractValue {
  readonly type: ValueType
  readonly isReadOnly: boolean
  readonly isExecutable: boolean
}
