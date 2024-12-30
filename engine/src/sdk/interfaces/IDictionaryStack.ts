import type { DictionaryValue, IDictionary, IReadOnlyDictionary, NullValue, Result, Value } from '@api/index.js';
import type { IStack } from '@sdk/index.js';
import { DictStackUnderflowException, UndefinedException } from '@sdk/index.js';

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
  readonly top: DictionaryValue | NullValue;
  /** Returns the new length */
  begin: (dictionary: DictionaryValue) => Result<number>;
  /** Returns the new length */
  end: () => Result<number, DictStackUnderflowException>;
  where: (name: string) => DictionaryStackWhereResult;
  lookup: (name: string) => Result<Value, UndefinedException>;
}
