import type { IAbstractValue } from '@api/interfaces/IAbstractValue.js';
import type { IReadOnlyDictionary } from '@api/interfaces/IReadOnlyDictionary.js';
import type { IDictionary } from '@api/interfaces/IDictionary.js';

interface IReadOnlyDictionaryValue extends IAbstractValue {
  readonly type: 'dictionary';
  readonly isReadOnly: true;
  readonly isExecutable: false;
  readonly dictionary: IReadOnlyDictionary;
}

interface IDictionaryValue extends IAbstractValue {
  readonly type: 'dictionary';
  readonly isExecutable: false;
  readonly dictionary: IDictionary;
}

/** A collection of values indexed by a name */
export type DictionaryValue = IReadOnlyDictionaryValue | IDictionaryValue;
