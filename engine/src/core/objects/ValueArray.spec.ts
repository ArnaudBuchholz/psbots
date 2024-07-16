import { it, expect, beforeEach } from 'vitest';
import type { Value } from '@api/index.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { ValueArray } from './ValueArray.js';
import { toValue } from '@test/index.js';

let tracker: MemoryTracker;
let array: ValueArray;

beforeEach(() => {
  tracker = new MemoryTracker();
  array = new ValueArray(tracker, 'user');
  array.push(toValue(1), toValue(2));
});

it('implements a LIFO array (pop)', () => {
  array.pop();
  expect(array.ref).toStrictEqual<Value[]>([toValue(1)]);
});

it('implements a LIFO array (push)', () => {
  array.push(toValue(3));
  expect(array.ref).toStrictEqual<Value[]>([toValue(1), toValue(2), toValue(3)]);
});
