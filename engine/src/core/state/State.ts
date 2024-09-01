import type { Value, IReadOnlyDictionary, ValueStream, IException } from '@api/index.js';
import { parse, SYSTEM_MEMORY_TYPE, ValueType } from '@api/index.js';
import type { IInternalState } from '@sdk/interfaces/IInternalState.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { DictionaryStack } from '@core/objects/stacks/DictionaryStack.js';
import { ValueStack } from '@core/objects/stacks/ValueStack.js';
import { CallStack } from '@core/objects/stacks/CallStack.js';
import { BusyException } from '@sdk/exceptions/BusyException.js';
import { InternalException } from '@sdk/exceptions/InternalException.js';
import { OperatorType, STEP_DONE } from '@sdk/interfaces';
import type { IOperator } from '@sdk/interfaces';
import { BaseException } from '@sdk/exceptions/BaseException.js';
import { operatorPop, operatorCycle } from './operator.js';
import { callCycle } from './call.js';

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
  private _exception: IException | undefined;
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

  get exception() {
    this._checkIfDestroyed();
    return this._exception;
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
            calls.step = STEP_DONE;
          } else {
            calls.step = 0;
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
    if (this._memoryTracker.used !== 0) {
      throw new InternalException('Memory leak detected');
    }
  }

  // endregion IState

  // region IInternalState

  get calls() {
    return this._calls;
  }

  allowCall() {}
  preventCall() {}

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
        operatorPop(this, top); // TODO: how to handle exception ?
      } else {
        calls.pop();
      }
    } else if (top.isExecutable) {
      // TODO: && (top.type !== ValueType.string || isCallAllowed)
      try {
        if (top.type === ValueType.operator) {
          operatorCycle(this, top);
        } else if (top.type === ValueType.string) {
          callCycle(this, top);
        } else {
          throw new InternalException('Unsupported executable value');
        }
      } catch (e) {
        calls.step = STEP_DONE;
        let exception: IException;
        if (!(e instanceof BaseException)) {
          exception = new InternalException('An unexpected error occurred');
        } else {
          exception = e;
        }
        this._exception = exception;
      }
    } else {
      this._operands.push(top);
      calls.pop();
    }
  }
}
