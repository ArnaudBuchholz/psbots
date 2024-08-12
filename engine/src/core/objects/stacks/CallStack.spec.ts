import { describe, it, expect, beforeEach } from 'vitest';
import { InternalException } from '@sdk/index.js';
import { CallStack } from './CallStack.js';
import { MemoryTracker } from '@core/index.js';
import { toValue } from '@test/index.js';

let tracker: MemoryTracker;
let callstack: CallStack;

beforeEach(() => {
  tracker = new MemoryTracker();
  callstack = new CallStack(tracker);
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
    expect(callstack.def('test', toValue('abc'))).toStrictEqual(null);
    expect(callstack.lookup('test')).toStrictEqual(toValue('abc'));
  });

  it('destroys the dictionary when popping the item', () => {
    const { used } = tracker;
    callstack.push(toValue(123));
    expect(callstack.def('test', toValue('abc'))).toStrictEqual(null);
    callstack.pop();
    expect(tracker.used).toStrictEqual(used);
  });
});
