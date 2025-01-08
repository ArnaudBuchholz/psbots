import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { enumIArrayValues, ValueType } from '@api/index.js';
import type { Value } from '@api/index.js';
import { State } from './State.js';
import { toValue, waitForGenerator } from '@test/index.js';
import type { IFunctionOperator, IInternalState } from '@sdk/index.js';
import {
  assert,
  OPERATOR_STATE_FIRST_CALL,
  OperatorType
} from '@sdk/index.js';
import { STRING_MEMORY_TYPE } from '@core/MemoryTracker.js';

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
    waitForGenerator(generator);
    expect(state.idle).toStrictEqual(true);
    expect([...enumIArrayValues(state.operands)]).toStrictEqual<Value[]>([toValue(123)]);
  });

  it('fails if already busy', () => {
    state.exec(toValue('123', { isExecutable: true }));
    expect(() => state.exec(toValue('456', { isExecutable: true }))).toThrowError(BusyException);
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
    waitForGenerator(state.exec(toValue('"123"', { isExecutable: true })));
    const value = state.operands.at(0);
    expect(value?.type).toStrictEqual(ValueType.string);
    expect(value?.tracker).not.toBeUndefined();
    expect(state.memoryTracker.byType[STRING_MEMORY_TYPE]).not.toStrictEqual(0);
  });

  it('releases memory when the string is popped', () => {
    waitForGenerator(state.exec(toValue('"123"', { isExecutable: true })));
    state.operands.pop();
    expect(state.memoryTracker.byType[STRING_MEMORY_TYPE]).toStrictEqual(0);
  });

  it('detects memory leaks', () => {
    const stateResult = State.create();
    assert(stateResult);
    const productionState = stateResult.value;
    waitForGenerator(productionState.exec(toValue('"123"', { isExecutable: true })));
    const value = productionState.operands.top;
    value.tracker?.addValueRef(value); // will leak
    expect(() => productionState.destroy()).toThrowError('Memory leaks detected');
  });
});

describe('exception handling', () => {
  it('detects invalid executable value', () => {
    const invalidValue = {
      type: ValueType.boolean,
      isExecutable: true,
      isReadOnly: true,
      isSet: true
    } as unknown as Value;
    assert(state.calls.push(invalidValue));
    expect(() => state.cycle()).toThrowError();
  });

  it('fails on any error', () => {
    const error = new Error('KO');
    assert(state.calls.push({
      type: ValueType.operator,
      isExecutable: true,
      isReadOnly: true,
      operator: <IFunctionOperator>{
        name: 'test',
        type: OperatorType.implementation,
        implementation: () => {
          throw error;
        }
      }
    }));
    expect(() => state.cycle()).toThrowError(error);
  });

  it('adds call stack information', () => {
    assert(state.calls.push({
      type: ValueType.string,
      isExecutable: true,
      isReadOnly: true,
      string: 'step1'
    }));
    assert(state.calls.push({
      type: ValueType.string,
      isExecutable: true,
      isReadOnly: true,
      string: 'step2'
    }));
    state.calls.topOperatorState = OPERATOR_STATE_FIRST_CALL;
    state.calls.topOperatorState = 5;
    assert(state.calls.push({
      type: ValueType.operator,
      isExecutable: true,
      isReadOnly: true,
      operator: <IFunctionOperator>{
        name: 'invalidaccess',
        type: OperatorType.implementation,
        implementation: (state: IInternalState) => {
          state.raiseException(new InvalidAccessException());
        }
      }
    }));
    state.cycle();
    expect(state.exception).toBeInstanceOf(InvalidAccessException);
    expect(state.exception?.engineStack).toStrictEqual([
      `-invalidaccess-`,
      'step2',
      'step1'
    ]);
  });
});
