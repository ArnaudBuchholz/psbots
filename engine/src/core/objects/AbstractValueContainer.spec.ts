import { describe, it, expect, beforeEach } from 'vitest';
import type { MemoryType, Value } from '@api/index.js';
import { USER_MEMORY_TYPE } from '@api/index.js';
import { InternalException, checkArrayValue } from '@sdk/index.js';
import { MemoryTracker } from '@core/index.js';
import { AbstractValueContainer } from './AbstractValueContainer.js';
import { testCheckFunction, toValue, values } from '@test/index.js';

class TestValueArray extends AbstractValueContainer {
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

beforeEach(() => {
  tracker = new MemoryTracker();
  valueArray = new TestValueArray(tracker, USER_MEMORY_TYPE);
  shared = toValue.createSharedObject();
  expect(shared.object.refCount).toStrictEqual(1);
  valueArray.push(toValue(123), toValue('abc'), shared.value);
  expect(shared.object.refCount).toStrictEqual(2);
  shared.object.release();
  expect(shared.object.refCount).toStrictEqual(1);
});

describe('AbstractValueArray.check', () => {
  // valueArray being set in beforeEach, it can't be used in testCheckFunction
  it('validates an AbstractValueArray', () => {
    expect(() => AbstractValueContainer.check(valueArray)).not.toThrowError();
  });

  testCheckFunction<AbstractValueContainer>({
    check: AbstractValueContainer.check,
    valid: [],
    invalid: [...values.all]
  });
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
    expect(() => checkArrayValue(value)).not.toThrowError();
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

describe('IReadOnlyArray', () => {
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
});
