import type { Value, IReadOnlyDictionary, Result, IReadOnlyCallStack, Exception } from '@api/index.js';
import { SYSTEM_MEMORY_TYPE } from '@api/index.js';
import type { IInternalState } from '@sdk/index.js';
import { assert } from '@sdk/index.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { DictionaryStack } from '@core/objects/stacks/DictionaryStack.js';
import { Dictionary } from '@core/objects/dictionaries/Dictionary.js';
import { ValueStack } from '@core/objects/stacks/ValueStack.js';
import { CallStack } from '@core/objects/stacks/CallStack.js';
import { operatorPop, operatorCycle } from './operator.js';
import { callCycle } from './call.js';
import { blockCycle } from './block.js';
import { parseCycle } from './parse.js';

export interface StateFactorySettings {
  /** Augment the list of known names */
  hostDictionary?: IReadOnlyDictionary;
  /** Limit the maximum of memory allowed for the state */
  maxMemoryBytes?: number;
  /** Instruct memoryTracker to retain calls */
  debugMemory?: boolean;
  experimentalGarbageCollector?: boolean;
}

export class State implements IInternalState {
  private _exception: Exception | undefined;
  private _exceptionStack: CallStack | undefined;
  private _destroyed = false;

  private constructor(
    private readonly _memoryTracker: MemoryTracker,
    private readonly _dictionaries: DictionaryStack,
    private readonly _operands: ValueStack,
    private readonly _calls: CallStack
  ) {}

  static create(settings: StateFactorySettings = {}): Result<State> {
    const memoryTracker = new MemoryTracker({
      total: settings.maxMemoryBytes,
      debug: settings.debugMemory,
      experimentalGarbageCollector: settings.experimentalGarbageCollector
    });
    const dictionariesResult = DictionaryStack.create(memoryTracker, SYSTEM_MEMORY_TYPE, 10, 1);
    if (!dictionariesResult.success) {
      return dictionariesResult;
    }
    const dictionaries = dictionariesResult.value;
    if (settings.hostDictionary) {
      dictionaries.setHost({
        type: 'dictionary',
        isReadOnly: true,
        isExecutable: false,
        dictionary: settings.hostDictionary
      });
    }
    const globalResult = Dictionary.create(memoryTracker, SYSTEM_MEMORY_TYPE, 10);
    if (!globalResult.success) {
      return globalResult;
    }
    dictionaries.setGlobal(globalResult.value.toValue({ isReadOnly: false }));
    globalResult.value.release();
    const userResult = Dictionary.create(memoryTracker, SYSTEM_MEMORY_TYPE, 10);
    if (!userResult.success) {
      return userResult;
    }
    dictionaries.setUser(userResult.value.toValue({ isReadOnly: false }));
    userResult.value.release();
    const operandsResult = ValueStack.create(memoryTracker, SYSTEM_MEMORY_TYPE, 10, 5);
    if (!operandsResult.success) {
      return operandsResult;
    }
    const callsResult = CallStack.create(memoryTracker, SYSTEM_MEMORY_TYPE, 10, 5);
    if (!callsResult.success) {
      return callsResult;
    }
    return { success: true, value: new State(memoryTracker, dictionaries, operandsResult.value, callsResult.value) };
  }

  get destroyed() {
    return this._destroyed;
  }

  protected _checkIfDestroyed() {
    assert(!this._destroyed, 'State instance destroyed');
  }

  protected _resetException() {
    if (this._exception !== undefined) {
      this._exception = undefined;
    }
    if (this._exceptionStack !== undefined) {
      this._exceptionStack.release();
      this._exceptionStack = undefined;
    }
  }

  // region IState

  get idle() {
    this._checkIfDestroyed();
    return this._calls.length === 0;
  }

  get memoryTracker() {
    return this._memoryTracker;
  }

  get operands() {
    this._checkIfDestroyed();
    return this._operands;
  }

  get dictionaries() {
    this._checkIfDestroyed();
    return this._dictionaries;
  }

  private _callDisablingCount = 0;

  get callEnabled() {
    return this._callDisablingCount === 0;
  }

  get exception() {
    this._checkIfDestroyed();
    return this._exception;
  }

  get exceptionStack() {
    this._checkIfDestroyed();
    return this._exceptionStack;
  }

  exec(value: Value): Result<Generator, 'invalidAccess'> {
    this._checkIfDestroyed();
    if (!this.idle) {
      return { success: false, exception: 'invalidAccess' };
    }
    this._resetException();
    this.calls.push(value);
    return { success: true, value: this.run() };
  }

  destroy() {
    this._checkIfDestroyed();
    this._resetException();
    this._calls.release();
    this._operands.release();
    this._dictionaries.release();
    this._destroyed = true;
    if (this._memoryTracker.experimentalGarbageCollector) {
      this._memoryTracker.collectGarbage();
    }
    const { used } = this._memoryTracker;
    assert(used === 0, 'Memory leaks detected');
  }

  // endregion IState

  // region IInternalState

  raiseException(exception: Exception, stack?: IReadOnlyCallStack) {
    this._resetException();
    this._exception = exception;
    if (stack !== undefined) {
      assert(stack instanceof CallStack);
      this._exceptionStack = stack;
      this._exceptionStack.addRef();
    } else if (exception !== 'vmOverflow') {
      const snapshotResult = this._calls.snapshot();
      assert(snapshotResult);
      this._exceptionStack = snapshotResult.value;
    }
  }

  clearException() {
    this._resetException();
  }

  get calls() {
    return this._calls;
  }

  allowCall() {
    ++this._callDisablingCount;
  }

  preventCall() {
    --this._callDisablingCount;
  }

  // endregion IInternalState

  *run() {
    while (this.calls.length > 0) {
      this.cycle();
      yield;
    }
  }

  cycle() {
    const calls = this._calls;
    const { top } = calls;
    if (this._exception) {
      if (top.type === 'operator') {
        operatorPop(this, top);
      } else {
        calls.pop();
      }
    } else if (top.isExecutable) {
      if (top.type === 'operator') {
        operatorCycle(this, top);
      } else if (top.type === 'name') {
        callCycle(this, top);
      } else if (top.type === 'array') {
        blockCycle(this, top);
      } else if (top.type === 'string') {
        parseCycle(this, top);
      } else {
        assert(false, 'Unsupported executable value');
      }
    } else {
      this._operands.push(top);
      calls.pop();
    }
  }
}
