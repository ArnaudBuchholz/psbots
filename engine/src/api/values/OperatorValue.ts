import type { ValueType } from '@api/values/ValueType.js'
import type { IAbstractValue } from '@api/interfaces/IAbstractValue.js'
import type { IAbstractOperator } from '@api/interfaces/IAbstractOperator.js'

/** A boolean */
export interface IOperatorValue extends IAbstractValue {
  readonly type: ValueType.operator
  readonly isReadOnly: true
  readonly isExecutable: true
  readonly operator: IAbstractOperator
}

/** An operator */
export type OperatorValue = IOperatorValue
