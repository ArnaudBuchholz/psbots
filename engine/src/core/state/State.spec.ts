import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { enumIArrayValues } from '@api/index.js';
import type { Result, Value, Exception, MemoryType } from '@api/index.js';
import { State } from './State.js';
import { toValue, waitForExec } from '@test/index.js';
import type { IFunctionOperator, IInternalState } from '@sdk/index.js';
import { assert, callStackToString, OPERATOR_STATE_FIRST_CALL, OperatorType } from '@sdk/index.js';
import type { MemoryTracker } from '@core/MemoryTracker.js';
import { STRING_MEMORY_TYPE } from '@core/MemoryTracker.js';
import { DictionaryStack } from '@core/objects/stacks/DictionaryStack.js';
import { Dictionary } from '@core/objects/dictionaries/Dictionary.js';
import { ValueStack } from '@core/objects/stacks/ValueStack.js';
import { CallStack } from '@core/objects/stacks/CallStack.js';

let state: State;

beforeEach(() => {
  const stateResult = State.create({ debugMemory: true });
  assert(stateResult);
  state = stateResult.value;
});

afterEach(() => {
  if (!state.destroyed) {
    state.destroy();
  }
});

describe('IState', () => {
  describe('when active', () => {
    it('exposes idle', () => {
      expect(state.idle).toStrictEqual(true);
    });

    it('exposes memoryTracker', () => {
      expect(state.memoryTracker).toBeDefined();
    });

    it('exposes operands', () => {
      expect(state.operands).toBeDefined();
    });

    it('exposes dictionaries', () => {
      expect(state.dictionaries).toBeDefined();
    });

    it('exposes exception', () => {
      expect(() => state.exception).not.toThrowError();
    });
  });

  describe('when destroyed', () => {
    beforeEach(() => {
      state.destroy();
    });

    it('fails on idle', () => {
      expect(() => state.idle).toThrowError();
    });

    it('does not fail on memoryTracker', () => {
      expect(() => state.memoryTracker).not.toThrowError();
    });

    it('fails on operands', () => {
      expect(() => state.operands).toThrowError();
    });

    it('fails on dictionaries', () => {
      expect(() => state.dictionaries).toThrowError();
    });

    it('fails on exception', () => {
      expect(() => state.exception).toThrowError();
    });
  });
});

describe('exec', () => {
  it('executes an executable string', () => {
    expect(state.idle).toStrictEqual(true);
    const generator = state.exec(toValue('123', { isExecutable: true }));
    expect(state.idle).toStrictEqual(false);
    waitForExec(generator);
    expect(state.idle).toStrictEqual(true);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual<Value[]>([toValue(123)]);
  });

  it('fails if already busy', () => {
    state.exec(toValue('123', { isExecutable: true }));
    expect(state.exec(toValue('456', { isExecutable: true }))).toStrictEqual<Result<Generator>>({
      success: false,
      exception: 'invalidAccess'
    });
  });
});

describe('IInternalState', () => {
  it('enables calls by default', () => {
    expect(state.callEnabled).toStrictEqual(true);
  });

  it('uses a counter for callEnabled', () => {
    state.preventCall();
    expect(state.callEnabled).toStrictEqual(false);
    state.preventCall();
    expect(state.callEnabled).toStrictEqual(false);
    state.allowCall();
    expect(state.callEnabled).toStrictEqual(false);
    state.allowCall();
    expect(state.callEnabled).toStrictEqual(true);
  });
});

