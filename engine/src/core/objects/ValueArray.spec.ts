import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Value } from '@api/index.js';
import { USER_MEMORY_TYPE } from '@api/index.js';
import { InternalException, RangeCheckException, checkArrayValue } from '@sdk/index.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { ValueArray } from './ValueArray.js';
import { testCheckFunction, toValue, values } from '@test/index.js';

let tracker: MemoryTracker;
let valueArray: ValueArray;
let shared: ReturnType<typeof toValue.createSharedObject>;

beforeEach(() => {
  tracker = new MemoryTracker();
  valueArray = new ValueArray(tracker, USER_MEMORY_TYPE);
  shared = toValue.createSharedObject();
  valueArray.push(toValue(123), toValue('abc'), shared.value);
  shared.object.release();
});

afterEach(() => {
  expect(valueArray.release()).toStrictEqual(false);
  expect(shared.object.refCount).toStrictEqual(0);
  expect(tracker.used).toStrictEqual(0);
});

describe('ValueArray.check', () => {
  // valueArray being set in beforeEach, it can't be used in testCheckFunction
  it('validates an ValueArray', () => {
    expect(() => ValueArray.check(valueArray)).not.toThrowError();
  });

  testCheckFunction<ValueArray>({
    check: ValueArray.check,
    valid: [],
    invalid: [...values.all]
  });
});

describe('toValue', () => {
  it('fails on invalid combinations', () => {
    expect(() => valueArray.toValue({ isReadOnly: false, isExecutable: true })).toThrowError();
  });

  it('returns a valid array value (!isReadOnly & !isExecutable)', () => {
    const value = valueArray.toValue({ isReadOnly: false });
    expect(() => checkArrayValue(value)).not.toThrowError();
    expect(value.isReadOnly).toStrictEqual(false);
    expect(value.isExecutable).toStrictEqual(false);
  });

  it('returns a valid array value (!isReadOnly & isExecutable)', () => {
    const value = valueArray.toValue({ isReadOnly: true, isExecutable: true });
    expect(() => checkArrayValue(value)).not.toThrowError();
    expect(value.isReadOnly).toStrictEqual(true);
    expect(value.isExecutable).toStrictEqual(true);
  });
});

it('implements a LIFO array (pop)', () => {
  valueArray.pop();
  expect(valueArray.ref).toStrictEqual<Value[]>([toValue(123), toValue('abc')]);
});

it('implements a LIFO array (push)', () => {
  valueArray.push(toValue(0));
  expect(valueArray.ref).toStrictEqual<Value[]>([toValue(123), toValue('abc'), shared.value, toValue(0)]);
});

describe('IArray', () => {
  it('adds memory when setting new item', () => {
    const initial = tracker.used;
    valueArray.set(valueArray.length, toValue(0));
    expect(tracker.used).toBeGreaterThan(initial);
  });

  it('does not change memory when replacing an item', () => {
    const initial = tracker.used;
    valueArray.set(0, toValue(0));
    expect(tracker.used).toStrictEqual(initial);
  });

  it('allows setting a new item', () => {
    expect(valueArray.set(3, toValue(456))).toStrictEqual(null);
    expect(valueArray.ref).toStrictEqual<Value[]>([toValue(123), toValue('abc'), shared.value, toValue(456)]);
  });

  it('allows overriding an item', () => {
    const { used: memoryUsedBefore } = tracker;
    expect(valueArray.set(0, toValue(-1))).toStrictEqual(toValue(123));
    expect(valueArray.ref).toStrictEqual<Value[]>([toValue(-1), toValue('abc'), shared.value]);
    expect(tracker.used).toStrictEqual(memoryUsedBefore);
  });

  it('fails with RangeCheckException on invalid index', () => {
    expect(() => valueArray.set(-1, toValue(0))).toThrowError(RangeCheckException);
  });

  describe('handling tracked values', () => {
    it('increases value ref', () => {
      expect(valueArray.set(0, shared.value)).toStrictEqual(toValue(123));
      expect(shared.object.refCount).toStrictEqual(2);
    });

    it('releases value ref', () => {
      shared.object.addRef();
      expect(valueArray.set(2, toValue(0))).toStrictEqual(shared.value);
      expect(shared.object.refCount).toStrictEqual(1);
      shared.object.release(); // to fit afterEach checks
    });

    it('releases value ref (value is destroyed)', () => {
      expect(valueArray.set(2, toValue(0))).toStrictEqual(null);
      expect(shared.object.refCount).toStrictEqual(0);
    });
  });
});

describe('shift / unshift', () => {
  it('injects a value at the beginning of the array', () => {
    valueArray.unshift(toValue(456));
    expect(valueArray.ref).toStrictEqual<Value[]>([toValue(456), toValue(123), toValue('abc'), shared.value]);
  });

  it('injects a tracked value at the beginning of the array', () => {
    valueArray.unshift(shared.value);
    expect(valueArray.ref).toStrictEqual<Value[]>([shared.value, toValue(123), toValue('abc'), shared.value]);
    expect(shared.object.refCount).toStrictEqual(2);
  });

  it('removes the first value of the array', () => {
    expect(valueArray.shift()).toStrictEqual<Value>(toValue(123));
  });

  it('removes the first tracked value of the array', () => {
    valueArray.unshift(shared.value);
    expect(valueArray.shift()).toStrictEqual<Value>(shared.value);
    expect(shared.object.refCount).toStrictEqual(1);
  });

  it('removes the first tracked value of the array (destroyed)', () => {
    valueArray.unshift(shared.value);
    valueArray.pop();
    expect(valueArray.shift()).toStrictEqual<Value | null>(null);
  });

  it('throws an error when no more items are available', () => {
    valueArray.clear();
    expect(() => valueArray.shift()).toThrowError(InternalException);
  });
});
