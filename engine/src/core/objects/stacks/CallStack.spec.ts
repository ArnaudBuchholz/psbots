import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  InternalException,
  OPERATOR_STATE_CALL_BEFORE_POP,
  OPERATOR_STATE_CALLED_BEFORE_POP,
  OPERATOR_STATE_POP,
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

  it('fails if the state is OPERATOR_STATE_CALL_BEFORE_POP and trying to set it to >= 0', () => {
    callstack.push(toValue(123));
    callstack.topOperatorState = OPERATOR_STATE_CALL_BEFORE_POP;
    expect(() => {
      callstack.topOperatorState = OPERATOR_STATE_POP;
    }).toThrowError();
  });

  it('fails if the state is OPERATOR_STATE_CALLED_BEFORE_POP and trying to set it to >= 0', () => {
    callstack.push(toValue(123));
    callstack.topOperatorState = OPERATOR_STATE_CALLED_BEFORE_POP;
    expect(() => {
      callstack.topOperatorState = OPERATOR_STATE_POP;
    }).toThrowError();
  });

  it('fails if the state is OPERATOR_STATE_CALLED_BEFORE_POP and trying to set it to OPERATOR_STATE_CALL_BEFORE_POP', () => {
    callstack.push(toValue(123));
    callstack.topOperatorState = OPERATOR_STATE_CALLED_BEFORE_POP;
    expect(() => {
      callstack.topOperatorState = OPERATOR_STATE_POP;
    }).toThrowError();
  });

  it('does not fail if the state is OPERATOR_STATE_CALL_BEFORE_POP and trying to set it to OPERATOR_STATE_CALLED_BEFORE_POP', () => {
    callstack.push(toValue(123));
    callstack.topOperatorState = OPERATOR_STATE_CALL_BEFORE_POP;
    expect(() => {
      callstack.topOperatorState = OPERATOR_STATE_CALLED_BEFORE_POP;
    }).not.toThrowError();
  });
});
