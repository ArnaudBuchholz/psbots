import { describe, it, expect, beforeEach } from 'vitest';
import type { Value } from '@api/index.js';
import { USER_MEMORY_TYPE, ValueType } from '@api/index.js';
import { StackUnderflowException, TypeCheckException, UnmatchedMarkException } from '@sdk/index.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { OperandStack } from './OperandStack.js';
import { toValue } from '@test/index.js';

let tracker: MemoryTracker;
let stack: OperandStack;

beforeEach(() => {
  tracker = new MemoryTracker();
  stack = new OperandStack(tracker, USER_MEMORY_TYPE);
  stack.push(toValue('abc'), toValue(123));
});

describe('check', () => {
  it('retrieves values of any type (1)', () => {
    expect(stack.check(null)).toStrictEqual<Value[]>([toValue(123)]);
  });

  it('retrieves values of any type (2)', () => {
    expect(stack.check(null, null)).toStrictEqual<Value[]>([toValue(123), toValue('abc')]);
  });

  it('retrieves values of a given type (1)', () => {
    expect(stack.check(ValueType.integer)).toStrictEqual<Value[]>([toValue(123)]);
  });

  it('retrieves values of a given type (2)', () => {
    expect(stack.check(ValueType.integer, ValueType.string)).toStrictEqual<Value[]>([toValue(123), toValue('abc')]);
  });

  it('fails with StackUnderflow if not enough values (any)', () => {
    expect(() => stack.check(null, null, null)).toThrowError(StackUnderflowException);
  });

  it('fails with StackUnderflow if not enough values (typed)', () => {
    expect(() => stack.check(ValueType.integer, ValueType.string, ValueType.integer)).toThrowError(
      StackUnderflowException
    );
  });

  it('fails with TypeCheck on unmatched type (1)', () => {
    expect(() => stack.check(ValueType.string)).toThrowError(TypeCheckException);
  });

  it('fails with TypeCheck on unmatched type (2)', () => {
    expect(() => stack.check(ValueType.integer, ValueType.integer)).toThrowError(TypeCheckException);
  });

  it('does not addValueRef tracked values', () => {
    const { object, value } = toValue.createSharedObject();
    stack.push(value);
    expect(object.refCount).toStrictEqual(2);
    const [checkedValue] = stack.check(null);
    expect(checkedValue).toStrictEqual(value);
    expect(object.refCount).toStrictEqual(2);
  });
});

describe('findMarkPos', () => {
  it('gives position of the mark (1)', () => {
    stack.push(toValue.mark);
    expect(stack.findMarkPos()).toStrictEqual(0);
  });

  it('gives position of the mark (2)', () => {
    stack.push(toValue.mark, toValue(456));
    expect(stack.findMarkPos()).toStrictEqual(1);
  });

  it('fails with UnmatchedMark if no mark found', () => {
    expect(() => stack.findMarkPos()).toThrowError(UnmatchedMarkException);
  });
});
