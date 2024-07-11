import { describe, it, expect, beforeEach } from 'vitest';
import type { Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { InternalException, RangeCheckException } from '@sdk/exceptions/index.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { ValueArray } from './ValueArray.js';
import { toValue } from '@test/index.js';
import { checkArrayValue } from '@sdk/index.js';

let tracker: MemoryTracker;
let array: ValueArray;

beforeEach(() => {
  tracker = new MemoryTracker();
  array = new ValueArray(tracker, 'user');
  array.push(toValue(1), toValue(2));
});

it('tracks memory used', () => {
  expect(tracker.used).not.toStrictEqual(0);
});

it('offers an array reference', () => {
  expect(array.ref).toStrictEqual<Value[]>([toValue(1), toValue(2)]);
});

it('implements a LIFO array (pop)', () => {
  array.pop();
  expect(array.ref).toStrictEqual<Value[]>([toValue(1)]);
});

it('implements shift', () => {
  const value = array.shift();
  expect(array.ref).toStrictEqual<Value[]>([toValue(2)]);
  expect(value).toStrictEqual<Value>(toValue(1));
});

it('fails shift on empty array', () => {
  const emptyArray = new ValueArray(tracker, 'user');
  expect(() => emptyArray.shift()).toThrowError(InternalException);
});

it('implements unshift', () => {
  array.unshift(toValue(3));
  expect(array.ref).toStrictEqual<Value[]>([toValue(3), toValue(1), toValue(2)]);
});

describe('set', () => {
  it('allows setting a new item', () => {
    expect(array.set(2, toValue(3))).toStrictEqual(null);
    expect(array.ref).toStrictEqual<Value[]>([toValue(1), toValue(2), toValue(3)]);
  });

  it('allows overriding an item', () => {
    const initialMemory = tracker.used;
    expect(array.set(0, toValue(-1))).toStrictEqual(toValue(1));
    expect(array.ref).toStrictEqual<Value[]>([toValue(-1), toValue(2)]);
    expect(tracker.used).toStrictEqual(initialMemory);
  });

  it('fails with RangeCheckException on invalid index', () => {
    expect(() => array.set(-1, toValue(0))).toThrowError(RangeCheckException);
  });

  describe('handling tracked values', () => {
    let trackedObject: ValueArray;
    let trackedValue: Value;

    beforeEach(() => {
      trackedObject = new ValueArray(tracker, 'user');
      trackedValue = trackedObject.toValue();
      expect(trackedObject.release()).toStrictEqual(true);
      expect(trackedObject.refCount).toStrictEqual(1);
    });

    it('increases value ref', () => {
      expect(array.set(0, trackedValue)).toStrictEqual(toValue(1));
      expect(trackedObject.refCount).toStrictEqual(2);
    });

    it('releases value ref', () => {
      array.set(0, trackedValue);
      expect(array.set(0, toValue(0))).toStrictEqual(trackedValue);
      expect(trackedObject.refCount).toStrictEqual(1);
    });

    it('releases value ref (value is destroyed)', () => {
      array.set(0, trackedValue);
      trackedObject.release();
      expect(array.set(0, toValue(0))).toStrictEqual(null);
      expect(trackedObject.refCount).toStrictEqual(0);
    });
  });
});

it('offers some', () => {
  expect(array.some((value) => value.type === ValueType.integer && value.integer === 2)).toStrictEqual(true);
  expect(array.some((value) => value.type === ValueType.integer && value.integer === 3)).toStrictEqual(false);
});

describe('typeguard function', () => {
  it('recognizes a ValueArray', () => {
    expect(() => ValueArray.check(array)).not.toThrowError();
  });

  it('rejects non objects', () => {
    expect(() => ValueArray.check(1)).toThrowError();
  });

  it('rejects null', () => {
    expect(() => ValueArray.check(null)).toThrowError();
  });

  it('rejects other objects', () => {
    expect(() => ValueArray.check(toValue(1))).toThrowError();
  });
});

describe('toValue', () => {
  it('fails on invalid combinations', () => {
    expect(() => array.toValue({ isReadOnly: false, isExecutable: true })).toThrowError();
  });

  it('returns a valid array value (default: isReadOnly & !isExecutable)', () => {
    const value = array.toValue();
    expect(() => checkArrayValue(value)).not.toThrowError();
    expect(value.isReadOnly).toStrictEqual(true);
    expect(value.isExecutable).toStrictEqual(false);
  });

  it('returns a valid array value (!isReadOnly & !isExecutable)', () => {
    const value = array.toValue({ isReadOnly: false });
    expect(() => checkArrayValue(value)).not.toThrowError();
    expect(value.isReadOnly).toStrictEqual(false);
    expect(value.isExecutable).toStrictEqual(false);
  });

  it('returns a valid array value (!isReadOnly & isExecutable)', () => {
    const value = array.toValue({ isReadOnly: true, isExecutable: true });
    expect(() => checkArrayValue(value)).not.toThrowError();
    expect(value.isReadOnly).toStrictEqual(true);
    expect(value.isExecutable).toStrictEqual(true);
  });

  it('adds a reference count', () => {
    array.toValue();
    expect(array.refCount).toStrictEqual(2);
  });
});
