import { describe, it, expect, beforeEach } from 'vitest';
import type { MemoryType, Value } from '@api/index.js';
import { USER_MEMORY_TYPE, ValueType } from '@api/index.js';
import { InternalException, RangeCheckException, checkArrayValue } from '@sdk/index.js';
import { MemoryTracker } from '@core/index.js';
import { AbstractValueArray } from './AbstractValueArray.js';
import { testCheckFunction, toValue, values } from '@test/index.js';

class TestValueArray extends AbstractValueArray {
  protected pushImpl(value: Value): void {
    this._values.push(value);
  }

  private _popNull: boolean = false;

  protected popImpl(): Value | null {
    if (this._popNull) {
      return null;
    }
    const value = this.atOrThrow(-1);
    this._values.pop();
    return value;
  }

  public getMemoryTracker(): MemoryTracker {
    return this.memoryTracker;
  }

  public getMemoryType(): MemoryType {
    return this.memoryType;
  }

  public setPopNull(): void {
    this._popNull = true;
  }
}

let tracker: MemoryTracker;
let valueArray: TestValueArray;
let shared: ReturnType<typeof toValue.createSharedObject>;
let initialUsedMemory: number;

beforeEach(() => {
  tracker = new MemoryTracker();
  valueArray = new TestValueArray(tracker, USER_MEMORY_TYPE);
  initialUsedMemory = tracker.used;
  shared = toValue.createSharedObject();
  expect(shared.object.refCount).toStrictEqual(1);
  valueArray.push(toValue(123));
  valueArray.push(toValue('abc'));
  valueArray.push(shared.value);
  expect(shared.object.refCount).toStrictEqual(2);
  shared.object.release();
  expect(shared.object.refCount).toStrictEqual(1);
});

describe('AbstractValueArray.check', () => {
  // valueArray being set in beforeEach, it can't be used in testCheckFunction
  it('validates an AbstractValueArray', () => {
    expect(() => AbstractValueArray.check(valueArray)).not.toThrowError();
  });

  testCheckFunction<AbstractValueArray>({
    check: AbstractValueArray.check,
    valid: [],
    invalid: [...values.all]
  });
});

describe('toValue', () => {
  it('fails on invalid combinations', () => {
    expect(() => valueArray.toValue({ isReadOnly: false, isExecutable: true })).toThrowError();
  });

  it('returns a valid array value (default: isReadOnly & !isExecutable)', () => {
    const value = valueArray.toValue();
    expect(() => checkArrayValue(value)).not.toThrowError();
    expect(value.isReadOnly).toStrictEqual(true);
    expect(value.isExecutable).toStrictEqual(false);
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

  it('does *not* add a reference count', () => {
    valueArray.toValue();
    expect(valueArray.refCount).toStrictEqual(1);
  });
});

describe('memory', () => {
  it('tracks memory used', () => {
    expect(tracker.used).not.toStrictEqual(0);
  });

  it('exposes the memory tracker', () => {
    expect(valueArray.getMemoryTracker()).toStrictEqual(tracker);
  });

  it('exposes the memory type', () => {
    expect(valueArray.getMemoryType()).toStrictEqual(USER_MEMORY_TYPE);
  });

  describe('removing items', () => {
    let memoryUsedBefore: number;

    beforeEach(() => {
      memoryUsedBefore = tracker.used;
    });

    it('releases memory and tracked values when removing items', () => {
      expect(valueArray.pop()).toStrictEqual(null);
      expect(tracker.used).toBeLessThan(memoryUsedBefore);
      expect(shared.object.refCount).toStrictEqual(0);
    });

    it('releases memory when removing items', () => {
      shared.object.addRef();
      expect(valueArray.pop()).toStrictEqual(shared.value);
      expect(tracker.used).toBeLessThan(memoryUsedBefore);
      expect(shared.object.refCount).toStrictEqual(1);
    });

    it('does not release memory if popImpl returns null', () => {
      valueArray.setPopNull();
      expect(valueArray.pop()).toStrictEqual(null);
      expect(tracker.used).toStrictEqual(memoryUsedBefore);
    });

    it('fails after all items were removed', () => {
      valueArray.clear();
      expect(() => valueArray.pop()).toThrowError(InternalException);
    });
  });

  it('releases memory once disposed', () => {
    expect(valueArray.release()).toStrictEqual(false);
    expect(shared.object.refCount).toStrictEqual(0);
    expect(tracker.used).toStrictEqual(0);
  });
});

it('offers a Value[] reference', () => {
  expect(valueArray.ref).toStrictEqual<Value[]>([toValue(123), toValue('abc'), shared.value]);
});

describe('IArray', () => {
  it('exposes length', () => {
    expect(valueArray.length).toStrictEqual(3);
  });

  it('exposes at', () => {
    expect(valueArray.at(0)).toStrictEqual<Value>(toValue(123));
  });

  it('controls boundaries (-1)', () => {
    expect(valueArray.at(-1)).toStrictEqual(null);
  });

  it('controls boundaries (0-based)', () => {
    expect(valueArray.at(valueArray.length)).toStrictEqual(null);
  });

  describe('set', () => {
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
      });

      it('releases value ref (value is destroyed)', () => {
        expect(valueArray.set(2, toValue(0))).toStrictEqual(null);
        expect(shared.object.refCount).toStrictEqual(0);
      });
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

it('offers some', () => {
  expect(valueArray.some((value) => value.type === ValueType.integer && value.integer === 123)).toStrictEqual(true);
  expect(valueArray.some((value) => value.type === ValueType.integer && value.integer === 456)).toStrictEqual(false);
});

describe('splice', () => {
  it('removes values from the array and return them', () => {
    expect(valueArray.splice(0, 3)).toStrictEqual<(Value | null)[]>([toValue(123), toValue('abc'), null]);
    expect(tracker.used).toStrictEqual(initialUsedMemory);
    expect(shared.object.refCount).toStrictEqual(0);
  });

  it('removes and adds values to the array (1)', () => {
    expect(valueArray.splice(1, 1, toValue(456))).toStrictEqual<Value[]>([toValue('abc')]);
    expect(valueArray.ref).toStrictEqual<Value[]>([toValue(123), toValue(456), shared.value]);
  });

  it('removes and adds values to the array (2)', () => {
    shared.object.addRef();
    expect(valueArray.splice(2, 1, toValue(456), toValue('def'))).toStrictEqual<Value[]>([shared.value]);
    expect(valueArray.ref).toStrictEqual<Value[]>([toValue(123), toValue('abc'), toValue(456), toValue('def')]);
    expect(shared.object.refCount).toStrictEqual(1);
  });

  it('inserts values in the array', () => {
    expect(valueArray.splice(2, 0, toValue(456))).toStrictEqual<Value[]>([]);
    expect(valueArray.ref).toStrictEqual<Value[]>([toValue(123), toValue('abc'), toValue(456), shared.value]);
  });

  it('handles tracked value (add)', () => {
    valueArray.splice(1, 1, shared.value);
    expect(valueArray.ref).toStrictEqual<Value[]>([toValue(123), shared.value, shared.value]);
    expect(shared.object.refCount).toStrictEqual(2);
  });

  it('handles tracked value (add / remove)', () => {
    valueArray.splice(2, 1, shared.value);
    expect(valueArray.ref).toStrictEqual<Value[]>([toValue(123), toValue('abc'), shared.value]);
    expect(shared.object.refCount).toStrictEqual(1);
    expect(shared.object.disposeCalled).toStrictEqual(0);
  });
});
