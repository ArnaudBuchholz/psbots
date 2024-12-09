import type { Value, IReadOnlyDictionary, Result } from '@api/index.js';
import { SYSTEM_MEMORY_TYPE, ValueType } from '@api/index.js';
import type { IInternalState } from '@sdk/index.js';
import {
  assert,
  BaseException,
  BusyException,
  toString
} from '@sdk/index.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { DictionaryStack } from '@core/objects/stacks/DictionaryStack.js';
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
}

export class State implements IInternalState {
  private _exception: BaseException | undefined;
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
      debug: settings.debugMemory
    });
    /** TODO: allocation scheme is dynamic */
    const dictionariesResult = DictionaryStack.create(memoryTracker, SYSTEM_MEMORY_TYPE, 10, 1);
    if (!dictionariesResult.success) {
      return dictionariesResult;
    }
    const operandsResult = ValueStack.create(memoryTracker, SYSTEM_MEMORY_TYPE, 10, 5);
    if (!operandsResult.success) {
      return operandsResult;
    }
    const callsResult = CallStack.create(memoryTracker, SYSTEM_MEMORY_TYPE, 10, 5);
    if (!callsResult.success) {
      return callsResult;
    }
    return { success: true, value: new State(
      memoryTracker,
      dictionariesResult.value,
      operandsResult.value,
      callsResult.value
    )}
  }

  get destroyed() {
    return this._destroyed;
  }

  protected _checkIfDestroyed() {
    assert(!this._destroyed, 'State instance destroyed');
  }

  protected _resetException() {
    if (this._exception !== undefined) {
      // TODO: release exception
      this._exception = undefined;
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

  get callStack() {
    return this.calls.callStack();
  }

  private _callDisablingCount = 0;

  get callEnabled() {
    return this._callDisablingCount === 0;
  }

  get exception() {
    this._checkIfDestroyed();
    return this._exception;
  }

  exec(value: Value): Generator {
    this._checkIfDestroyed();
    if (!this.idle) {
      throw new BusyException();
    }
    this._resetException();
    this.calls.push(value);
    return this.run();
  }

  destroy() {
    this._checkIfDestroyed();
    this._resetException();
    this._calls.release();
    this._operands.release();
    this._dictionaries.release();
    this._destroyed = true;
    const { used } = this._memoryTracker;
    assert(used === 0);
  }

  // endregion IState

  // region IInternalState

  set exception(value: BaseException | undefined) {
    // TODO check if exception must be released for memory
    this._exception = value;
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
    while (this.calls.length !== 0) {
      this.cycle();
      yield;
    }
  }

  cycle() {
    const calls = this._calls;
    const { top } = calls;
    if (this._exception) {
      if (top.type === ValueType.operator) {
        operatorPop(this, top);
      } else {
        calls.pop();
      }
    } else if (top.isExecutable) {
      if (top.type === ValueType.operator) {
        operatorCycle(this, top);
      } else if (top.type === ValueType.name) {
        callCycle(this, top);
      } else if (top.type === ValueType.array) {
        blockCycle(this, top);
      } else if (top.type === ValueType.string) {
        parseCycle(this, top);
      } else {
        assert(false, 'Unsupported executable value');
      }
      if (this.exception !== undefined) {
        this.exception.engineStack = this.callStack.map(({ value, operatorState }) =>
          toString(value, { operatorState, includeDebugSource: true })
        );
      }
    } else {
      this._operands.push(top);
      calls.pop();
    }
  }
}
