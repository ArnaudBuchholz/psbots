import type { Value, IReadOnlyDictionary } from '@api/index.js';
import { SYSTEM_MEMORY_TYPE } from '@api/index.js';
import type { IInternalState } from '@sdk/interfaces/IInternalState.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { DictionaryStack } from '@core/objects/stacks/DictionaryStack.js';
import { SystemDictionary } from '@core/objects/dictionaries/System.js';
import { ValueStack } from '@core/objects/stacks/ValueStack.js';
import { CallStack } from '@core/objects/stacks/CallStack.js';

export interface StateFactorySettings {
  /** Augment the list of known names */
  hostDictionary?: IReadOnlyDictionary;
  /** Limit the maximum of memory allowed for the state */
  maxMemoryBytes?: number;
}

export class State implements IInternalState {
  private readonly _memoryTracker: MemoryTracker;
  private readonly _dictionaries: DictionaryStack;
  private readonly _operands: ValueStack;
  private readonly _calls: CallStack;

  constructor(settings: StateFactorySettings = {}) {
    this._memoryTracker = new MemoryTracker({
      total: settings.maxMemoryBytes
    });
    this._dictionaries = new DictionaryStack(this._memoryTracker, {
      host: settings.hostDictionary,
      system: new SystemDictionary()
    });
    this._operands = new ValueStack(this._memoryTracker, SYSTEM_MEMORY_TYPE);
    this._calls = new CallStack(this._memoryTracker);
  }

  // region IState

  get idle() {
    return this._calls.length === 0;
  }

  get memoryTracker() {
    return this._memoryTracker;
  }

  get operands() {
    return this._operands;
  }

  get dictionaries() {
    return this._dictionaries;
  }

  *process(/*values: Value[] | Generator<Value>*/): Generator {
    // Add to call stack the fact that a source has been injected
    // process values
    // for (const value of values) {
    yield;
    // }
    // Remove from the stack
  }

  // endregion IState

  // region IInternalState

  get calls() {
    return this._calls;
  }

  allowCall() {}
  preventCall() {}

  // endregion IInternalState
}
