import type { Value, DictionaryValue, Result, MemoryType } from '@api/index.js';
import { SYSTEM_MEMORY_TYPE, ValueType } from '@api/index.js';
import type { DictionaryStackWhereResult, IDictionaryStack } from '@sdk/index.js';
import { assert, DictStackUnderflowException, UndefinedException } from '@sdk/index.js';
import type { MemoryTracker } from '@core/MemoryTracker.js';
import { ValueStack } from '@core/objects/stacks/ValueStack.js';
import { SystemDictionary } from '@core/objects/dictionaries/System.js';
import { EmptyDictionary } from '@core/objects/dictionaries/Empty.js';

const MIN_SIZE = 4;
const HOST_INDEX_FROM_BOTTOM = -1;
const SYSTEM_INDEX_FROM_BOTTOM = -2;
const GLOBAL_INDEX_FROM_BOTTOM = -3;
const USER_INDEX_FROM_BOTTOM = -4;

export class DictionaryStack extends ValueStack implements IDictionaryStack {
  static override create(memoryTracker: MemoryTracker, memoryType: MemoryType, initialCapacity: number, capacityIncrement: number): Result<DictionaryStack> {
    assert(memoryType === SYSTEM_MEMORY_TYPE);
    assert(initialCapacity > 4);
    return super.createInstance(memoryTracker, memoryType, initialCapacity, capacityIncrement)
  }

  protected constructor(tracker: MemoryTracker, memoryType: MemoryType, initialCapacity: number, capacityIncrement: number) {
    super(tracker, memoryType, initialCapacity, capacityIncrement);
    this.begin({
      type: ValueType.dictionary,
      isExecutable: false,
      isReadOnly: true,
      dictionary: EmptyDictionary.instance
    });
    this.begin({
      type: ValueType.dictionary,
      isExecutable: false,
      isReadOnly: true,
      dictionary: SystemDictionary.instance
    });
    this.begin({
      type: ValueType.dictionary,
      isExecutable: false,
      isReadOnly: false,
      dictionary: EmptyDictionary.instance
    });
    this.begin({
      type: ValueType.dictionary,
      isExecutable: false,
      isReadOnly: false,
      dictionary: EmptyDictionary.instance
    });
  }

  protected getDictionaryValue (indexFromBottom: number): DictionaryValue {
    const value = this._values[this._values.length + indexFromBottom];
    assert(!!value && value.type === ValueType.dictionary);
    return value;
  }

  setHost(value: DictionaryValue) {
    this._values[MIN_SIZE + HOST_INDEX_FROM_BOTTOM] = value;
    value.tracker?.addValueRef(value);
  }

  setGlobal(global: DictionaryValue) {
    const value = this.getDictionaryValue(GLOBAL_INDEX_FROM_BOTTOM);
    assert(value.dictionary === EmptyDictionary.instance);
    this._values[MIN_SIZE + GLOBAL_INDEX_FROM_BOTTOM] = global;
    global.tracker?.addValueRef(global);
  }

  setUser(user: DictionaryValue) {
    const value = this.getDictionaryValue(USER_INDEX_FROM_BOTTOM);
    assert(value.dictionary === EmptyDictionary.instance);
    this._values[MIN_SIZE + USER_INDEX_FROM_BOTTOM] = user;
    user.tracker?.addValueRef(user);
  }

  override get top(): Result<DictionaryValue> {
    return super.top as Result<DictionaryValue>;
  }

  // region IDictionaryStack

  get host(): DictionaryValue {
    return this.getDictionaryValue(HOST_INDEX_FROM_BOTTOM);
  }

  get system(): DictionaryValue {
    return this.getDictionaryValue(SYSTEM_INDEX_FROM_BOTTOM);
  }

  get global(): DictionaryValue {
    return this.getDictionaryValue(GLOBAL_INDEX_FROM_BOTTOM);
  }

  get user(): DictionaryValue {
    return this.getDictionaryValue(USER_INDEX_FROM_BOTTOM);
  }

  begin(dictionary: DictionaryValue): Result<number> {
    return this.push(dictionary);
  }

  end(): Result<number> {
    if (this.length === MIN_SIZE) {
      return { success: false, error: new DictStackUnderflowException() };
    }
    this.pop();
    return { success: true, value: this.length };
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
