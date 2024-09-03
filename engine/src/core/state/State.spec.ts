import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parse, ValueType } from '@api/index.js';
import type { Value } from '@api/index.js';
import { State } from './State.js';
import { waitForGenerator, toValue } from '@test/index.js';
import type { IFunctionOperator } from '@sdk/index.js';
import { BusyException, InternalException, InvalidAccessException, OperatorType } from '@sdk/index.js';
import { STRING_MEMORY_TYPE } from '@core/MemoryTracker.js';

let state: State;

beforeEach(() => {
  state = new State({
    debugMemory: true
  });
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

    it('fails on memoryTracker', () => {
      expect(() => state.memoryTracker).toThrowError();
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

describe('processing', () => {
  it('processes a string', () => {
    expect(state.idle).toStrictEqual(true);
    const generator = state.process('123');
    expect(state.idle).toStrictEqual(false);
    waitForGenerator(generator);
    expect(state.idle).toStrictEqual(true);
    expect(state.operands.ref).toStrictEqual<Value[]>([toValue(123)]);
  });

  it('processes an array', () => {
    expect(state.idle).toStrictEqual(true);
    const generator = state.process([toValue(123)]);
    expect(state.idle).toStrictEqual(false);
    waitForGenerator(generator);
    expect(state.idle).toStrictEqual(true);
    expect(state.operands.ref).toStrictEqual<Value[]>([toValue(123)]);
  });

  it('processes a generator', () => {
    expect(state.idle).toStrictEqual(true);
    const generator = state.process(parse('123'));
    expect(state.idle).toStrictEqual(false);
    waitForGenerator(generator);
    expect(state.idle).toStrictEqual(true);
    expect(state.operands.ref).toStrictEqual<Value[]>([toValue(123)]);
  });

  it('fails if already busy', () => {
    state.process(parse('123'));
    expect(() => state.process(parse('456'))).toThrowError(BusyException);
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
    const generator = state.process('"123"');
    waitForGenerator(generator);
    const value = state.operands.ref[0];
    expect(value?.type).toStrictEqual(ValueType.string);
    expect(value?.tracker).not.toBeUndefined();
    expect(state.memoryTracker.byType[STRING_MEMORY_TYPE]).not.toStrictEqual(0);
  });

  it('releases memory when the string is popped', () => {
    const generator = state.process('"123"');
    waitForGenerator(generator);
    state.operands.pop();
    expect(state.memoryTracker.byType[STRING_MEMORY_TYPE]).toStrictEqual(0);
  });

  it('detects memory leaks', () => {
    const generator = state.process('"123"');
    waitForGenerator(generator);
    // NEVER do that !
    Object.assign(state.operands.ref[0]!, { tracker: undefined });
    expect(() => state.destroy()).toThrowError();
  });
});

describe('exeption handling', () => {
  it('converts any error into a BaseException', () => {
    const error = new Error('KO');
    state.calls.push({
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
    });
    state.cycle();
    expect(state.exception).not.toBeUndefined();
    expect(state.exception).toBeInstanceOf(InternalException);
    expect((state.exception as InternalException).reason).toStrictEqual(error);
  });

  it('adds call stack information', () => {
    state.calls.push({
      type: ValueType.string,
      isExecutable: true,
      isReadOnly: true,
      string: 'step1'
    });
    state.calls.push({
      type: ValueType.string,
      isExecutable: true,
      isReadOnly: true,
      string: 'step2'
    });
    state.calls.step = 5;
    state.calls.push({
      type: ValueType.operator,
      isExecutable: true,
      isReadOnly: true,
      operator: <IFunctionOperator>{
        name: 'invalidaccess',
        type: OperatorType.implementation,
        implementation: () => {
          throw new InvalidAccessException();
        }
      }
    });
    state.cycle();
    expect(state.exception).toBeInstanceOf(InvalidAccessException);
    expect(state.exception?.engineStack).toStrictEqual(['-invalidaccess-', 'step2', 'step1']);
  });
});
