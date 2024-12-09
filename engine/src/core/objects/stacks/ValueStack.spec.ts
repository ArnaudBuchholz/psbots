import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { nullValue, USER_MEMORY_TYPE } from '@api/index.js';
import type { Result, Value } from '@api/index.js';
import { assert, StackUnderflowException } from '@sdk/index.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { ValueStack } from './ValueStack.js';
import { toValue } from '@test/index.js';

let tracker: MemoryTracker;
let stack: ValueStack;

beforeEach(() => {
  tracker = new MemoryTracker();
  const result = ValueStack.create(tracker, USER_MEMORY_TYPE, 5, 2);
  assert(result);
  stack = result.value;
  stack.push(toValue('abc'), toValue(123));
});

afterEach(() => {
  expect(stack.release()).toStrictEqual(false);
  expect(tracker.used).toStrictEqual(0);
});

describe('top', () => {
  it('returns first item', () => {
    expect(stack.top).toStrictEqual(toValue(123));
  });

  it('returns nullValue after all items were removed', () => {
    stack.clear();
    expect(stack.top).toStrictEqual(nullValue);
  });

  it('does not addValueRef on top', () => {
    const { object, value } = toValue.createSharedObject();
    stack.clear();
    stack.push(value);
    expect(stack.top).toStrictEqual(value);
    expect(object.refCount).toStrictEqual(2);
  });
});

it('stacks item to the beginning of the array', () => {
  expect(stack.ref).toStrictEqual<Value[]>([toValue(123), toValue('abc')]);
});

it('implements a LIFO stack (pop)', () => {
  stack.pop();
  expect(stack.ref).toStrictEqual<Value[]>([toValue('abc')]);
});

it('does not fail pop after all items were removed', () => {
  stack.clear();
  expect(stack.pop()).toStrictEqual(nullValue);
});
