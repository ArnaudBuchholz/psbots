import type { IReadOnlyDictionary, Value, DictionaryValue } from '@api/index.js';
import { SYSTEM_MEMORY_TYPE, ValueType } from '@api/index.js';
import type { DictionaryStackWhereResult, IDictionaryStack } from '@sdk/index.js';
import { DictStackUnderflowException, UndefinedException } from '@sdk/index.js';
import type { MemoryTracker } from '@core/MemoryTracker.js';
import { ValueStack } from '@core/objects/stacks/ValueStack.js';
import { SystemDictionary } from '@core/objects/dictionaries/System.js';
import { Dictionary } from '@core/objects/dictionaries/Dictionary.js';
import { EmptyDictionary } from '@core/objects/dictionaries/Empty.js';

const MIN_SIZE = 4;

export class DictionaryStack extends ValueStack implements IDictionaryStack {
  private readonly _host: IReadOnlyDictionary;
  private readonly _system: IReadOnlyDictionary;
  private readonly _global: Dictionary;
  private readonly _user: Dictionary;

  constructor(tracker: MemoryTracker, host?: IReadOnlyDictionary) {
    super(tracker, SYSTEM_MEMORY_TYPE);
    this._host = host ?? EmptyDictionary.instance;
    this._system = SystemDictionary.instance;
    this._global = new Dictionary(tracker, SYSTEM_MEMORY_TYPE);
    this._user = new Dictionary(tracker, SYSTEM_MEMORY_TYPE);
    this.begin(this.host);
    this.begin(this.system);
    this.begin(this.global);
    this.begin(this.user);
  }

  protected override _dispose(): void {
    super._dispose();
    this._user.release();
    this._global.release();
  }

  override get top(): DictionaryValue {
    return super.top as DictionaryValue;
  }

  get host(): DictionaryValue {
    return {
      type: ValueType.dictionary,
      isExecutable: false,
      isReadOnly: true,
      dictionary: this._host
    };
  }

  get system(): DictionaryValue {
    return {
      type: ValueType.dictionary,
      isExecutable: false,
      isReadOnly: true,
      dictionary: this._system
    };
  }

  get global(): DictionaryValue {
    return this._global.toValue({ isReadOnly: false });
  }

  get user(): DictionaryValue {
    return this._user.toValue({ isReadOnly: false });
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
