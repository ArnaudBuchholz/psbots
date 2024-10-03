import type { Value, IReadOnlyDictionary, ValueStream } from '@api/index.js';
import { parse, SYSTEM_MEMORY_TYPE, ValueType } from '@api/index.js';
import type { IInternalState, IOperator } from '@sdk/index.js';
import {
  BaseException,
  BusyException,
  InternalException,
  OPERATOR_STATE_FIRST_CALL,
  OPERATOR_STATE_POP,
  OPERATOR_STATE_UNKNOWN,
  OperatorType,
  toString
} from '@sdk/index.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { DictionaryStack } from '@core/objects/stacks/DictionaryStack.js';
import { ValueStack } from '@core/objects/stacks/ValueStack.js';
import { CallStack } from '@core/objects/stacks/CallStack.js';
import { operatorPop, operatorCycle } from './operator.js';
import { callCycle } from './call.js';
import { blockCycle } from './block.js';

export interface StateFactorySettings {
  /** Augment the list of known names */
  hostDictionary?: IReadOnlyDictionary;
  /** Limit the maximum of memory allowed for the state */
  maxMemoryBytes?: number;
  /** Instruct memoryTracker to retain calls */
  debugMemory?: boolean;
}

export class State implements IInternalState {
  private readonly _memoryTracker: MemoryTracker;
  private readonly _dictionaries: DictionaryStack;
  private readonly _operands: ValueStack;
  private readonly _calls: CallStack;
  private _exception: BaseException | undefined;
  private _destroyed = false;

  constructor(settings: StateFactorySettings = {}) {
    this._memoryTracker = new MemoryTracker({
      total: settings.maxMemoryBytes,
      debug: settings.debugMemory
    });
    this._dictionaries = new DictionaryStack(this._memoryTracker, settings.hostDictionary);
    this._operands = new ValueStack(this._memoryTracker, SYSTEM_MEMORY_TYPE);
    this._calls = new CallStack(this._memoryTracker);
  }

  get destroyed() {
    return this._destroyed;
  }

  protected _checkIfDestroyed() {
    if (this._destroyed) {
      throw new InternalException('State instance destroyed');
    }
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
    this._checkIfDestroyed();
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

  process(values: ValueStream): Generator {
    this._checkIfDestroyed();
    if (!this.idle) {
      throw new BusyException();
    }
    this._resetException();
    let generator: Iterator<Value>;
    if (typeof values === 'string') {
      generator = parse(values);
    } else if (Array.isArray(values)) {
      generator = values[Symbol.iterator]();
    } else {
      generator = values;
    }
    this.calls.push({
      type: ValueType.operator,
      isExecutable: true,
      isReadOnly: true,
      operator: <IOperator>{
        type: OperatorType.implementation,
        name: 'Processable source',
        implementation: ({ calls }) => {
          const { value, done } = generator.next();
          if (done) {
            calls.topOperatorState = OPERATOR_STATE_POP;
          } else {
            calls.topOperatorState = 1;
            if (value.type === ValueType.string) {
              Object.assign(value, { tracker: this.memoryTracker });
            }
            calls.push(value);
          }
        }
      }
    });
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
    if (used !== 0) {
      throw new InternalException('Memory leaks detected', this._memoryTracker.snapshot());
    }
  }

  // endregion IState

  // region IInternalState

  get exception() {
    this._checkIfDestroyed();
    return this._exception;
  }

  set exception(value: BaseException | undefined) {
    // TODO check if exception must be released for memory
    this._exception = value;
  }

  get calls() {
    return this._calls;
  }

  private _callDisablingCount = 0;

  get callEnabled() {
    return this._callDisablingCount === 0;
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
      try {
        if (top.type === ValueType.operator) {
          operatorCycle(this, top);
        } else if (top.type === ValueType.string) {
          callCycle(this, top);
        } else if (top.type === ValueType.array) {
          blockCycle(this, top);
        } else {
          calls.topOperatorState = OPERATOR_STATE_FIRST_CALL;
          throw new InternalException('Unsupported executable value', top);
        }
      } catch (e) {
        calls.topOperatorState = OPERATOR_STATE_POP;
        let exception: BaseException;
        if (!(e instanceof BaseException)) {
          exception = new InternalException('An unexpected error occurred', e);
        } else {
          exception = e;
        }
        this.exception = exception;
        exception.engineStack = this.calls.ref.map((value) => toString(value, { includeDebugSource: true }));
      }
    } else {
      this._operands.push(top);
      calls.pop();
    }
  }
}
