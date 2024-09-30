import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  InternalException,
  OPERATOR_STATE_CALL_BEFORE_POP,
  OPERATOR_STATE_CALLED_BEFORE_POP,
  OPERATOR_STATE_FIRST_CALL,
  OPERATOR_STATE_POP,
  OPERATOR_STATE_REQUEST_CALL_BEFORE_POP,
  OPERATOR_STATE_UNKNOWN
} from '@sdk/index.js';
import { CallStack } from './CallStack.js';
import { MemoryTracker } from '@core/index.js';
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
    callstack.topOperatorState = 1;
    expect(callstack.topOperatorState).toStrictEqual(1);
  });

  it('removes the state when popping the item', () => {
    callstack.push(toValue(123));
    callstack.topOperatorState = 1;
    callstack.push(toValue(456));
    callstack.topOperatorState = 2;
    expect(callstack.topOperatorState).toStrictEqual(2);
    callstack.pop();
    expect(callstack.topOperatorState).toStrictEqual(1);
  });

  describe('state changes', () => {
    const states = {
      OPERATOR_STATE_UNKNOWN,
      OPERATOR_STATE_FIRST_CALL,
      OPERATOR_STATE_POP,
      OPERATOR_STATE_REQUEST_CALL_BEFORE_POP,
      OPERATOR_STATE_CALL_BEFORE_POP
    }

    function stringify(state: number): string {
      const index = Object.values(states).indexOf(state);
      if (index === -1) {
        return state.toString();
      }
      return Object.keys(states)[index]!; // Index was validated
    }

    function allows(from: number, to: number) {
      it(`allows ${stringify(from)} ➝ ${stringify(to)}`, () => {
        callstack.push(toValue(123));
        callstack.topOperatorState = from;
        expect(() => {
          callstack.topOperatorState = to;
        }).not.toThrowError();
      });
    }

    function forbids(from: number, to: number) {
      it(`forbids ${stringify(from)} ➝ ${stringify(to)}`, () => {
        callstack.push(toValue(123));
        callstack.topOperatorState = from;
        expect(() => {
          callstack.topOperatorState = to;
        }).toThrowError();
      });
    }

    allows(OPERATOR_STATE_FIRST_CALL, OPERATOR_STATE_POP);
    allows(OPERATOR_STATE_FIRST_CALL, 123);
    allows(OPERATOR_STATE_FIRST_CALL, OPERATOR_STATE_REQUEST_CALL_BEFORE_POP);
    allows(123, 456);
    allows(123, OPERATOR_STATE_POP);
    allows(123, OPERATOR_STATE_REQUEST_CALL_BEFORE_POP);
    allows(OPERATOR_STATE_REQUEST_CALL_BEFORE_POP, OPERATOR_STATE_CALL_BEFORE_POP);

    forbids(OPERATOR_STATE_FIRST_CALL, OPERATOR_STATE_CALL_BEFORE_POP);
    forbids(123, OPERATOR_STATE_FIRST_CALL);
    forbids(123, OPERATOR_STATE_CALL_BEFORE_POP);
    forbids(OPERATOR_STATE_REQUEST_CALL_BEFORE_POP, OPERATOR_STATE_FIRST_CALL);
    forbids(OPERATOR_STATE_REQUEST_CALL_BEFORE_POP, OPERATOR_STATE_POP);
    forbids(OPERATOR_STATE_REQUEST_CALL_BEFORE_POP, 123);
    forbids(OPERATOR_STATE_CALL_BEFORE_POP, OPERATOR_STATE_FIRST_CALL);
    forbids(OPERATOR_STATE_CALL_BEFORE_POP, OPERATOR_STATE_POP);
    forbids(OPERATOR_STATE_CALL_BEFORE_POP, 123);
  });
});
