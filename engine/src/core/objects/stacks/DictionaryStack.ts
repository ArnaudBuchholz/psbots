import type { IReadOnlyDictionary, Value, DictionaryValue, Result, IDictionary, MemoryType } from '@api/index.js';
import { SYSTEM_MEMORY_TYPE, ValueType } from '@api/index.js';
import type { DictionaryStackWhereResult, IDictionaryStack } from '@sdk/index.js';
import { assert, DictStackUnderflowException, UndefinedException } from '@sdk/index.js';
import type { MemoryTracker } from '@core/MemoryTracker.js';
import { ValueStack } from '@core/objects/stacks/ValueStack.js';
import { SystemDictionary } from '@core/objects/dictionaries/System.js';
import { EmptyDictionary } from '@core/objects/dictionaries/Empty.js';
import { ShareableObject } from '../ShareableObject';

const MIN_SIZE = 4;

const _roDictToValue = (dictionary: IReadOnlyDictionary): DictionaryValue => {
  return {
    type: ValueType.dictionary,
    isExecutable: false,
    isReadOnly: true,
    dictionary
  };
}

const _dictToValue = (dictionary: IDictionary): DictionaryValue => {
  return {
    type: ValueType.dictionary,
    isExecutable: false,
    isReadOnly: false,
    dictionary
  };
}

export class DictionaryStack extends ValueStack implements IDictionaryStack {
  static override create(memoryTracker: MemoryTracker, memoryType: MemoryType, initialCapacity: number, capacityIncrement: number): Result<DictionaryStack> {
    assert(memoryType === SYSTEM_MEMORY_TYPE);
    return super.createInstance(memoryTracker, memoryType, initialCapacity, capacityIncrement)
  }

  private _host: IReadOnlyDictionary;
  private _system: IReadOnlyDictionary;
  private _global: IDictionary;
  private _user: IDictionary;

  protected constructor(tracker: MemoryTracker, memoryType: MemoryType, initialCapacity: number, capacityIncrement: number) {
    super(tracker, memoryType, initialCapacity, capacityIncrement);
    this._host = EmptyDictionary.instance;
    this._system = SystemDictionary.instance;
    this._global = EmptyDictionary.instance;
    this._user = EmptyDictionary.instance;
    this.begin(this.host);
    this.begin(this.system);
    this.begin(this.global);
    this.begin(this.user);
  }

  protected override _dispose(): void {
    super._dispose();
    if (this._user instanceof ShareableObject) {
      this._user.release();
    }
    if (this._global instanceof ShareableObject) {
      this._global.release();
    }
  }

  setHost(host: IReadOnlyDictionary) {
    assert(this._host === EmptyDictionary.instance);
    this._host = host;
  }

  setGlobal(global: IDictionary) {
    assert(this._global === EmptyDictionary.instance);
    assert(global instanceof ShareableObject);
    this._global = global;
    global.addRef();
  }

  setUser(user: IDictionary) {
    assert(this._user === EmptyDictionary.instance);
    assert(user instanceof ShareableObject);
    this._user = user;
    user.addRef();
  }

  override get top(): Result<DictionaryValue> {
    return super.top as Result<DictionaryValue>;
  }

  // region IDictionaryStack

  get host(): DictionaryValue {
    return _roDictToValue(this._host);
  }

  get system(): DictionaryValue {
    return _roDictToValue(this._system);
  }

  get global(): DictionaryValue {
    return _dictToValue(this._global);
  }

  get user(): DictionaryValue {
    return _dictToValue(this._user);
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

  // endregion IDictionaryStack
}
