import type { IReadOnlyDictionary, IDictionary, Value, DictionaryValue } from '@api/index.js';
import { SYSTEM_MEMORY_TYPE, ValueType } from '@api/index.js';
import type { DictionaryStackWhereResult, IDictionaryStack } from '@sdk/index.js';
import { DictStackUnderflowException, UndefinedException } from '@sdk/index.js';
import type { MemoryTracker } from '@core/MemoryTracker.js';
import { ValueStack } from '@core/objects/stacks/ValueStack.js';
import { Dictionary } from '@core/objects/dictionaries/Dictionary.js';

const MIN_SIZE = 3;

export class DictionaryStack extends ValueStack implements IDictionaryStack {
  private readonly _host: IReadOnlyDictionary;
  private readonly _system: IReadOnlyDictionary;
  private readonly _global: IDictionary;

  constructor(
    tracker: MemoryTracker,
    dictionaries: {
      host?: IReadOnlyDictionary;
      system: IReadOnlyDictionary;
    }
  ) {
    super(tracker, SYSTEM_MEMORY_TYPE);
    this._host = dictionaries.host ?? new Dictionary(tracker, SYSTEM_MEMORY_TYPE);
    this._system = dictionaries.system;
    const global = new Dictionary(tracker, SYSTEM_MEMORY_TYPE);
    this._global = global;
    this.begin({
      type: ValueType.dictionary,
      isExecutable: false,
      isReadOnly: true,
      dictionary: this._host
    });
    this.begin({
      type: ValueType.dictionary,
      isExecutable: false,
      isReadOnly: true,
      dictionary: this._system
    });
    this.begin(global.toValue({ isReadOnly: false }));
  }

  override get top(): DictionaryValue {
    return super.top as DictionaryValue;
  }

  get host(): IReadOnlyDictionary {
    return this._host;
  }

  get system(): IReadOnlyDictionary {
    return this._system;
  }

  get global(): IDictionary {
    return this._global;
  }

  begin(dictionary: DictionaryValue): void {
    this.push(dictionary);
  }

  end(): void {
    if (this.length === MIN_SIZE) {
      throw new DictStackUnderflowException();
    }
    this.pop();
  }

  where(name: string): DictionaryStackWhereResult {
    for (const dictionaryValue of this._values) {
      const { dictionary } = dictionaryValue as DictionaryValue;
      const value = dictionary.lookup(name);
      if (value !== null) {
        return {
          dictionary,
          value
        };
      }
    }
    return null;
  }

  lookup(name: string): Value {
    const result = this.where(name);
    if (result === null) {
      throw new UndefinedException();
    }
    return result.value;
  }
}
