import { ValueType } from '@api/values/ValueType.js'
import { IAbstractValue } from '@api/interfaces/IAbstractValue.js'

export interface IMarkValue extends IAbstractValue {
  readonly type: ValueType.boolean
  readonly isReadOnly: true
  readonly isExecutable: false
  readonly isShared: false
}

/** A mark */
export type MarkValue = IMarkValue
