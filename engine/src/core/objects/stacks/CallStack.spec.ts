import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Result, Value } from '@api/index.js';
import { nullValue, SYSTEM_MEMORY_TYPE } from '@api/index.js';
import {
  assert,
  OPERATOR_STATE_UNKNOWN,
  OPERATOR_STATE_FIRST_CALL,
  OPERATOR_STATE_CALL_BEFORE_POP,
  OPERATOR_STATE_POP
} from '@sdk/index.js';
import { CallStack } from './CallStack.js';
import { memorySizeToBytes, MemoryTracker } from '@core/MemoryTracker.js';
import { toValue } from '@test/index.js';

let tracker: MemoryTracker;
let callstack: CallStack;

beforeEach(() => {
  tracker = new MemoryTracker();
  const callstackResult = CallStack.create(tracker, SYSTEM_MEMORY_TYPE, 5, 5);
  assert(callstackResult);
  callstack = callstackResult.value;
});

afterEach(() => {
  expect(callstack.release()).toStrictEqual(false);
  expect(tracker.used).toStrictEqual(0);
});

describe('callStack', () => {
  it('increases memory when going beyond the initial capacity', () => {
    const { used: memoryBefore } = tracker;
    expect(callstack.push(toValue(0))).toStrictEqual<Result<number>>({ success: true, value: 1 });
    expect(callstack.push(toValue(1))).toStrictEqual<Result<number>>({ success: true, value: 2 });
    expect(callstack.push(toValue(2))).toStrictEqual<Result<number>>({ success: true, value: 3 });
    expect(callstack.push(toValue(3))).toStrictEqual<Result<number>>({ success: true, value: 4 });
    expect(callstack.push(toValue(4))).toStrictEqual<Result<number>>({ success: true, value: 5 });
    expect(tracker.used).toStrictEqual(memoryBefore);
    expect(callstack.push(toValue(5))).toStrictEqual<Result<number>>({ success: true, value: 6 });
    expect(tracker.used).toBeGreaterThan(memoryBefore);
  });

  for (let index = -1; index < 2; ++index) {
    it(`returns default value for operator state when out of range (${index})`, () => {
      expect(callstack.operatorStateAt(index)).toStrictEqual(OPERATOR_STATE_UNKNOWN);
    });
  }

  it('returns default value for operatorState', () => {
    callstack.push(toValue(1));
    expect(callstack.topOperatorState).toStrictEqual(OPERATOR_STATE_UNKNOWN);
  });

  it('returns value set for operatorState', () => {
    callstack.push(toValue(1));
    callstack.topOperatorState = OPERATOR_STATE_FIRST_CALL;
    callstack.push(toValue(2));
    callstack.topOperatorState = OPERATOR_STATE_FIRST_CALL;
    callstack.topOperatorState = 123;
    expect(callstack.at(0)).toStrictEqual(toValue(2));
    expect(callstack.operatorStateAt(0)).toStrictEqual(123);
    expect(callstack.at(1)).toStrictEqual(toValue(1));
    expect(callstack.operatorStateAt(1)).toStrictEqual(OPERATOR_STATE_FIRST_CALL);
  });

  it('supports popush', () => {
    const result = callstack.popush(0, toValue(1));
    expect(result).toStrictEqual<Result<number>>({ success: true, value: 1 });
  });
});

describe('IDictionary', () => {
  it('implements IDictionary interface', () => {
    expect(callstack.names).toStrictEqual([]);
    expect(callstack.lookup('')).toStrictEqual(nullValue);
    expect(typeof callstack.def).toStrictEqual('function');
  });

  it('fails if no item exists in the stack', () => {
    expect(callstack.def('test', toValue(123))).toStrictEqual<Result<Value>>({
      success: false,
      exception: 'stackUnderflow'
    });
  });

  it('fails if no more memory', () => {
    const tracker = new MemoryTracker({ total: memorySizeToBytes(CallStack.getSize(1)) });
    const callstackResult = CallStack.create(tracker, SYSTEM_MEMORY_TYPE, 1, 1);
    assert(callstackResult);
    const callstack = callstackResult.value;
    expect(callstack.push(toValue(0))).toStrictEqual<Result<number>>({ success: true, value: 1 });
    expect(callstack.def('test', toValue('abc'))).toStrictEqual<Result<Value>>({
      success: false,
      exception: 'vmOverflow'
    });
  });

  it('associates a dictionary on the current item', () => {
    callstack.push(toValue(123));
    const { used: memoryBefore } = tracker;
    expect(callstack.def('test', toValue('abc'))).toStrictEqual<Result<Value>>({ success: true, value: nullValue });
    expect(tracker.used).toBeGreaterThan(memoryBefore);
    expect(callstack.lookup('test')).toStrictEqual(toValue('abc'));
  });

  it('destroys the dictionary when popping the item', () => {
    const { used: initialMemory } = tracker;
    callstack.push(toValue(123));
    expect(callstack.def('test', toValue('abc'))).toStrictEqual<Result<Value>>({ success: true, value: nullValue });
    callstack.pop();
    expect(tracker.used).toStrictEqual(initialMemory);
  });
});