describe('memory', () => {
  it('ensures memory is handled for strings', () => {
    expect(state.memoryTracker.byType[STRING_MEMORY_TYPE]).toStrictEqual(0);
    waitForExec(state.exec(toValue('"123"', { isExecutable: true })));
    const value = state.operands.at(0);
    expect(value?.type).toStrictEqual('string');
    expect(value?.tracker).not.toBeUndefined();
    expect(state.memoryTracker.byType[STRING_MEMORY_TYPE]).not.toStrictEqual(0);
  });

  it('releases memory when the string is popped', () => {
    waitForExec(state.exec(toValue('"123"', { isExecutable: true })));
    state.operands.pop();
    expect(state.memoryTracker.byType[STRING_MEMORY_TYPE]).toStrictEqual(0);
  });

  it('detects memory leaks', () => {
    const stateResult = State.create();
    assert(stateResult);
    const productionState = stateResult.value;
    waitForExec(productionState.exec(toValue('"123"', { isExecutable: true })));
    const value = productionState.operands.top;
    value.tracker?.addValueRef(value); // will leak
    expect(() => productionState.destroy()).toThrowError('Memory leaks detected');
  });

  describe('creation with limited memory', () => {
    it('fails on DictionaryStack.create', () => {
      const dictionaryStackCreate = vi.spyOn(DictionaryStack, 'create');
      dictionaryStackCreate.mockImplementation(() => ({ success: false, exception: 'vmOverflow' }));
      expect(State.create()).toStrictEqual<Result>({ success: false, exception: 'vmOverflow' });
      dictionaryStackCreate.mockRestore();
    });

    it('fails on Dictionary.create (global)', () => {
      const dictionaryCreate = vi.spyOn(Dictionary, 'create');
      dictionaryCreate.mockImplementation(() => ({ success: false, exception: 'vmOverflow' }));
      expect(State.create()).toStrictEqual<Result>({ success: false, exception: 'vmOverflow' });
      dictionaryCreate.mockRestore();
    });

    it('fails on Dictionary.create (user)', () => {
      const originalDictionaryCreate = Dictionary.create;
      const dictionaryCreate = vi.spyOn(Dictionary, 'create');
      let nbCalls = 0;
      dictionaryCreate.mockImplementation(function (
        memoryTracker: MemoryTracker,
        memoryType: MemoryType,
        initialKeyCount: number
      ) {
        if (++nbCalls === 1) {
          return originalDictionaryCreate(memoryTracker, memoryType, initialKeyCount);
        }
        return { success: false, exception: 'vmOverflow' };
      });
      expect(State.create()).toStrictEqual<Result>({ success: false, exception: 'vmOverflow' });
      dictionaryCreate.mockRestore();
    });

    it('fails on ValueStack.create', () => {
      const valueStackCreate = vi.spyOn(ValueStack, 'create');
      valueStackCreate.mockImplementation(() => ({ success: false, exception: 'vmOverflow' }));
      expect(State.create()).toStrictEqual<Result>({ success: false, exception: 'vmOverflow' });
      valueStackCreate.mockRestore();
    });

    it('fails on CallStack.create', () => {
      const callStackCreate = vi.spyOn(CallStack, 'create');
      callStackCreate.mockImplementation(() => ({ success: false, exception: 'vmOverflow' }));
      expect(State.create()).toStrictEqual<Result>({ success: false, exception: 'vmOverflow' });
      callStackCreate.mockRestore();
    });
  });
});

describe('host dictionary', () => {
  it('extends the context', async () => {
    const { dictionary: hostDictionary } = toValue({ host: toValue('host') }, { isReadOnly: true });
    const stateResult = State.create({ hostDictionary });
    assert(stateResult);
    const { value: state } = stateResult;
    const generator = state.exec(toValue('host', { isExecutable: true }));
    waitForExec(generator);
    expect(state.operands.at(0)).toStrictEqual(toValue('host'));
  });
});

describe('exception handling', () => {
  it('detects invalid executable value', () => {
    const invalidValue = {
      type: 'boolean',
      isExecutable: true,
      isReadOnly: true,
      isSet: true
    } as unknown as Value;
    assert(state.calls.push(invalidValue));
    expect(() => state.cycle()).toThrowError();
  });

  it('fails on any error', () => {
    const error = new Error('KO');
    assert(
      state.calls.push({
        type: 'operator',
        isExecutable: true,
        isReadOnly: true,
        operator: <IFunctionOperator>{
          name: 'test',
          type: OperatorType.implementation,
          implementation: () => {
            throw error;
          }
        }
      })
    );
    expect(() => state.cycle()).toThrowError(error);
  });

  it('adds call stack information', () => {
    assert(
      state.calls.push({
        type: 'string',
        isExecutable: true,
        isReadOnly: true,
        string: 'step1'
      })
    );
    assert(
      state.calls.push({
        type: 'string',
        isExecutable: true,
        isReadOnly: true,
        string: 'step2'
      })
    );
    state.calls.topOperatorState = OPERATOR_STATE_FIRST_CALL;
    state.calls.topOperatorState = 5;
    assert(
      state.calls.push({
        type: 'operator',
        isExecutable: true,
        isReadOnly: true,
        operator: <IFunctionOperator>{
          name: 'invalidaccess',
          type: OperatorType.implementation,
          implementation: (state: IInternalState) => {
            state.raiseException('invalidAccess');
          }
        }
      })
    );
    state.cycle();
    expect(state.exception).toStrictEqual<Exception>('invalidAccess');
    if (state.exceptionStack === undefined) {
      expect.unreachable();
    }
    expect(callStackToString(state.exceptionStack)).toStrictEqual(['-invalidaccess-', 'step2', 'step1']);
  });
});
