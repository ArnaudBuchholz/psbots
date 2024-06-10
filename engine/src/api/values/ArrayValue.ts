import { ValueType } from '@api/values/ValueType.js'
import { IReadOnlyArray } from '@api/interfaces/IReadOnlyArray.js'
import { IAbstractValue } from '@api/interfaces/IAbstractValue.js'
import { IArray } from '@api/interfaces/IArray.js'

interface IReadOnlyArrayValue extends IAbstractValue {
  readonly type: ValueType.array
  readonly isReadOnly: true
  readonly isExecutable: false
  readonly array: IReadOnlyArray
}

interface IBlockValue extends IAbstractValue {
  readonly type: ValueType.array
  readonly isReadOnly: true
  readonly isExecutable: true
  readonly array: IReadOnlyArray
}

interface IArrayValue extends IAbstractValue {
  readonly type: ValueType.array
  readonly isReadOnly: false
  readonly isExecutable: false
  readonly array: IArray
}

export type ArrayValue = IReadOnlyArrayValue | IBlockValue | IArrayValue
