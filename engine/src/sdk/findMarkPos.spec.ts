import { it, expect, beforeEach } from 'vitest';
import { USER_MEMORY_TYPE } from '@api/index.js';
import { UnmatchedMarkException } from '@sdk/exceptions/UnmatchedMarkException.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { ValueStack } from '@core/objects/stacks/ValueStack.js';
import { findMarkPos } from './findMarkPos.js';
import { toValue } from '@test/index.js';

let tracker: MemoryTracker;
let stack: ValueStack;

beforeEach(() => {
  tracker = new MemoryTracker();
  stack = new ValueStack(tracker, USER_MEMORY_TYPE);
  stack.push(toValue('abc'), toValue(123));
});

it('gives position of the mark (1)', () => {
  stack.push(toValue.mark);
  expect(findMarkPos(stack)).toStrictEqual(0);
});

it('gives position of the mark (2)', () => {
  stack.push(toValue.mark, toValue(456));
  expect(findMarkPos(stack)).toStrictEqual(1);
});

it('fails with UnmatchedMark if no mark found', () => {
  expect(() => findMarkPos(stack)).toThrowError(UnmatchedMarkException);
});
