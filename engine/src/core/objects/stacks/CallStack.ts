import type { IState, MemoryType, Result, Value } from '@api/index.js';
import { enumIArrayValues, nullValue, SYSTEM_MEMORY_TYPE } from '@api/index.js';
import type { ICallStack } from '@sdk/index.js';
import {
  OPERATOR_STATE_UNKNOWN,
  OPERATOR_STATE_FIRST_CALL,
  OPERATOR_STATE_POP,
  OPERATOR_STATE_CALL_BEFORE_POP,
  assert,
  StackUnderflowException
} from '@sdk/index.js';
import { addMemorySize, type MemorySize, type MemoryTracker } from '@core/MemoryTracker.js';
import { ValueStack } from '@core/objects/stacks/ValueStack.js';
import { Dictionary } from '@core/objects/dictionaries/Dictionary.js';

const OPERATOR_STATE_INVALID = 'Invalid operator state change';

export class CallStack extends ValueStack implements ICallStack {
  static override create(memoryTracker: MemoryTracker, memoryType: MemoryType, initialCapacity: number, capacityIncrement: number): Result<CallStack> {
    assert(memoryType === SYSTEM_MEMORY_TYPE);
    return super.createInstance(memoryTracker, memoryType, initialCapacity, capacityIncrement)
  }

  private _dictionaries: (Dictionary | undefined)[] = [];
  private _steps: (number | undefined)[] = [];

  static override getSize(capacity: number): MemorySize {
    return addMemorySize(super.getSize(capacity), {
      integers: capacity,
      pointers: capacity
    });
  }

  protected override getIncrementSize(capacity: number): MemorySize {
    return addMemorySize(super.getIncrementSize(capacity), {
      integers: capacity,
      pointers: capacity
    });
  }

  protected override pushImpl(value: Value): void {
    super.pushImpl(value);
    this._dictionaries.unshift(undefined);
    this._steps.unshift(OPERATOR_STATE_UNKNOWN);
  }

  protected override popImpl(): Value {
    const result = super.popImpl();
    const dictionary = this._dictionaries[0];
    if (dictionary !== undefined) {
      dictionary.release();
    }
    this._dictionaries.shift();
    this._steps.shift();
    return result;
  }

  callStack(): IState['callStack'] {
    return [...enumIArrayValues(this)].map((value, index) => ({
      value,
      operatorState: this._steps[index]!
    }));
  }

  // region IDictionary

  get names(): string[] {
    return [];
  }

  lookup(name: string): Value {
    const dictionary = this._dictionaries[0];
    if (dictionary === undefined) {
      return nullValue;
    }
    return dictionary.lookup(name);
  }

  def(name: string, value: Value): Result<Value> {
    if (this.length === 0) {
      return { success: false, error: new StackUnderflowException() }
    }
    let dictionary = this._dictionaries[0];
    if (dictionary === undefined) {
      // TODO: what should be the strategy ?
      const dictionaryResult = Dictionary.create(this.memoryTracker, SYSTEM_MEMORY_TYPE, 1);
      if (!dictionaryResult.success) {
        return dictionaryResult;
      }
      dictionary = dictionaryResult.value;
      this._dictionaries[0] = dictionary;
    }
    return dictionary.def(name, value);
  }

  // endregion IDictionary

  // region ICallStack

  get topOperatorState(): number {
    assert(this.length > 0);
    return this._steps[0]!; // Because length has been tested
  }

  set topOperatorState(value: number) {
    const current = this.topOperatorState;
    if (
      (current === OPERATOR_STATE_UNKNOWN && value !== OPERATOR_STATE_FIRST_CALL) ||
      (current !== OPERATOR_STATE_UNKNOWN && value === OPERATOR_STATE_FIRST_CALL) ||
      value === OPERATOR_STATE_UNKNOWN ||
      current === OPERATOR_STATE_POP ||
      (value !== OPERATOR_STATE_POP &&
        ((current > OPERATOR_STATE_FIRST_CALL && value < OPERATOR_STATE_CALL_BEFORE_POP) ||
          (current < OPERATOR_STATE_CALL_BEFORE_POP && value >= OPERATOR_STATE_CALL_BEFORE_POP) ||
          (current < OPERATOR_STATE_FIRST_CALL && value >= OPERATOR_STATE_FIRST_CALL) ||
          (current === OPERATOR_STATE_FIRST_CALL && value < OPERATOR_STATE_CALL_BEFORE_POP)))
    ) {
      assert(false, OPERATOR_STATE_INVALID);
    }
    this._steps[0] = value;
  }

  // endregion
}
