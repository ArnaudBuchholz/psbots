import { ValueType } from '@api/values/ValueType.js'
import { IAbstractValue } from '@api/interfaces/IAbstractValue.js'
import { IReadOnlyArray } from '@api/interfaces/IReadOnlyArray.js'
import { IArray } from '@api/interfaces/IArray.js'

interface IReadOnlyArrayValue extends IAbstractValue {
  readonly type: ValueType.array
  readonly isReadOnly: true
  readonly array: IReadOnlyArray
}

interface IArrayValue extends IAbstractValue {
  readonly type: ValueType.array
  readonly isReadOnly: false
  readonly isExecutable: false
  readonly array: IArray
}

/** A collection of values indexed by a number */
export type ArrayValue = IReadOnlyArrayValue | IArrayValue
