import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { IState } from '@api/index.js';
import {
  InternalException,
  OPERATOR_STATE_UNKNOWN,
  OPERATOR_STATE_FIRST_CALL,
  OPERATOR_STATE_CALL_BEFORE_POP,
  OPERATOR_STATE_POP
} from '@sdk/index.js';
import { CallStack } from './CallStack.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { toValue } from '@test/index.js';

let tracker: MemoryTracker;
let callstack: CallStack;

beforeEach(() => {
  tracker = new MemoryTracker();
  callstack = new CallStack(tracker);
});

afterEach(() => {
  expect(callstack.release()).toStrictEqual(false);
  expect(tracker.used).toStrictEqual(0);
});

describe('callStack', () => {
  it('returns empty array when empty', () => {
    expect(callstack.callStack()).toStrictEqual([]);
  });

  it('returns default value for operatorState', () => {
    callstack.push(toValue(1));
    expect(callstack.callStack()).toStrictEqual<IState['callStack']>([
      {
        value: toValue(1),
        operatorState: OPERATOR_STATE_UNKNOWN
      }
    ]);
  });

  it('returns value set for operatorState', () => {
    callstack.push(toValue(1));
    callstack.topOperatorState = OPERATOR_STATE_FIRST_CALL;
    callstack.push(toValue(2));
    callstack.topOperatorState = OPERATOR_STATE_FIRST_CALL;
    callstack.topOperatorState = 123;
    expect(callstack.callStack()).toStrictEqual<IState['callStack']>([
      {
        value: toValue(2),
        operatorState: 123
      },
      {
        value: toValue(1),
        operatorState: OPERATOR_STATE_FIRST_CALL
      }
    ]);
  });
});

describe('IDictionary', () => {
  it('implements IDictionary interface', () => {
    expect(callstack.names).toStrictEqual([]);
    expect(callstack.lookup('')).toStrictEqual(null);
    expect(typeof callstack.def).toStrictEqual('function');
  });

  it('fails if no item exists in the stack', () => {
    expect(() => callstack.def('test', toValue(123))).toThrowError(InternalException);
  });

  it('associates a dictionary on the current item', () => {
    callstack.push(toValue(123));
    const { used: memoryBefore } = tracker;
    expect(callstack.def('test', toValue('abc'))).toStrictEqual(null);
    expect(tracker.used).toBeGreaterThan(memoryBefore);
    expect(callstack.lookup('test')).toStrictEqual(toValue('abc'));
  });

  it('destroys the dictionary when popping the item', () => {
    const { used: initialMemory } = tracker;
    callstack.push(toValue(123));
    expect(callstack.def('test', toValue('abc'))).toStrictEqual(null);
    callstack.pop();
    expect(tracker.used).toStrictEqual(initialMemory);
  });
});

describe('topOperatorState', () => {
  it('fails if no item exists in the stack', () => {
    expect(() => {
      callstack.topOperatorState = 0;
    }).toThrowError(InternalException);
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
