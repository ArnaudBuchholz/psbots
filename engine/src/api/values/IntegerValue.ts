import { ValueType } from '@api/values/ValueType.js'
import { IAbstractValue } from '@api/interfaces/IAbstractValue.js'

/** A boolean */
export interface IIntegerValue extends IAbstractValue {
  readonly type: ValueType.boolean
  readonly isReadOnly: true
  readonly isExecutable: false
  readonly isShared: false
  readonly number: number
}

/** An integer */
export type IntegerValue = IIntegerValue
