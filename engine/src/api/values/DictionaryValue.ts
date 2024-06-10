import { ValueType } from '@api/values/ValueType.js'
import { IAbstractValue } from '@api/interfaces/IAbstractValue.js'
import { IReadOnlyDictionary } from '@api/interfaces/IReadOnlyDictionary.js'
import { IDictionary } from '@api/interfaces/IDictionary.js'

interface IReadOnlyDictionaryValue extends IAbstractValue {
  readonly type: ValueType.array
  readonly isReadOnly: true
  readonly isExecutable: false
  readonly dictionary: IReadOnlyDictionary
}

interface IDictionaryValue extends IAbstractValue {
  readonly type: ValueType.array
  readonly isExecutable: false
  readonly dictionary: IDictionary
}

/** A collection of values indexed by a name */
export type DictionaryValue = IReadOnlyDictionaryValue | IDictionaryValue
