import type { Value } from '@api/index.js';
import { SYSTEM_MEMORY_TYPE } from '@api/index.js';
import type { ICallStack } from '@sdk/index.js';
import {
  InternalException,
  OPERATOR_STATE_UNKNOWN,
  OPERATOR_STATE_FIRST_CALL,
  OPERATOR_STATE_POP,
  OPERATOR_STATE_REQUEST_CALL_BEFORE_POP,
  OPERATOR_STATE_CALL_BEFORE_POP
} from '@sdk/index.js';
import type { MemoryTracker } from '@core/MemoryTracker.js';
import { ValueStack } from '@core/objects/stacks/ValueStack.js';
import { Dictionary } from '@core/objects/dictionaries/Dictionary.js';

const EMPTY_STACK = 'Empty stack';
const OPERATOR_STATE_INVALID = 'Invalid operator state change';

export class CallStack extends ValueStack implements ICallStack {
  constructor(tracker: MemoryTracker) {
    super(tracker, SYSTEM_MEMORY_TYPE);
  }

  private _dictionaries: (Dictionary | undefined)[] = [];
  private _steps: (number | undefined)[] = [];

  protected override pushImpl(value: Value): void {
    super.pushImpl(value);
    this.memoryTracker.register({
      container: this,
      type: SYSTEM_MEMORY_TYPE,
      pointers: 1,
      integers: 1
    });
    this._dictionaries.unshift(undefined);
    this._steps.unshift(OPERATOR_STATE_UNKNOWN);
  }

  protected override popImpl(): Value | null {
    const result = super.popImpl();
    this.memoryTracker.register({
      container: this,
      type: SYSTEM_MEMORY_TYPE,
      pointers: -1,
      integers: -1
    });
    const dictionary = this._dictionaries[0];
    if (dictionary !== undefined) {
      dictionary.release();
    }
    this._dictionaries.shift();
    this._steps.shift();
    return result;
  }

  // region IDictionary

  get names(): string[] {
    return [];
  }

  lookup(name: string): Value | null {
    const dictionary = this._dictionaries[0];
    if (dictionary === undefined) {
      return null;
    }
    return dictionary.lookup(name);
  }

  def(name: string, value: Value): Value | null {
    if (this.length === 0) {
      throw new InternalException(EMPTY_STACK);
    }
    let dictionary = this._dictionaries[0];
    if (dictionary === undefined) {
      dictionary = new Dictionary(this.memoryTracker, SYSTEM_MEMORY_TYPE);
      this._dictionaries[0] = dictionary;
    }
    return dictionary.def(name, value);
  }

  // endregion IDictionary

  // region ICallStack

  get topOperatorState(): number {
    if (this.length === 0) {
      throw new InternalException(EMPTY_STACK);
    }
    return this._steps[0]!; // Because length has been tested
  }

  set topOperatorState(value: number) {
    const current = this.topOperatorState;
    if (
      (current === OPERATOR_STATE_UNKNOWN && value !== OPERATOR_STATE_FIRST_CALL) ||
      (current !== OPERATOR_STATE_UNKNOWN && value === OPERATOR_STATE_FIRST_CALL) ||
      value === OPERATOR_STATE_UNKNOWN ||
      (current !== OPERATOR_STATE_REQUEST_CALL_BEFORE_POP && value === OPERATOR_STATE_CALL_BEFORE_POP) ||
      (current === OPERATOR_STATE_REQUEST_CALL_BEFORE_POP && value !== OPERATOR_STATE_CALL_BEFORE_POP) ||
      current === OPERATOR_STATE_POP ||
      current === OPERATOR_STATE_CALL_BEFORE_POP
    ) {
      throw new InternalException(OPERATOR_STATE_INVALID);
    }
    this._steps[0] = value;
  }

  // endregion
}
