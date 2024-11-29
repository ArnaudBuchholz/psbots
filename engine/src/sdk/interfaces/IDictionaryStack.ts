import type { DictionaryValue, IDictionary, IReadOnlyDictionary, Result, Value } from '@api/index.js';
import type { IStack } from '@sdk/interfaces/IStack.js';

export type DictionaryStackWhereResult = {
  dictionary: IReadOnlyDictionary | IDictionary;
  value: Value;
} | null;

/** Dictionary stack */
export interface IDictionaryStack extends IStack {
  readonly host: DictionaryValue;
  readonly system: DictionaryValue;
  readonly global: DictionaryValue;
  readonly user: DictionaryValue;
  readonly top: Result<DictionaryValue>;
  begin: (dictionary: DictionaryValue) => void;
  end: () => void;
  where: (name: string) => DictionaryStackWhereResult;
  /** throws UndefinedException if not found */
  lookup: (name: string) => Value;
}