describe('topOperatorState', () => {
  it('fails if no item exists in the stack', () => {
    expect(() => {
      callstack.topOperatorState = 0;
    }).toThrowError();
  });

  it('allocates a state on the current item', () => {
    callstack.push(toValue(123));
    expect(callstack.topOperatorState).toStrictEqual(OPERATOR_STATE_UNKNOWN);
  });

  it('associates a state on the current item', () => {
    callstack.push(toValue(123));
    callstack.topOperatorState = OPERATOR_STATE_FIRST_CALL;
    expect(callstack.topOperatorState).toStrictEqual(OPERATOR_STATE_FIRST_CALL);
  });

  it('removes the state when popping the item', () => {
    callstack.push(toValue(123));
    callstack.topOperatorState = OPERATOR_STATE_FIRST_CALL;
    callstack.topOperatorState = 1;
    callstack.push(toValue(456));
    callstack.topOperatorState = OPERATOR_STATE_FIRST_CALL;
    callstack.topOperatorState = 2;
    expect(callstack.topOperatorState).toStrictEqual(2);
    callstack.pop();
    expect(callstack.topOperatorState).toStrictEqual(1);
  });

  describe('state changes', () => {
    const states = {
      OPERATOR_STATE_UNKNOWN,
      OPERATOR_STATE_FIRST_CALL,
      OPERATOR_STATE_CALL_BEFORE_POP,
      OPERATOR_STATE_POP,
      '> 0': 123,
      '> 0 (2)': 456,
      '< -1': -123,
      '< -1 (2)': -456
    };

    function stringify(state: number): string {
      const index = Object.values(states).indexOf(state);
      if (index === -1) {
        throw new Error('Unexpected state');
      }
      return Object.keys(states)[index]!;
    }

    const allowed: { from: number; to: number }[] = [];

    function allows(from: number, to: number) {
      allowed.push({ from, to });
      it(`allows ${stringify(from)} ➝ ${stringify(to)}`, () => {
        callstack.push(toValue(123));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (callstack as any)._steps[0] = from;
        expect(() => {
          callstack.topOperatorState = to;
        }).not.toThrowError();
      });
    }

    allows(OPERATOR_STATE_UNKNOWN, OPERATOR_STATE_FIRST_CALL);
    allows(OPERATOR_STATE_FIRST_CALL, OPERATOR_STATE_POP);
    allows(OPERATOR_STATE_FIRST_CALL, OPERATOR_STATE_CALL_BEFORE_POP);
    allows(OPERATOR_STATE_FIRST_CALL, 123);
    allows(OPERATOR_STATE_FIRST_CALL, 456);
    allows(123, 456);
    allows(123, OPERATOR_STATE_POP);
    allows(123, OPERATOR_STATE_CALL_BEFORE_POP);
    allows(456, 123);
    allows(456, OPERATOR_STATE_POP);
    allows(456, OPERATOR_STATE_CALL_BEFORE_POP);
    allows(OPERATOR_STATE_CALL_BEFORE_POP, OPERATOR_STATE_POP);
    allows(OPERATOR_STATE_CALL_BEFORE_POP, -123);
    allows(OPERATOR_STATE_CALL_BEFORE_POP, -456);
    allows(-123, -456);
    allows(-123, OPERATOR_STATE_POP);
    allows(-456, -123);
    allows(-456, OPERATOR_STATE_POP);
    // Required to revert in case of error during the operator execution
    allows(OPERATOR_STATE_CALL_BEFORE_POP, OPERATOR_STATE_FIRST_CALL);

    function forbids(from: number, to: number) {
      it(`forbids ${stringify(from)} ➝ ${stringify(to)}`, () => {
        callstack.push(toValue(123));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (callstack as any)._steps[0] = from;
        expect(() => {
          callstack.topOperatorState = to;
        }).toThrowError();
      });
    }

    for (const from of Object.values(states)) {
      for (const to of Object.values(states)) {
        if (from !== to && !allowed.some((item) => item.from === from && item.to === to)) {
          forbids(from, to);
        }
      }
    }
  });
});

describe('snapshot', () => {
  it('copies most important info from the callstack', () => {
    callstack.push(toValue(1));
    callstack.topOperatorState = OPERATOR_STATE_FIRST_CALL;
    callstack.push(toValue(2));
    callstack.topOperatorState = OPERATOR_STATE_FIRST_CALL;
    callstack.topOperatorState = 123;
    const snapshotResult = callstack.snapshot();
    assert(snapshotResult);
    const snapshot = snapshotResult.value;
    expect(snapshot.at(0)).toStrictEqual(toValue(2));
    expect(snapshot.operatorStateAt(0)).toStrictEqual(123);
    expect(snapshot.at(1)).toStrictEqual(toValue(1));
    expect(snapshot.operatorStateAt(1)).toStrictEqual(OPERATOR_STATE_FIRST_CALL);
    snapshot.release();
  });

  it('fails when no more memory', () => {
    callstack.push(toValue(1));
    const isAvailable = vi.spyOn(MemoryTracker.prototype, 'isAvailable');
    isAvailable.mockImplementation(() => ({ success: false, exception: 'vmOverflow' }));
    expect(callstack.snapshot()).toStrictEqual({ success: false, exception: 'vmOverflow' });
    isAvailable.mockRestore();
  });
});
