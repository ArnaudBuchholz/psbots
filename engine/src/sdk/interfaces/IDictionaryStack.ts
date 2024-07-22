import type { DictionaryValue, IDictionary, IReadOnlyDictionary, Value } from '@api/index.js';
import type { IStack } from '@sdk/interfaces/IStack.js';

export type DictionaryStackWhereResult = {
  dictionary: IReadOnlyDictionary | IDictionary;
  value: Value;
} | null;

export interface IDictionaryStack extends IStack {
  readonly host: IReadOnlyDictionary;
  readonly system: IReadOnlyDictionary;
  readonly global: IDictionary;
  readonly top: DictionaryValue;
  begin: (dictionary: DictionaryValue) => void;
  end: () => void;
  where: (name: string) => DictionaryStackWhereResult;
  /** throws UndefinedException if not found */
  lookup: (name: string) => Value;
}
