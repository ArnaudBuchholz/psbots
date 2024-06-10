import { ValueType } from '@api/values/ValueType.js'
import { IAbstractValue } from '@api/interfaces/IAbstractValue.js'
import { IAbstractOperator } from '@api/interfaces/IAbstractOperator.js'

/** A boolean */
export interface IOperatorValue extends IAbstractValue {
  readonly type: ValueType.boolean
  readonly isReadOnly: true
  readonly isExecutable: true
  readonly operator: IAbstractOperator
}

/** An operator */
export type OperatorValue = IOperatorValue
