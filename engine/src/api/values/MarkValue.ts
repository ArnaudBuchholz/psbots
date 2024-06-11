import type { ValueType } from '@api/values/ValueType.js'
import type { IAbstractValue } from '@api/interfaces/IAbstractValue.js'

export interface IMarkValue extends IAbstractValue {
  readonly type: ValueType.mark
  readonly isReadOnly: true
  readonly isExecutable: false
  readonly isShared: false
}

/** A mark */
export type MarkValue = IMarkValue
