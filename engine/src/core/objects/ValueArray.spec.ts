import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Value } from '@api/index.js';
import { nullValue, USER_MEMORY_TYPE } from '@api/index.js';
import { RangeCheckException, VmOverflowException, assert, isArrayValue } from '@sdk/index.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { ValueArray } from './ValueArray.js';
import { toValue } from '@test/index.js';

let tracker: MemoryTracker;
let valueArray: ValueArray;
let shared: ReturnType<typeof toValue.createSharedObject>;

beforeEach(() => {
  tracker = new MemoryTracker();
  const result = ValueArray.create(tracker, USER_MEMORY_TYPE, 5, 2);
  assert(result);
  valueArray = result.value;
  shared = toValue.createSharedObject();
  valueArray.push(toValue(123), toValue('abc'), shared.value);
  shared.object.release();
});

afterEach(() => {
  expect(valueArray.release()).toStrictEqual(false);
  expect(shared.object.refCount).toStrictEqual(0);
  expect(tracker.used).toStrictEqual(0);
});

describe('toValue', () => {
  it('fails on invalid combinations', () => {
    expect(() => valueArray.toValue({ isReadOnly: false, isExecutable: true })).toThrowError();
  });

  it('returns a valid array value (!isReadOnly & !isExecutable)', () => {
    const value = valueArray.toValue({ isReadOnly: false });
    expect(isArrayValue(value)).toStrictEqual(true);
    expect(value.isReadOnly).toStrictEqual(false);
    expect(value.isExecutable).toStrictEqual(false);
  });

  it('returns a valid array value (!isReadOnly & isExecutable)', () => {
    const value = valueArray.toValue({ isReadOnly: true, isExecutable: true });
    expect(isArrayValue(value)).toStrictEqual(true);
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

describe('memory', () => {
  it('handles creation failure', () => {
    const tracker = new MemoryTracker({ total: 1 });
    const creationResult = ValueArray.create(tracker, USER_MEMORY_TYPE, 10, 1);
    expect(creationResult).toStrictEqual({ success: false, error: expect.any(VmOverflowException) });
  });

  it('handles allocation failure of the increment', () => {
    const tracker = new MemoryTracker({ total: 100 });
    const creationResult = ValueArray.create(tracker, USER_MEMORY_TYPE, 1, 10000);
    assert(creationResult);
    const valueArray = creationResult.value;
    valueArray.push(toValue(0));
    const result = valueArray.set(5, toValue(1));
    expect(result).toStrictEqual({ success: false, error: expect.any(VmOverflowException) });
  });
});

describe('IArray', () => {
  it('adds memory when setting item beyond initial capacity', () => {
    const initial = tracker.used;
    valueArray.set(5, toValue(0));
    expect(tracker.used).toBeGreaterThan(initial);
  });

  it('does not change memory when replacing an item', () => {
    const initial = tracker.used;
    valueArray.set(0, toValue(0));
    expect(tracker.used).toStrictEqual(initial);
  });

  it('allows setting a new item', () => {
    expect(valueArray.set(3, toValue(456))).toStrictEqual({ success: true, value: nullValue });
    expect(valueArray.ref).toStrictEqual<Value[]>([toValue(123), toValue('abc'), shared.value, toValue(456)]);
  });

  it('allows overriding an item', () => {
    const { used: memoryUsedBefore } = tracker;
    expect(valueArray.set(0, toValue(-1))).toStrictEqual({ success: true, value: toValue(123) });
    expect(valueArray.ref).toStrictEqual<Value[]>([toValue(-1), toValue('abc'), shared.value]);
    expect(tracker.used).toStrictEqual(memoryUsedBefore);
  });

  it('fails with RangeCheckException on invalid index', () => {
    expect(valueArray.set(-1, toValue(0))).toStrictEqual({ success: false, error: expect.any(RangeCheckException) });
  });

  describe('handling tracked values', () => {
    it('increases value ref', () => {
      expect(valueArray.set(0, shared.value)).toStrictEqual({ success: true, value: toValue(123) });
      expect(shared.object.refCount).toStrictEqual(2);
    });

    it('releases value ref', () => {
      shared.object.addRef();
      expect(valueArray.set(2, toValue(0))).toStrictEqual({ success: true, value: shared.value });
      expect(shared.object.refCount).toStrictEqual(1);
      shared.object.release(); // to fit afterEach checks
    });

    it('releases value ref (value is destroyed)', () => {
      expect(valueArray.set(2, toValue(0))).toStrictEqual({ success: true, value: nullValue });
      expect(shared.object.refCount).toStrictEqual(0);
    });
  });
});
