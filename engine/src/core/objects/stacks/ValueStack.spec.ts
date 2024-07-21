import { describe, it, expect, beforeEach } from 'vitest';
import { USER_MEMORY_TYPE } from '@api/index.js';
import type { Value } from '@api/index.js';
import { StackUnderflowException } from '@sdk/index.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { ValueStack } from './ValueStack.js';
import { toValue } from '@test/index.js';

let tracker: MemoryTracker;
let stack: ValueStack;

beforeEach(() => {
  tracker = new MemoryTracker();
  stack = new ValueStack(tracker, USER_MEMORY_TYPE);
  stack.push(toValue('abc'), toValue(123));
});

describe('top', () => {
  it('returns first item', () => {
    expect(stack.top).toStrictEqual<Value>(toValue(123));
  });

  it('fails pop with StackUnderflow after all items were removed', () => {
    stack.clear();
    expect(() => stack.top).toThrowError(StackUnderflowException);
  });

  it('does not addValueRef on top', () => {
    const { object, value } = toValue.createSharedObject();
    stack.clear();
    stack.push(value);
    expect(stack.top).toStrictEqual<Value>(value);
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

it('fails pop with StackUnderflow after all items were removed', () => {
  stack.clear();
  expect(() => stack.pop()).toThrowError(StackUnderflowException);
});
