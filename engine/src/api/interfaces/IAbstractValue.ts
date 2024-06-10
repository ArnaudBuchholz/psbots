import { ValueType } from '@api/values/ValueType.js'

export interface IAbstractValue {
  readonly type: ValueType
  readonly isReadOnly: boolean
  readonly isExecutable: boolean
  /** Value implements ISharedReference */
  readonly isShared: boolean
}
