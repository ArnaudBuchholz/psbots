import { it, expect, beforeEach, vi } from 'vitest';
import type { Value } from '@api/index.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { ValueArray } from './ValueArray.js';
import { toValue } from '@test/index.js';
import { AbstractValueArray } from './AbstractValueArray.js';

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

it('exposes set', () => {
  expect(typeof array.set).toStrictEqual('function');
  expect(array.set.length).toStrictEqual(2);
});

it('implements set based on AbstractValueArray._set', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const spy = vi.spyOn(AbstractValueArray.prototype as any, '_set');
  const value = toValue(0);
  array.set(0, value);
  expect(spy).toHaveBeenCalledWith(0, value);
  spy.mockRestore();
});
