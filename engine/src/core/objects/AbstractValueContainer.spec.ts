import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { MemoryType, Result, Value } from '@api/index.js';
import { nullValue, USER_MEMORY_TYPE } from '@api/index.js';
import { isArrayValue, VmOverflowException } from '@sdk/index.js';
import { MemoryTracker } from '@core/MemoryTracker.js';
import { AbstractValueContainer } from './AbstractValueContainer.js';
import { toValue } from '@test/index.js';

class TestValueArray extends AbstractValueContainer {
  constructor(memoryTracker: MemoryTracker, memoryType: MemoryType, initialCapacity: number, capacityIncrement: number) {
    super(memoryTracker, memoryType, initialCapacity, capacityIncrement);
  }

  protected pushImpl(value: Value): Result {
    this._values.push(value);
    return { success: true, value: undefined };
  }

  private _popNull: boolean = false;

  protected popImpl() {
    const value = this._values.at(-1) ?? nullValue;
    this._values.pop();
    if (this._popNull) {
      return nullValue;
    }
    return value;
  }

  public getMemoryTracker(): MemoryTracker {
    return this.memoryTracker;
  }

  public getMemoryType(): MemoryType {
    return this.memoryType;
  }
}

let tracker: MemoryTracker;
let valueArray: TestValueArray;
let shared: ReturnType<typeof toValue.createSharedObject>;

beforeEach(() => {
  tracker = new MemoryTracker();
  valueArray = new TestValueArray(tracker, USER_MEMORY_TYPE, 5, 2);
  shared = toValue.createSharedObject();
  expect(shared.object.refCount).toStrictEqual(1);
  valueArray.push(toValue(123), toValue('abc'), shared.value);
  expect(shared.object.refCount).toStrictEqual(2);
  shared.object.release();
  expect(shared.object.refCount).toStrictEqual(1);
});

describe('toValue', () => {
  it('fails on invalid combinations (!isReadOnly/isExecutable)', () => {
    expect(() => valueArray.toValue({ isReadOnly: false, isExecutable: true })).toThrowError();
  });

  it('fails on invalid combinations (!isReadOnly/!isExecutable)', () => {
    expect(() => valueArray.toValue({ isReadOnly: false, isExecutable: false })).toThrowError();
  });

  it('fails on invalid combinations (isReadOnly/isExecutable)', () => {
    expect(() => valueArray.toValue({ isReadOnly: true, isExecutable: true })).toThrowError();
  });

  it('returns a valid array value (default: isReadOnly & !isExecutable)', () => {
    const value = valueArray.toValue();
    expect(isArrayValue(value)).toStrictEqual(true);
    expect(value.isReadOnly).toStrictEqual(true);
    expect(value.isExecutable).toStrictEqual(false);
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

    describe('staying in the initial capacity', () => {
      afterEach(() => {
        expect(tracker.used).toStrictEqual(memoryUsedBefore); // Initial capacity
      });

      it('releases tracked values when removing items', () => {
        expect(valueArray.pop()).toStrictEqual(nullValue);
        expect(shared.object.refCount).toStrictEqual(0);
      });
  
      it('releases memory when removing items', () => {
        shared.object.addRef();
        expect(valueArray.pop()).toStrictEqual(shared.value);
        expect(shared.object.refCount).toStrictEqual(1);
        shared.object.release(); // to fit afterEach checks
      });
    });

    describe('going beyond initial capacity', () => {
      it('handles allocation failure of the increment', () => {
        const tracker = new MemoryTracker({ total: 100 });
        const valueArray = new TestValueArray(tracker, USER_MEMORY_TYPE, 1, 10000);
        valueArray.push(toValue(0));
        const result = valueArray.push(toValue(1));
        if (result.success) {
          expect.unreachable();
        }
        expect(result.error).toBeInstanceOf(VmOverflowException);
      });

      it('allocates an increment when going beyond initial capacity (one value)', () => {
        valueArray.push(toValue(0), toValue(1), toValue(2));
        expect(valueArray.length).toStrictEqual(6);
        expect(tracker.used).toBeGreaterThan(memoryUsedBefore);
      });

      it('fills the increment (second value)', () => {
        valueArray.push(toValue(0), toValue(1), toValue(2));
        const memoryUsed = tracker.used;
        valueArray.push(toValue(3));
        expect(valueArray.length).toStrictEqual(7);
        expect(tracker.used).toStrictEqual(memoryUsed);
      });

      it('frees the memory when the values count decrease (one value)', () => {
        valueArray.push(toValue(0), toValue(1), toValue(2));
        expect(valueArray.pop()).toStrictEqual(toValue(2));
        expect(tracker.used).toStrictEqual(memoryUsedBefore);
      })

      it('frees the memory when the values count decrease (two values)', () => {
        valueArray.push(toValue(0), toValue(1), toValue(2), toValue(3));
        expect(valueArray.pop()).toStrictEqual(toValue(3));
        expect(tracker.used).toBeGreaterThan(memoryUsedBefore);
        expect(valueArray.pop()).toStrictEqual(toValue(2));
        expect(tracker.used).toStrictEqual(memoryUsedBefore);
      });
    });

    it('does not fail after all items were removed', () => {
      valueArray.clear();
      expect(valueArray.pop()).toStrictEqual(nullValue);
    });
  });

  afterEach(() => {
    expect(valueArray.release()).toStrictEqual(false);
    expect(shared.object.refCount).toStrictEqual(0);
    expect(tracker.used).toStrictEqual(0);
  });
});

it('offers a Value[] reference', () => {
  expect(valueArray.ref).toStrictEqual<Value[]>([toValue(123), toValue('abc'), shared.value]);
});

it('offers a Value[] reference (limited to initial capacity)', () => {
  valueArray.push(
    toValue(0),
    toValue(1),
    toValue(2),
    toValue(3),
    toValue(4)
  );
  expect(valueArray.ref).toStrictEqual<Value[]>([
    toValue(123),
    toValue('abc'),
    shared.value,
    toValue(0),
    toValue(1)
  ]);
});

describe('IReadOnlyArray', () => {
  it('exposes length', () => {
    expect(valueArray.length).toStrictEqual(3);
  });

  it('exposes at', () => {
    expect(valueArray.at(0)).toStrictEqual<Value>(toValue(123));
  });

  it('controls boundaries (-1)', () => {
    expect(valueArray.at(-1)).toStrictEqual(nullValue);
  });

  it('controls boundaries (0-based)', () => {
    expect(valueArray.at(valueArray.length)).toStrictEqual(nullValue);
  });
});
