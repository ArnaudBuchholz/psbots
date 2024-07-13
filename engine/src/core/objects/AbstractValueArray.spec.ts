import { describe, it, expect, beforeEach } from 'vitest';
import type { IReadOnlyArray, MemoryType, Value } from '@api/index.js';
import { ValueType } from '@api/index.js';
import { MemoryTracker, ShareableObject } from '@core/index.js';
import { InternalException, RangeCheckException, StackUnderflowException } from '@sdk/exceptions/index.js';
import { AbstractValueArray } from './AbstractValueArray.js';
import { testCheckFunction, toValue, values } from '@test/index.js';
import { checkArrayValue } from '@sdk/index.js';

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

  public clear(): void {
    this._clear();
  }

  public setPopNull(): void {
    this._popNull = true;
  }
}

class TestShareableObject extends ShareableObject {
  public disposeCalled: number = 0;

  protected _dispose(): void {
    ++this.disposeCalled;
  }
}

let tracker: MemoryTracker;
let valueArray: TestValueArray;
let sharedObject: TestShareableObject;
let sharedValue: Value;
let initialUsedMemory: number;

beforeEach(() => {
  tracker = new MemoryTracker();
  valueArray = new TestValueArray(tracker, 'user');
  initialUsedMemory = tracker.used;
  sharedObject = new TestShareableObject();
  sharedValue = {
    type: ValueType.array,
    isReadOnly: true,
    isExecutable: false,
    tracker: ShareableObject.tracker,
    array: sharedObject as unknown as IReadOnlyArray
  };
  expect(sharedObject.refCount).toStrictEqual(1);
  valueArray.push(toValue(1));
  valueArray.push(toValue('abc'));
  valueArray.push(sharedValue);
  expect(sharedObject.refCount).toStrictEqual(2);
  sharedObject.release();
  expect(sharedObject.refCount).toStrictEqual(1);
});

it('tracks memory used', () => {
  expect(tracker.used).not.toStrictEqual(0);
});

it('exposes the memory tracker', () => {
  expect(valueArray.getMemoryTracker()).toStrictEqual(tracker);
});

it('exposes the memory type', () => {
  expect(valueArray.getMemoryType()).toStrictEqual('user');
});

it('offers a Value[] reference', () => {
  expect(valueArray.ref).toStrictEqual<Value[]>([toValue(1), toValue('abc'), sharedValue]);
});

describe('IArray', () => {
  it('exposes length', () => {
    expect(valueArray.length).toStrictEqual(3);
  });

  it('exposes at', () => {
    expect(valueArray.at(0)).toStrictEqual<Value>(toValue(1));
  });

  it('controls boundaries (-1)', () => {
    expect(valueArray.at(-1)).toStrictEqual(null);
  });

  it('controls boundaries (0-based)', () => {
    expect(valueArray.at(valueArray.length)).toStrictEqual(null);
  });

  describe('set', () => {
    it('allows setting a new item', () => {
      expect(valueArray.set(3, toValue(3))).toStrictEqual(null);
      expect(valueArray.ref).toStrictEqual<Value[]>([toValue(1), toValue('abc'), sharedValue, toValue(3)]);
    });

    it('allows overriding an item', () => {
      const { used: memoryUsedBefore } = tracker;
      expect(valueArray.set(0, toValue(-1))).toStrictEqual(toValue(1));
      expect(valueArray.ref).toStrictEqual<Value[]>([toValue(-1), toValue('abc'), sharedValue]);
      expect(tracker.used).toStrictEqual(memoryUsedBefore);
    });

    it('fails with RangeCheckException on invalid index', () => {
      expect(() => valueArray.set(-1, toValue(0))).toThrowError(RangeCheckException);
    });

    describe('handling tracked values', () => {
      it('increases value ref', () => {
        expect(valueArray.set(0, sharedValue)).toStrictEqual(toValue(1));
        expect(sharedObject.refCount).toStrictEqual(2);
      });

      it('releases value ref', () => {
        sharedObject.addRef();
        expect(valueArray.set(2, toValue(0))).toStrictEqual(sharedValue);
        expect(sharedObject.refCount).toStrictEqual(1);
      });

      it('releases value ref (value is destroyed)', () => {
        expect(valueArray.set(2, toValue(0))).toStrictEqual(null);
        expect(sharedObject.refCount).toStrictEqual(0);
      });
    });
  });
});

describe('removing items', () => {
  let memoryUsedBefore: number;

  beforeEach(() => {
    memoryUsedBefore = tracker.used;
  });

  it('releases memory and tracked values when removing items', () => {
    expect(valueArray.pop()).toStrictEqual(null);
    expect(tracker.used).toBeLessThan(memoryUsedBefore);
    expect(sharedObject.refCount).toStrictEqual(0);
  });

  it('releases memory when removing items', () => {
    sharedObject.addRef();
    expect(valueArray.pop()).toStrictEqual(sharedValue);
    expect(tracker.used).toBeLessThan(memoryUsedBefore);
    expect(sharedObject.refCount).toStrictEqual(1);
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
  expect(sharedObject.refCount).toStrictEqual(0);
  expect(tracker.used).toStrictEqual(0);
});

it('offers some', () => {
  expect(valueArray.some((value) => value.type === ValueType.integer && value.integer === 1)).toStrictEqual(true);
  expect(valueArray.some((value) => value.type === ValueType.integer && value.integer === 2)).toStrictEqual(false);
});

describe('splice', () => {
  it('removes values from the array and return them', () => {
    expect(valueArray.splice(0, 3)).toStrictEqual<(Value | null)[]>([toValue(1), toValue('abc'), null]);
    expect(tracker.used).toStrictEqual(initialUsedMemory);
    expect(sharedObject.refCount).toStrictEqual(0);
  });

  it('removes and adds values to the array (1)', () => {
    expect(valueArray.splice(1, 1, toValue(456))).toStrictEqual<Value[]>([toValue('abc')]);
    expect(valueArray.ref).toStrictEqual<Value[]>([toValue(1), toValue(456), sharedValue]);
  });

  it('removes and adds values to the array (2)', () => {
    sharedObject.addRef();
    expect(valueArray.splice(2, 1, toValue(456), toValue('def'))).toStrictEqual<Value[]>([sharedValue]);
    expect(valueArray.ref).toStrictEqual<Value[]>([toValue(1), toValue('abc'), toValue(456), toValue('def')]);
    expect(sharedObject.refCount).toStrictEqual(1);
  });

  it('removes and adds values to the array (2)', () => {
    sharedObject.addRef();
    expect(valueArray.splice(2, 1, toValue(456), toValue('def'))).toStrictEqual<Value[]>([sharedValue]);
    expect(valueArray.ref).toStrictEqual<Value[]>([toValue(1), toValue('abc'), toValue(456), toValue('def')]);
    expect(sharedObject.refCount).toStrictEqual(1);
  });

  // test edge cases (5, 72, [123])
});

describe('AbstractValueArray.check', () => {
  testCheckFunction<AbstractValueArray>({
    check: AbstractValueArray.check,
    valid: [valueArray],
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

  it('adds a reference count', () => {
    valueArray.toValue();
    expect(valueArray.refCount).toStrictEqual(2);
  });
});
