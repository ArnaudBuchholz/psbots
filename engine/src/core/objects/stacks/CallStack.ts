import type { Value } from '@api/index.js';
import { SYSTEM_MEMORY_TYPE } from '@api/index.js';
import type { ICallStack } from '@sdk/index.js';
import { InternalException } from '@sdk/index.js';
import type { MemoryTracker } from '@core/MemoryTracker.js';
import { ValueStack } from '@core/objects/stacks/ValueStack.js';
import { Dictionary } from '@core/objects/dictionaries/Dictionary.js';

const EMPTY_STACK = 'Empty stack';

export class CallStack extends ValueStack implements ICallStack {
  constructor(tracker: MemoryTracker) {
    super(tracker, SYSTEM_MEMORY_TYPE);
  }

  private _dictionaries: (Dictionary | undefined)[] = [];

  protected override pushImpl(value: Value): void {
    super.pushImpl(value);
    this.memoryTracker.register({
      type: SYSTEM_MEMORY_TYPE,
      pointers: 1
    });
    this._dictionaries.unshift(undefined);
  }

  protected override popImpl(): Value | null {
    const result = super.popImpl();
    this.memoryTracker.register({
      type: SYSTEM_MEMORY_TYPE,
      pointers: -1
    });
    const dictionary = this._dictionaries[0];
    if (dictionary !== undefined) {
      dictionary.release();
    }
    this._dictionaries.shift();
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
    if (this._dictionaries.length === 0) {
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
}